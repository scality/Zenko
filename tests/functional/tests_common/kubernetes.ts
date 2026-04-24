import { CacheHelper, KubernetesHelper, Utils } from 'cli-testing';
import {
    V1Job,
    Watch,
    V1ObjectMeta,
    AppsV1Api,
    V1Deployment,
    AppsApi,
    CustomObjectsApi,
    V1PersistentVolumeClaim,
    CoreV1Api,
    BatchV1Api,
    V1Pod,
} from '@kubernetes/client-node';

const ensureClients = () => {
    // TODO : review this
    if (!KubernetesHelper.clientCore) {
        KubernetesHelper.init(CacheHelper.parameters);
    }
};

export const getSecretByLabel = async (
    labelSelector: string,
    dataField: string,
    namespace = 'default',
): Promise<string> => {
    ensureClients();
    const coreClient = KubernetesHelper.clientCore as CoreV1Api;
    const secretList = await coreClient.listNamespacedSecret({
        namespace,
        labelSelector,
    });
    const secret = secretList.items[0];
    if (!secret?.data?.[dataField]) {
        throw new Error(
            `Secret field "${dataField}" not found for label "${labelSelector}"`,
        );
    }
    return Buffer.from(secret.data[dataField], 'base64').toString('utf-8');
}

export const getSecretByName = async (
    secretName: string,
    dataField: string,
    namespace = 'default',
): Promise<string> => {
    ensureClients();
    const coreClient = KubernetesHelper.clientCore as CoreV1Api;
    const secret = await coreClient.readNamespacedSecret({ name: secretName, namespace });
    if (!secret?.data?.[dataField]) {
        throw new Error(
            `Secret field "${dataField}" not found in secret "${secretName}"`,
        );
    }
    return Buffer.from(secret.data[dataField], 'base64').toString('utf-8');
}

export const getCustomObject = async (
    group: string,
    version: string,
    plural: string,
    name: string,
    namespace = 'default',
): Promise<Record<string, unknown>> => {
    ensureClients();
    const customClient = KubernetesHelper.customObject as CustomObjectsApi;
    return await customClient.getNamespacedCustomObject({
        group, version, namespace, plural, name,
    }) as Record<string, unknown>;
}