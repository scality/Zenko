import * as k8s from '@kubernetes/client-node';
import { logger } from './logger';

export class KubernetesClient {
    private kc: k8s.KubeConfig;
    public coreApi: k8s.CoreV1Api;
    public appsApi: k8s.AppsV1Api;
    public customObjectsApi: k8s.CustomObjectsApi;
    public rbacApi: k8s.RbacAuthorizationV1Api;

    constructor(kubeconfig?: string) {
        this.kc = new k8s.KubeConfig();

        if (kubeconfig) {
            this.kc.loadFromFile(kubeconfig);
        } else if (process.env.KUBECONFIG) {
            this.kc.loadFromFile(process.env.KUBECONFIG);
        } else {
            try {
                this.kc.loadFromDefault();
            } catch (error) {
                logger.error(
                    'Failed to load kubeconfig. Please provide --kubeconfig or set KUBECONFIG environment variable');
                throw error;
            }
        }

        this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
        this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
        this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
        this.rbacApi = this.kc.makeApiClient(k8s.RbacAuthorizationV1Api);
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
}
