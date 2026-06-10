import { KubeConfig, CoreV1Api, CustomObjectsApi } from '@kubernetes/client-node';

const kc = new KubeConfig();
kc.loadFromDefault();

const coreClient = kc.makeApiClient(CoreV1Api);
const customClient = kc.makeApiClient(CustomObjectsApi);

export const getSecretByLabel = async (
    labelSelector: string,
    dataField: string,
    namespace = 'default',
): Promise<string> => {
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
};

export const getSecretByName = async (
    secretName: string,
    dataField: string,
    namespace = 'default',
): Promise<string> => {
    const secret = await coreClient.readNamespacedSecret({ name: secretName, namespace });
    if (!secret?.data?.[dataField]) {
        throw new Error(
            `Secret field "${dataField}" not found in secret "${secretName}"`,
        );
    }
    return Buffer.from(secret.data[dataField], 'base64').toString('utf-8');
};

export const getSecretAllFieldsByLabel = async (
    labelSelector: string,
    namespace = 'default',
): Promise<Record<string, string>> => {
    const secretList = await coreClient.listNamespacedSecret({ namespace, labelSelector });
    const secret = secretList.items[0];
    if (!secret?.data) {
        throw new Error(`Secret not found for label "${labelSelector}"`);
    }
    return Object.fromEntries(
        Object.entries(secret.data).map(([k, v]) => [k, Buffer.from(v, 'base64').toString('utf-8')]),
    );
};

export const getCustomObject = async (
    group: string,
    version: string,
    plural: string,
    name: string,
    namespace = 'default',
): Promise<Record<string, unknown>> => {
    return await customClient.getNamespacedCustomObject({
        group, version, namespace, plural, name,
    }) as Record<string, unknown>;
};
