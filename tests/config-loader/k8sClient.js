const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreApi = kc.makeApiClient(k8s.CoreV1Api);

async function readSecret(secretName, namespace = 'default') {
    const response = await coreApi.readNamespacedSecret(secretName, namespace);
    const decoded = {};
    const secretData = response.body?.data || response.data;
    if (secretData) {
        for (const [key, value] of Object.entries(secretData)) {
            decoded[key] = Buffer.from(value, 'base64').toString('utf-8');
        }
    }
    return decoded;
}

module.exports = {
    readSecret,
};
