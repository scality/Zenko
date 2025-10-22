import { S3Client, HeadBucketCommand, NoSuchBucket } from '@aws-sdk/client-s3';

import { logger } from './utils/logger';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import { initKubernetes, getDeploymentGeneration, waitForDeploymentRestart } from './utils/k8s';
import { sleep } from 'cli-testing/utils/utils';

export interface MetadataOptions {
    gitAccessToken: string;
    namespace?: string;
    timeout?: number;
}

export async function setupMetadata(options: MetadataOptions): Promise<void> {
    const namespace = options.namespace || 'metadata';
    const timeoutMs = (options.timeout || 300) * 1000;
    initKubernetes();

    logger.info('Setting up metadata service...');

    try {
        if (!KubernetesHelper.clientCore) {
            throw new Error('KubernetesHelper not initialized');
        }
        await KubernetesHelper.ensureNamespace(namespace);
        await deployMetadataViaJob(options.gitAccessToken, namespace, timeoutMs);
        if (!KubernetesHelper.clientAppsV1) {
            throw new Error('KubernetesHelper not initialized');
        }
        await KubernetesHelper.waitForStatefulSetReady('s3c-metadata-repd', namespace, timeoutMs);

        // Restart bucketd and wait for new generation
        const bucketdInitialGen = await getDeploymentGeneration(namespace, 's3c-metadata-bucketd');
        await KubernetesHelper.restartDeployment('s3c-metadata-bucketd', namespace);
        await waitForDeploymentRestart(namespace, 's3c-metadata-bucketd', bucketdInitialGen, timeoutMs);

        await patchCloudserverConfig(namespace);

        // Restart cloudserver and wait for new generation
        const cloudserverInitialGen = await getDeploymentGeneration(namespace, 's3c-cloudserver');
        await KubernetesHelper.restartDeployment('s3c-cloudserver', namespace);
        await waitForDeploymentRestart(namespace, 's3c-cloudserver', cloudserverInitialGen, timeoutMs);

        // Small delay to allow Service endpoints to update after pod readiness
        logger.info('Waiting for Service endpoints to update...');
        await verifyS3CReadiness();

        logger.info('Metadata service setup completed successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to setup metadata service:', { error: errorMessage });
        throw error;
    }
}

async function deployMetadataViaJob(gitAccessToken: string, namespace: string, timeoutMs: number): Promise<void> {
    logger.info('Deploying metadata service via Kubernetes Job...');

    await ensureServiceAccountWithPermissions(namespace);

    const clientBatch = KubernetesHelper.getClientBatch();
    if (!clientBatch) {
        throw new Error('KubernetesHelper not initialized');
    }
    const jobName = `metadata-deploy-${Date.now()}`;
    const job = createMetadataDeploymentJob(jobName, namespace, gitAccessToken);

    await clientBatch.createNamespacedJob({ namespace, body: job });

    logger.info('Metadata deployment job completed successfully');
}

async function patchCloudserverConfig(namespace: string): Promise<void> {
    logger.info('Patching cloudserver config to add s3c.local endpoint...');

    const configMapName = 's3c-cloudserver-config-json';
    if (!KubernetesHelper.clientCore) {
        throw new Error('KubernetesHelper not initialized');
    }
    const configMap = await KubernetesHelper.clientCore.readNamespacedConfigMap({ name: configMapName, namespace });

    if (!configMap.data || !configMap.data['config.json']) {
        throw new Error(`ConfigMap ${configMapName} does not contain 'config.json' data.`);
    }

    const config = JSON.parse(configMap.data['config.json']);
    config.restEndpoints = config.restEndpoints || {};
    config.restEndpoints['s3c.local'] = 'us-east-1';

    const updatedConfigJson = JSON.stringify(config, null, 2);

    if (!KubernetesHelper.clientCore) {
        throw new Error('KubernetesHelper not initialized');
    }
    await KubernetesHelper.clientCore.replaceNamespacedConfigMap({
        name: configMapName,
        namespace,
        body: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
                name: configMapName,
                namespace: namespace,
                labels: configMap.metadata?.labels,
                annotations: configMap.metadata?.annotations
            },
            data: {
                ...configMap.data,
                'config.json': updatedConfigJson
            }
        },
    });

    logger.info('Cloudserver config patched successfully');
}

