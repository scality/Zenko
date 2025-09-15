import * as k8s from '@kubernetes/client-node';
import { logger } from './logger';

export class KubernetesClient {
    private kc: k8s.KubeConfig;
    public coreApi: k8s.CoreV1Api;
    public appsApi: k8s.AppsV1Api;
    public customObjectsApi: k8s.CustomObjectsApi;
    public rbacApi: k8s.RbacAuthorizationV1Api;
    public batchApi: k8s.BatchV1Api;

    constructor(kubeconfig?: string) {
        this.kc = new k8s.KubeConfig();

        if (kubeconfig) {
            this.kc.loadFromFile(kubeconfig);
        } else if (process.env.KUBECONFIG) {
            this.kc.loadFromFile(process.env.KUBECONFIG);
        } else {
            try {
                // Try in-cluster config first (when running as a Pod)
                this.kc.loadFromCluster();
                logger.debug('Using in-cluster Kubernetes configuration');
            } catch (clusterError) {
                try {
                    // Fallback to default (local kubeconfig)
                    this.kc.loadFromDefault();
                    logger.debug('Using default Kubernetes configuration');
                } catch (defaultError) {
                    logger.error('Failed to load Kubernetes configuration. Tried in-cluster and default configurations.');
                    throw defaultError;
                }
            }
        }

        this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
        this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
        this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
        this.rbacApi = this.kc.makeApiClient(k8s.RbacAuthorizationV1Api);
        this.batchApi = this.kc.makeApiClient(k8s.BatchV1Api);
    }

    async ensureNamespace(namespace: string): Promise<void> {
        try {
            await this.coreApi.readNamespace({ name: namespace });
            logger.debug(`Namespace ${namespace} exists`);
        } catch (error: any) {
            if (error.response?.statusCode === 404) {
                logger.info(`Creating namespace ${namespace}`);
                await this.coreApi.createNamespace({
                    body: {
                        apiVersion: 'v1',
                        kind: 'Namespace',
                        metadata: { name: namespace }
                    }
                });
            } else {
                throw error;
            }
        }
    }

    async applyManifest(manifest: any, namespace?: string): Promise<void> {
        const { kind, apiVersion, metadata } = manifest;

        if (namespace && !metadata.namespace) {
            metadata.namespace = namespace;
        }

        logger.debug(`Applying ${kind}/${metadata.name} in namespace ${metadata.namespace || 'default'}`);

        try {
            switch (kind) {
            case 'Deployment':
                try {
                    await this.appsApi.readNamespacedDeployment(
                        { name: metadata.name, namespace: metadata.namespace || 'default' }
                    );
                    await this.appsApi.replaceNamespacedDeployment(
                        {
                            name: metadata.name,
                            namespace: metadata.namespace || 'default',
                            body: manifest,
                        },
                    );
                } catch (error: any) {
                    if (error.response?.statusCode === 404) {
                        await this.appsApi.createNamespacedDeployment(
                            metadata.namespace || 'default',
                            manifest,
                        );
                    } else {
                        throw error;
                    }
                }
                break;

            case 'Service':
                try {
                    await this.coreApi.readNamespacedService(
                        { name: metadata.name, namespace: metadata.namespace || 'default' }
                    );
                    await this.coreApi.replaceNamespacedService(
                        {
                            name: metadata.name,
                            namespace: metadata.namespace || 'default',
                            body: manifest,
                        },
                    );
                } catch (error: any) {
                    if (error.response?.statusCode === 404) {
                        await this.coreApi.createNamespacedService(metadata.namespace || 'default', manifest);
                    } else {
                        throw error;
                    }
                }
                break;

            case 'ConfigMap':
                try {
                    await this.coreApi.readNamespacedConfigMap(
                        { name: metadata.name, namespace: metadata.namespace || 'default' }
                    );
                    await this.coreApi.replaceNamespacedConfigMap(
                        {
                            name: metadata.name,
                            namespace: metadata.namespace || 'default',
                            body: manifest,
                        },
                    );
                } catch (error: any) {
                    if (error.response?.statusCode === 404) {
                        await this.coreApi.createNamespacedConfigMap(metadata.namespace || 'default', manifest);
                    } else {
                        throw error;
                    }
                }
                break;

            case 'Secret':
                try {
                    await this.coreApi.readNamespacedSecret(
                        { name: metadata.name, namespace: metadata.namespace || 'default' }
                    );
                    await this.coreApi.replaceNamespacedSecret(
                        {
                            name: metadata.name,
                            namespace: metadata.namespace || 'default',
                            body: manifest,
                        },
                    );
                } catch (error: any) {
                    if (error.response?.statusCode === 404) {
                        await this.coreApi.createNamespacedSecret(
                            metadata.namespace || 'default',
                            manifest,
                        );
                    } else {
                        throw error;
                    }
                }
                break;

            default:
                // Handle custom resources
                // eslint-disable-next-line no-case-declarations
                const [group, version] = apiVersion.split('/');
                await this.customObjectsApi.createNamespacedCustomObject(
                    {
                        group,
                        version,
                        plural: `${kind.toLowerCase()}s`,
                        body: manifest,
                        namespace: metadata.namespace || 'default',
                    },
                );
            }
        } catch (error: any) {
            if (error.response?.statusCode === 409) {
                logger.debug(`Resource ${kind}/${metadata.name} already exists`);
            } else {
                throw error;
            }
        }
    }

