import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';

export interface AccountCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
}

export function createK8sClient(kubeconfig?: string): CoreV1Api {
    if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
        try {
            const kc = new KubeConfig();
            kc.loadFromCluster();
            console.log('[k8s] Using in-cluster config');
            return kc.makeApiClient(CoreV1Api);
        } catch {
            // not running in-cluster, fall through to kubeconfig
        }
    }
    const kc = new KubeConfig();
    if (kubeconfig) {
        kc.loadFromFile(kubeconfig);
        console.log(`[k8s] Using kubeconfig file: ${kubeconfig}`);
    } else {
        kc.loadFromDefault();
        console.log(`[k8s] Using default kubeconfig (server: ${kc.getCurrentCluster()?.server ?? 'unknown'})`);
    }
    return kc.makeApiClient(CoreV1Api);
}

export async function createKubernetesSecret(
    coreClient: CoreV1Api,
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
        await coreClient.createNamespacedSecret({ namespace, body: secret });
        console.log(`Created k8s secret: ${name}`);
    } catch (err: unknown) {
        if ((err as { code?: number }).code === 409) {
            console.log(`Secret already exists: ${name}`);
        } else {
            throw err;
        }
    }
}