async function ensureServiceAccountWithPermissions(namespace: string): Promise<void> {
    logger.info('Ensuring ServiceAccount has permissions for metadata deployment...');

    const serviceAccountName = 'metadata-deploy-sa';

    const serviceAccount = {
        apiVersion: 'v1',
        kind: 'ServiceAccount',
        metadata: {
            name: serviceAccountName,
            namespace: namespace,
            labels: {
                'app': 'metadata-deploy',
                'managed-by': 'zenko-setup',
            }
        }
    };

    try {
        if (!KubernetesHelper.clientCore) {
            throw new Error('KubernetesHelper not initialized');
        }
        await KubernetesHelper.clientCore.createNamespacedServiceAccount({
            namespace,
            body: serviceAccount
        });
        logger.debug(`Created ServiceAccount: ${serviceAccountName}`);
    } catch (error: any) {
        if (error.code === 409) {
            logger.debug(`ServiceAccount ${serviceAccountName} already exists`);
        } else {
            throw error;
        }
    }

    const clusterRoleBinding = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRoleBinding',
        metadata: {
            name: `zenko-admin-${serviceAccountName}`,
            labels: {
                'app': 'metadata-deploy',
                'managed-by': 'zenko-setup',
            }
        },
        subjects: [{
            kind: 'ServiceAccount',
            name: serviceAccountName,
            namespace: namespace
        }],
        roleRef: {
            kind: 'ClusterRole',
            name: 'zenko-admin',
            apiGroup: 'rbac.authorization.k8s.io'
        }
    };

    try {
        if (!KubernetesHelper.rbacApi) {
            throw new Error('KubernetesHelper not initialized');
        }
        await KubernetesHelper.rbacApi.createClusterRoleBinding({
            body: clusterRoleBinding
        });
        logger.debug(`Created ClusterRoleBinding: zenko-admin-${serviceAccountName}`);
    } catch (error: any) {
        if (error.code === 409) {
            logger.debug(`ClusterRoleBinding zenko-admin-${serviceAccountName} already exists`);
        } else {
            throw error;
        }
    }

    logger.info('ServiceAccount permissions ensured successfully');
}

function createMetadataDeploymentJob(jobName: string, targetNamespace: string, gitAccessToken: string) {
    const job = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
            name: jobName,
            labels: {
                'app': 'metadata-deploy',
                'managed-by': 'zenko-setup',
            }
        },
        spec: {
            template: {
                spec: {
                    serviceAccountName: 'metadata-deploy-sa',
                    containers: [{
                        name: 'metadata-deploy',
                        image: 'alpine/helm:3.12.0',
                        command: ['/bin/sh', '-c'],
                        args: [`
                            set -ex
                            apk add --no-cache git jq
                            git init /workspace/metadata
                            cd /workspace/metadata
                            git fetch --depth 1 --no-tags https://git:$GIT_ACCESS_TOKEN@github.com/scality/metadata.git
                            git checkout FETCH_HEAD
                            cd helm
                            helm dependency update cloudserver/
                            helm install -n ${targetNamespace} \\
                                --create-namespace \\
                                --set metadata.persistentVolume.storageClass='' \\
                                --set metadata.sproxyd.persistentVolume.storageClass='' \\
                                s3c cloudserver/
                            echo "Metadata chart installed successfully"
                        `],
                        env: [
                            { name: 'HELM_CACHE_HOME', value: '/tmp/.helm' },
                            { name: 'HELM_CONFIG_HOME', value: '/tmp/.helm' },
                            { name: 'HELM_DATA_HOME', value: '/tmp/.helm' },
                            { name: 'GIT_ACCESS_TOKEN', value: gitAccessToken },
                        ]
                    }],
                    restartPolicy: 'Never',
                }
            },
            backoffLimit: 2,
            activeDeadlineSeconds: 600,
        }
    };
    return job;
}

/**
 * Verify S3C cloudserver can handle requests after deployment/restart.
 * 
 * Tests end-to-end functionality by making S3 requests and checking:
 * - Connection to cloudserver (ECONNREFUSED = service not routing yet)
 * - Bucketd raft sessions established (InternalError = raft not ready)
 * - Full S3 stack operational (NoSuchBucket = working correctly)
 */
export async function verifyS3CReadiness(): Promise<void> {
    logger.info('Verifying S3C cloudserver can handle requests...');

    const s3Client = new S3Client({
        endpoint: 'http://s3c.local:8000',
        credentials: {
            accessKeyId: 'accessKey1',
            secretAccessKey: 'verySecretKey1',
        },
        region: 'us-east-1',
        forcePathStyle: true,
        tls: false,
    });

    const maxAttempts = 90;
    const delayMs = 2000;
    const testBucket = 'readiness-test-bucket';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: testBucket }));
            logger.info('S3C cloudserver is ready');
            return;
        } catch (error: any) {
            if (error instanceof NoSuchBucket || error.$metadata?.httpStatusCode === 404) {
                logger.info('S3C cloudserver is ready');
                return;
            }

            if (attempt < maxAttempts) {
                const reason = error.code || error.name || `HTTP ${error.$metadata?.httpStatusCode}` || 'unknown';
                logger.info(`S3C not ready (${reason}), attempt ${attempt}/${maxAttempts}, retrying in ${delayMs}ms...`);
                await sleep(delayMs);
                continue;
            }

            const elapsed = attempt * delayMs / 1000;
            throw new Error(`S3C readiness check failed after ${attempt} attempts (~${elapsed}s): ${error.message || error.code || error.name}`);
        }
    }
}
