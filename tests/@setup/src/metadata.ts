import { V1Job } from '@kubernetes/client-node';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

const k8sClient = new KubernetesClient();

export interface MetadataOptions {
    gitAccessToken: string;
    namespace?: string;
    timeout?: number;
}

export async function setupMetadata(options: MetadataOptions): Promise<void> {
    const namespace = options.namespace || 'metadata';
    const timeoutMs = (options.timeout || 300) * 1000;

    logger.info('Setting up metadata service...');

    try {
        await k8sClient.createNamespace(namespace);
        await deployMetadataViaJob(options.gitAccessToken, namespace, timeoutMs);
        await k8sClient.waitForStatefulSetReady('s3c-metadata-repd', namespace, timeoutMs);
        
        await restartDeployment('s3c-metadata-bucketd', namespace);
        await k8sClient.waitForDeployment('s3c-metadata-bucketd', namespace, timeoutMs);
        await k8sClient.waitForStatefulSetReady('s3c-metadata-bucketd', namespace, timeoutMs);

        await patchCloudserverConfig(namespace);
        
        await restartDeployment('s3c-cloudserver', namespace);
        await k8sClient.waitForDeployment('s3c-cloudserver', namespace, timeoutMs);

        logger.info('Metadata service setup completed successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to setup metadata service:', { error: errorMessage });
        throw error;
    }
}

async function deployMetadataViaJob(gitAccessToken: string, namespace: string, timeoutMs: number): Promise<void> {
    logger.info('Deploying metadata service via Kubernetes Job...');
    
    const jobName = `metadata-deploy-${Date.now()}`;
    const job = createMetadataDeploymentJob(jobName, namespace, gitAccessToken);
    
    // The client's high-level method handles creation, waiting, and cleanup.
    await k8sClient.createJobAndWaitForCompletion(job, namespace, timeoutMs);
    
    logger.info('Metadata deployment job completed successfully');
}

async function patchCloudserverConfig(namespace: string): Promise<void> {
    logger.info('Patching cloudserver config to add s3c.local endpoint...');

    const configMapName = 's3c-cloudserver-config-json';

    const configMap = await k8sClient.coreApi.readNamespacedConfigMap({ name: configMapName, namespace });
    
    if (!configMap.data || !configMap.data['config.json']) {
        throw new Error(`ConfigMap ${configMapName} does not contain 'config.json' data.`);
    }

    const config = JSON.parse(configMap.data['config.json']);
    config.restEndpoints = config.restEndpoints || {};
    config.restEndpoints['s3c.local'] = 'us-east-1';
    
    const updatedConfigJson = JSON.stringify(config, null, 2);

    await k8sClient.coreApi.patchNamespacedConfigMap({
        name: configMapName,
        namespace,
        body: { data: { 'config.json': updatedConfigJson } },
    });

    logger.info('Cloudserver config patched successfully');
}

async function restartDeployment(name: string, namespace: string): Promise<void> {
    logger.info(`Restarting deployment ${name} in namespace ${namespace}...`);
    const patch = [{
        op: 'replace',
        path: '/spec/template/metadata/annotations',
        value: {
            'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
        },
    }];
    await k8sClient.appsApi.patchNamespacedDeployment({
        name,
        namespace,
        body: patch,
    });
    logger.info(`Deployment ${name} restarted.`);
}

function createMetadataDeploymentJob(jobName: string, targetNamespace: string, gitAccessToken: string): V1Job {
    const job: V1Job = {
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
                    containers: [{
                        name: 'metadata-deploy',
                        image: 'alpine/helm:3.12.0',
                        command: ['/bin/sh', '-c'],
                        args: [`
                            set -ex
                            apk add --no-cache git jq
                            git clone --depth 1 https://git:${gitAccessToken}@github.com/scality/metadata.git /workspace/metadata
                            cd /workspace/metadata/helm
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
