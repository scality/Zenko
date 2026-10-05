import {
    ApiException,
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
    readonly coreV1: CoreV1Api;
    readonly batchV1: BatchV1Api;
    readonly appsV1: AppsV1Api;
    readonly customObjects: CustomObjectsApi;
    readonly watch: Watch;
    private readonly logger: Logger;

    constructor(logger: Logger, kubeconfig?: string) {
        this.logger = logger;
        const kc = KubernetesClient.loadKubeConfig(logger, kubeconfig);
        this.coreV1 = kc.makeApiClient(CoreV1Api);
        this.batchV1 = kc.makeApiClient(BatchV1Api);
        this.appsV1 = kc.makeApiClient(AppsV1Api);
        this.customObjects = kc.makeApiClient(CustomObjectsApi);
        this.watch = new Watch(kc);
    }

    private static loadKubeConfig(logger: Logger, kubeconfig?: string): KubeConfig {
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
            await this.coreV1.createNamespacedSecret({ namespace, body: secret });
            this.logger.info('Created k8s secret', { name });
        } catch (err: unknown) {
            if (err instanceof ApiException && err.code === 409) {
                this.logger.info('Secret already exists', { name });
            } else {
                throw err;
            }
        }
    }

    async createAndRunPod(
        podManifest: V1Pod,
        waitForCompletion = true,
        cleanup = false, // The pod will be visible in the artifacts if set to false
        timeout = 300000,
    ) {
        try {
            const response = await this.coreV1.createNamespacedPod({ namespace: 'default', body: podManifest });
            const podName = response.metadata?.name;
            if (!podName) {
                return response;
            }
            try {
                if (waitForCompletion) {
                    await this.waitForPodCompletion(podName, timeout);
                }
            } finally {
                // Also when the pod failed or timed out
                if (cleanup) {
                    this.logger.debug('Cleaning up pod', { podName });
                    try {
                        await this.coreV1.deleteNamespacedPod({ name: podName, namespace: 'default' });
                    } catch (cleanupErr) {
                        this.logger.warn('Failed to cleanup pod', { podName, err: cleanupErr });
                    }
                }
            }
            return response;
        } catch (err: unknown) {
            this.logger.error('Failed to create and run pod:', { err });
            throw new Error(`Failed to create and run pod: ${err}`);
        }
    }

    private async waitForPodCompletion(podName: string, timeout: number): Promise<void> {
        this.logger.debug('Waiting for pod completion', { podName });
        let watchRequest: Promise<AbortController> | undefined;
        try {
            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Pod ${podName} did not complete within ${timeout}ms`));
                }, timeout);
                const settle = (err?: unknown) => {
                    clearTimeout(timeoutId);
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                };

                watchRequest = this.watch.watch(
                    '/api/v1/namespaces/default/pods',
                    {},
                    (type: string, apiObj, watchObj) => {
                        if (watchObj.object?.metadata?.name === podName) {
                            const phase = watchObj.object?.status?.phase;
                            this.logger.debug('Pod status update', { podName, phase });

                            if (phase === 'Succeeded') {
                                this.logger.debug('Pod completed successfully', { podName });
                                settle();
                            } else if (phase === 'Failed') {
                                this.logger.error('Pod failed', {
                                    podName,
                                    status: watchObj.object?.status,
                                });
                                settle(new Error(`Pod ${podName} failed`));
                            }
                        }
                    },
                    err => {
                        this.logger.debug('Watch error callback triggered', { podName, err });
                        // The server may also close the watch without an error
                        settle(err ?? new Error(`Watch on pod ${podName} ended before it completed`));
                    },
                );
                // The watch itself may fail before it starts, e.g. on authentication
                watchRequest.catch(settle);
            });
        } finally {
            // Stop watching the pods of the namespace, whatever the outcome
            (await watchRequest?.catch(() => undefined))?.abort();
        }
    }

    async getPVCFromLabel(label: string, value: string, namespace = 'default') {

        const pvcList = await this.coreV1.listNamespacedPersistentVolumeClaim({ namespace });
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
            await this.coreV1.deleteNamespacedSecret({ name, namespace });
        } catch (err) {
            this.logger.debug('Secret does not exist, creating new', {
                name,
                namespace,
                err,
            });
        }

        try {
            const response = await this.coreV1.createNamespacedSecret({ namespace, body: secret });
            return response;
        } catch (err) {
            this.logger.error('Error creating secret', {
                name,
                namespace,
                err,
            });
            throw err;
        }
    }
}
