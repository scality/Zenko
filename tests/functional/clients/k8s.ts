import {
    AppsV1Api,
    BatchV1Api,
    CoreV1Api,
    CustomObjectsApi,
    KubeConfig,
    V1PersistentVolumeClaim,
    V1Pod,
    Watch,
} from '@kubernetes/client-node';

export interface Logger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}

export class KubernetesClient {
    readonly core: CoreV1Api;
    readonly batch: BatchV1Api;
    readonly appsV1: AppsV1Api;
    readonly customObjects: CustomObjectsApi;
    readonly watch: Watch;
    private readonly logger: Logger;

    constructor(logger: Logger, kubeconfig?: string) {
        this.logger = logger;
        const kc = KubernetesClient.loadKubeConfig(logger, kubeconfig);
        this.core = kc.makeApiClient(CoreV1Api);
        this.batch = kc.makeApiClient(BatchV1Api);
        this.appsV1 = kc.makeApiClient(AppsV1Api);
        this.customObjects = kc.makeApiClient(CustomObjectsApi);
        this.watch = new Watch(kc);
    }

    private static loadKubeConfig(logger: Logger, kubeconfig?: string): KubeConfig {
        if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
            try {
                const inCluster = new KubeConfig();
                inCluster.loadFromCluster();
                logger.debug('Using in-cluster kubeconfig');
                return inCluster;
            } catch {
                // not running in-cluster, fall through to kubeconfig
            }
        }
        const kc = new KubeConfig();
        if (kubeconfig) {
            kc.loadFromFile(kubeconfig);
            logger.debug('Using kubeconfig file', { kubeconfig });
        } else {
            kc.loadFromDefault();
            logger.debug('Using default kubeconfig', { server: kc.getCurrentCluster()?.server });
        }
        return kc;
    }

    async createSecretIfMissing(
        namespace: string,
        name: string,
        stringData: Record<string, string>,
    ): Promise<void> {
        const secret = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: { name, labels: { type: 'end2end' } },
            stringData,
        };
        try {
            await this.core.createNamespacedSecret({ namespace, body: secret });
            this.logger.info('Created k8s secret', { name });
        } catch (err: unknown) {
            if ((err as { code?: number }).code === 409) {
                this.logger.info('Secret already exists', { name });
            } else {
                throw err;
            }
        }
    }

    async createAndRunPod(
        podManifest: V1Pod,
        waitForCompletion = true,
        cleanup = false, // The pod will be visible in the artifacts is set to false
        timeout = 300000,
    ) {

        try {
            const response = await this.core.createNamespacedPod({ namespace: 'default', body: podManifest });
            const podName = response.metadata?.name;
            if (waitForCompletion && podName) {
                this.logger.debug('Waiting for pod completion', { podName });

                await new Promise<void>((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error(`Pod ${podName} did not complete within ${timeout}ms`));
                    }, timeout);

                    void this.watch.watch(
                        '/api/v1/namespaces/default/pods',
                        {},
                        (type: string, apiObj, watchObj) => {
                            if (watchObj.object?.metadata?.name === podName) {
                                const phase = watchObj.object?.status?.phase;
                                this.logger.debug('Pod status update', { podName, phase });

                                if (phase === 'Succeeded') {
                                    clearTimeout(timeoutId);
                                    this.logger.debug('Pod completed successfully', { podName });
                                    resolve();
                                } else if (phase === 'Failed') {
                                    clearTimeout(timeoutId);
                                    this.logger.error('Pod failed', { 
                                        podName, 
                                        status: watchObj.object?.status 
                                    });
                                    reject(new Error(`Pod ${podName} failed`));
                                }
                            }
                        },
                        err => {
                            this.logger.debug('Watch error callback triggered', { podName, err });
                            clearTimeout(timeoutId);
                            reject(err);
                        }
                    );
                });
            }

            // Cleanup if requested
            if (cleanup && podName) {
                this.logger.debug('Cleaning up pod', { podName });
                try {
                    await this.core.deleteNamespacedPod({ name: podName, namespace: 'default' });
                } catch (cleanupErr) {
                    this.logger.warn('Failed to cleanup pod', { podName, err: cleanupErr });
                }
            }

            return response;
        } catch (err: unknown) {
            this.logger.error('Failed to create and run pod:', { err });
            throw new Error(`Failed to create and run pod: ${err}`);
        }
    }

    async getPVCFromLabel(label: string, value: string, namespace = 'default') {

        const pvcList = await this.core.listNamespacedPersistentVolumeClaim({ namespace });
        const pvc = pvcList.items.find((pvc: V1PersistentVolumeClaim) => pvc.metadata?.labels?.[label] === value);

        return pvc;
    }

    async replaceSecret(
        namespace: string,
        name: string,
        stringData: Record<string, string>,
    ) {
        const secret = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: { name },
            stringData,
        };

        try {
            await this.core.deleteNamespacedSecret({ name, namespace });
        } catch (err) {
            this.logger.debug('Secret does not exist, creating new', {
                name,
                namespace,
                err,
            });
        }

        try {
            const response = await this.core.createNamespacedSecret({ namespace, body: secret });
            return response;
        } catch (err) {
            this.logger.error('Error creating secret', {
                namespace,
                secret,
                err,
            });
            throw err;
        }
    }
}