    async waitForDeployment(name: string, namespace: string, timeoutMs: number = 300000): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const deployment = await this.appsApi.readNamespacedDeployment({ name, namespace });
                const status = deployment.status;

                if (status?.readyReplicas === status?.replicas && status?.replicas && status.replicas > 0) {
                    logger.debug(`Deployment ${name} is ready`);
                    return;
                }

                logger.debug(`Waiting for deployment ${name} (${status?.readyReplicas || 0}/${status?.replicas || 0})`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                logger.debug(`Error checking deployment ${name}: ${error}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        throw new Error(`Deployment ${name} did not become ready within ${timeoutMs}ms`);
    }

    /**
     * Wait for a Kubernetes Job to complete (succeed or fail)
     */
    async waitForJobCompletion(jobName: string, namespace: string, timeoutMs: number = 10 * 60 * 1000): Promise<void> {
        logger.info(`Waiting for job ${jobName} to complete...`);
        
        const pollInterval = 5000; // 5 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const jobResponse = await this.batchApi.readNamespacedJob({
                    name: jobName,
                    namespace,
                });

                const job = jobResponse;
                const status = job?.status;

                if (status?.succeeded && status.succeeded > 0) {
                    logger.info(`Job ${jobName} completed successfully`);
                    return;
                }

                if (status?.failed && status.failed > 0) {
                    // Get job logs for debugging
                    const podsResponse = await this.coreApi.listNamespacedPod({
                        namespace,
                        labelSelector: `job-name=${jobName}`
                    });
                    
                    if (podsResponse?.items.length > 0) {
                        const podName = podsResponse.items[0].metadata?.name;
                        if (podName) {
                            try {
                                const logsResponse = await this.coreApi.readNamespacedPodLog({
                                    name: podName,
                                    namespace
                                });
                                logger.error(`Job ${jobName} failed. Pod logs:`, { logs: logsResponse });
                            } catch (logError) {
                                logger.debug('Could not retrieve pod logs', { error: logError });
                            }
                        }
                    }
                    throw new Error(`Job ${jobName} failed`);
                }

                logger.debug(`Job ${jobName} still running...`, { status });
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } catch (error) {
                if ((error as any)?.response?.statusCode === 404) {
                    throw new Error(`Job ${jobName} not found`);
                }
                throw error;
            }
        }

        throw new Error(`Timeout waiting for job ${jobName} to complete after ${timeoutMs}ms`);
    }

    /**
     * Create a Job and wait for its completion
     */
    async createJobAndWaitForCompletion(
        job: k8s.V1Job,
        namespace: string,
        timeoutMs: number = 10 * 60 * 1000
    ): Promise<void> {
        const jobResponse = await this.batchApi.createNamespacedJob({
            namespace,
            body: job
        });

        const jobName = jobResponse?.metadata?.name;
        if (!jobName) {
            throw new Error('Failed to create job - no name returned');
        }

        logger.info(`Created job: ${jobName}`);
        
        try {
            await this.waitForJobCompletion(jobName, namespace, timeoutMs);
        } finally {
            // Clean up the job
            try {
                await this.batchApi.deleteNamespacedJob({
                    name: jobName,
                    namespace
                });
                logger.debug(`Cleaned up job: ${jobName}`);
            } catch (cleanupError) {
                logger.debug(`Failed to cleanup job ${jobName}:`, { error: cleanupError });
            }
        }
    }
}
