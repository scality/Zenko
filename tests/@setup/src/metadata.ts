import { execSync } from 'child_process';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import { V1Job, V1ObjectMeta, V1JobSpec, V1PodTemplateSpec, V1PodSpec, V1Container, V1EnvVar } from '@kubernetes/client-node';

export interface MetadataOptions {
    gitAccessToken: string;
    namespace?: string;
    timeout?: number;
}

export async function setupMetadata(options: MetadataOptions): Promise<void> {
    const namespace = options.namespace || 'metadata';
    const timeout = options.timeout || 300;

    logger.info('Setting up metadata service...');

    try {
        await createNamespace(namespace);
        await deployMetadataViaJob(options.gitAccessToken, namespace);
        await waitForRepdReady(namespace, timeout);
        await restartAndWaitForBucketd(namespace, timeout);
        await patchCloudserverConfig(namespace);
        await restartAndWaitForCloudserver(namespace, timeout);

        logger.info('Metadata service setup completed successfully');
    } catch (error) {
        logger.error('Failed to setup metadata service:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function createNamespace(namespace: string): Promise<void> {
    logger.info(`Creating namespace: ${namespace}`);

    const k8s = new KubernetesClient();
    try {
        await k8s.coreApi.createNamespace({
            body: {
                metadata: { name: namespace }
            }
        });
        logger.info(`Namespace ${namespace} created`);
    } catch (error: any) {
        if (error.response?.statusCode === 409) {
            logger.info(`Namespace ${namespace} already exists`);
        } else {
            throw error;
        }
    }
}

async function deployMetadataViaJob(gitAccessToken: string, namespace: string): Promise<void> {
    logger.info('Deploying metadata service via Kubernetes Job...');
    
    const k8s = new KubernetesClient();
    
    try {
        const jobName = `metadata-deploy-${Date.now()}`;
        const job = createMetadataDeploymentJob(jobName, namespace, gitAccessToken);
        
        await k8s.createJobAndWaitForCompletion(job, 'default');
        
        logger.info('Metadata deployment job completed successfully');
        
    } catch (error) {
        logger.error('Failed to deploy metadata via job:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

function createMetadataDeploymentJob(jobName: string, targetNamespace: string, gitAccessToken: string): V1Job {
    const job = new V1Job();
    const metadata = new V1ObjectMeta();
    const jobSpec = new V1JobSpec();
    const podTemplate = new V1PodTemplateSpec();
    const podSpec = new V1PodSpec();
    const container = new V1Container();
    
    // Job metadata
    metadata.name = jobName;
    metadata.labels = {
        'app': 'metadata-deploy',
        'managed-by': 'zenko-setup'
    };
    
    // Container specification
    container.name = 'metadata-deploy';
    container.image = 'alpine/helm:3.12.0'; // Image with both git and helm
    container.command = ['/bin/sh'];
    container.args = ['-c', `
        set -ex
        
        # Install git and other dependencies
        apk add --no-cache git jq
        
        # Clone metadata repository
        git clone --depth 1 https://git:${gitAccessToken}@github.com/scality/metadata.git /workspace/metadata
        cd /workspace/metadata/helm
        
        # Update helm dependencies
        helm dependency update cloudserver/
        
        # Install the chart
        helm install -n ${targetNamespace} \\
            --create-namespace \\
            --set metadata.persistentVolume.storageClass='' \\
            --set metadata.sproxyd.persistentVolume.storageClass='' \\
            s3c cloudserver/
        
        echo "Metadata chart installed successfully"
    `];
    
    // Environment variables
    container.env = [
        { name: 'HELM_CACHE_HOME', value: '/tmp/.helm' } as V1EnvVar,
        { name: 'HELM_CONFIG_HOME', value: '/tmp/.helm' } as V1EnvVar,
        { name: 'HELM_DATA_HOME', value: '/tmp/.helm' } as V1EnvVar,
    ];
    
    // Pod specification
    podSpec.containers = [container];
    podSpec.restartPolicy = 'Never';
    
    // Pod template
    podTemplate.spec = podSpec;
    
    // Job specification
    jobSpec.template = podTemplate;
    jobSpec.backoffLimit = 2; // Retry up to 2 times
    jobSpec.activeDeadlineSeconds = 600; // 10 minute timeout
    
    // Job
    job.apiVersion = 'batch/v1';
    job.kind = 'Job';
    job.metadata = metadata;
    job.spec = jobSpec;
    
    return job;
}

async function waitForRepdReady(namespace: string, timeout: number): Promise<void> {
    logger.info('Waiting for repd to be ready...');

    try {
        execSync(`kubectl -n ${namespace} rollout status --watch --timeout=${timeout}s statefulset/s3c-metadata-repd`, {
            stdio: 'inherit'
        });

        await waitForAllPodsInService('metadata-repd', namespace, '91*', 60);
        logger.info('Repd is ready');
    } catch (error) {
        logger.error('Failed to wait for repd:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function restartAndWaitForBucketd(namespace: string, timeout: number): Promise<void> {
    logger.info('Restarting bucketd to fix reconnection issues...');

    try {
        execSync(`kubectl -n ${namespace} rollout restart deployment/s3c-metadata-bucketd`, {
            stdio: 'inherit'
        });

        execSync(`kubectl -n ${namespace} rollout status --watch --timeout=${timeout}s deploy/s3c-metadata-bucketd`, {
            stdio: 'inherit'
        });

        await waitForAllPodsInService('metadata-bucketd', namespace, '9000', 60);
        logger.info('Bucketd is ready');
    } catch (error) {
        logger.error('Failed to restart/wait for bucketd:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function patchCloudserverConfig(namespace: string): Promise<void> {
    logger.info('Patching cloudserver config to add s3c.local endpoint...');

    try {
        // Get current config
        const getCurrentConfigCmd = `kubectl get configmap/s3c-cloudserver-config-json -n ${namespace} -o jsonpath='{.data.config\\.json}'`;
        const currentConfig = execSync(getCurrentConfigCmd, { encoding: 'utf8' });

        // Update config with jq
        const updateConfigCmd = `echo '${currentConfig}' | jq '.restEndpoints["s3c.local"] = "us-east-1"'`;
        const updatedConfig = execSync(updateConfigCmd, { encoding: 'utf8' });

        // Patch configmap
        const patchData = JSON.stringify({
            data: {
                'config.json': updatedConfig.trim()
            }
        });

        execSync(`kubectl patch configmap/s3c-cloudserver-config-json -n ${namespace} --type='merge' -p='${patchData}'`, {
            stdio: 'inherit'
        });

        logger.info('Cloudserver config patched successfully');
    } catch (error) {
        logger.error('Failed to patch cloudserver config:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function restartAndWaitForCloudserver(namespace: string, timeout: number): Promise<void> {
    logger.info('Restarting cloudserver to apply new config...');

    try {
        execSync(`kubectl -n ${namespace} rollout restart deployment/s3c-cloudserver`, {
            stdio: 'inherit'
        });

        execSync(`kubectl -n ${namespace} rollout status --watch --timeout=${timeout}s deployment/s3c-cloudserver`, {
            stdio: 'inherit'
        });

        await waitForAllPodsInService('cloudserver', namespace, '8000', 60);
        logger.info('Cloudserver is ready');
    } catch (error) {
        logger.error('Failed to restart/wait for cloudserver:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function waitForAllPodsInService(
    service: string,
    namespace: string,
    portRegex: string,
    timeoutSeconds: number
): Promise<void> {
    logger.info(`Waiting for all pods behind service ${service} to be ready on port ${portRegex}...`);

    try {
        // Get pods for the service
        const getPodsCmd = `kubectl get pods -n ${namespace} -l app=${service} -o jsonpath='{range .items[*]}{.metadata.deletionTimestamp}:{.status.podIP}:{.spec.containers[*].ports[*].containerPort}{"\\n"}{end}'`;
        const podsOutput = execSync(getPodsCmd, { encoding: 'utf8' });

        const pods = podsOutput.trim().split('\n').filter(line => line);

        for (const podInfo of pods) {
            const [deletionTimestamp, ip, ports] = podInfo.split(':');

            // Skip pods that are terminating or don't have IP/ports
            if (deletionTimestamp !== '<no value>' || !ip || !ports) {
                continue;
            }

            // Check each port that matches the regex
            const portList = ports.split(' ');
            for (const port of portList) {
                if (port.match(new RegExp(portRegex.replace('*', '.*')))) {
                    await waitForEndpoint(ip, port, timeoutSeconds);
                }
            }
        }
    } catch (error) {
        logger.error(`Failed to wait for pods in service ${service}:`, { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function waitForEndpoint(host: string, port: string, timeoutSeconds: number): Promise<void> {
    logger.debug(`Waiting for ${host}:${port} to be available...`);

    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    return new Promise((resolve, reject) => {
        const checkEndpoint = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > timeoutMs) {
                reject(new Error(`Timeout waiting for ${host}:${port} after ${timeoutSeconds} seconds`));
                return;
            }

            try {
                execSync(`kubectl run wait-for-port-${Date.now()} --image=busybox --attach=True --rm --restart=Never --pod-running-timeout=5m --image-pull-policy=IfNotPresent -- sh -c 'nc -z -w 1 ${host} ${port}'`, {
                    stdio: 'pipe'
                });
                logger.debug(`${host}:${port} is now available`);
                resolve();
            } catch {
                // Still not ready, try again
                setTimeout(checkEndpoint, 1000);
            }
        };

        checkEndpoint();
    });
}