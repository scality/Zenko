const k8s = require('@kubernetes/client-node');

/**
 * setup/variables.js
 * 
 * To run tests locally, ensure you have port-forwarding enabled:
 * 1. CloudServer (S3 API): 
 * kubectl port-forward svc/end2end-connector-s3api 8000:80
 * 2. Vault (IAM API):      
 * kubectl port-forward svc/end2end-management-vault-iam-admin-api 8001:80
 * 
 * Then run tests with:
 * export CLOUDSERVER_ENDPOINT=http://127.0.0.1:8000
 */

const variables = {
    accessKey: '',
    secretKey: '',
    sessionToken: '',
}

/**
 * Fetches Zenko credentials directly from Kubernetes secret
 * @param {string} secretName - Name of the secret (default: 'end2end-account-zenko')
 * @param {string} namespace - Kubernetes namespace (default: 'default')
 * @returns {Promise<{accessKey: string, secretKey: string, sessionToken: string}>}
 */
async function loadZenkoCredentialsFromK8s(secretName = 'end2end-account-zenko', namespace = 'default') {
    try {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault(); // Works both in-cluster and with local kubeconfig

        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

        const secret = await k8sApi.readNamespacedSecret({ name: secretName, namespace });
        variables.accessKey = Buffer.from(secret.data.AccessKeyId, 'base64').toString();
        variables.secretKey = Buffer.from(secret.data.SecretAccessKey, 'base64').toString();
        variables.sessionToken = Buffer.from(secret.data.SessionToken || '', 'base64').toString();
    } catch (error) {
        console.error(`Failed to fetch credentials from k8s secret ${secretName}:`, error.message);
        throw error;
    }
}

async function loadMongoCredentialsFromK8s() {
    try {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        
        // Find the cloudserver config secret
        // It's typically named 'end2end-connector-cloudserver-config.vXX'
        const secrets = await k8sApi.listNamespacedSecret({ namespace: 'default' });
        const secret = secrets.items.find(s => s.metadata.name.startsWith('end2end-connector-cloudserver-config'));
        
        if (!secret) {
            throw new Error('Could not find end2end-connector-cloudserver-config secret');
        }

        console.log(`Loading MongoDB config from secret: ${secret.metadata.name}`);
        
        const configJsonStr = Buffer.from(secret.data['config.json'], 'base64').toString();
        const cloudServerConfig = JSON.parse(configJsonStr);
        
        // Base config with hardcoded values for local dev environment
        const config = {
            mongodb: {
                replicaSetHosts: '127.0.0.1:27017',
                writeConcern: 'majority',
                readPreference: 'primary',
                shardCollection: 'true',
                database: cloudServerConfig.mongodb.database, // Dynamic from K8s
                authCredentials: {
                    username: 'data',
                    password: 'datapass',
                },
                replicaSet: null,
            }
        };

        // Populate process.env for compatibility if needed elsewhere
        process.env.MONGO_AUTH_USERNAME = config.mongodb.authCredentials.username;
        process.env.MONGO_AUTH_PASSWORD = config.mongodb.authCredentials.password;
        process.env.MONGO_DATABASE = config.mongodb.database;
        process.env.MONGO_REPLICA_SET_HOSTS = config.mongodb.replicaSetHosts;
        process.env.MONGO_SHARD_COLLECTION = config.mongodb.shardCollection;

        return config;

    } catch (error) {
        console.error(`Failed to load MongoDB config from K8s:`, error.message);
        throw error;
    }
}

module.exports = {
    variables,
    loadZenkoCredentialsFromK8s,
    loadMongoCredentialsFromK8s
};

// Automatically migration credentials when this module is loaded
// This ensures process.env is populated before tests run their 'before' hooks
// loadMongoCredentialsFromK8s();
// loadZenkoCredentialsFromK8s();
