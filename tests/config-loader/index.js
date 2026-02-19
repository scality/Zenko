const { readSecret } = require('./k8sClient');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Shared tests config - values needed by both ctst and zenko_tests
const sharedTestsConfig = {
    AdminAccessKey: undefined,
    AdminSecretKey: undefined,
    Subdomain: undefined,
};

// Cucumber specific config
const ctstConfig = {
    // DRAdminAccessKey: undefined,
    // KafkaHosts: undefined,
};

// Zenko tests specific config
const zenkoTestsConfig = {
    // MongoDatabase: undefined,
};

let _loaded = false;

/**
 * Load static config from end2end.yaml workflow file
 */
function loadYamlConfig() {
    const configPath = path.join(__dirname, 'end2end.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const workflowConfig = yaml.load(fileContents);
    return workflowConfig.env || {};
}

/**
 * Load all configuration from k8s secrets and config files.
 * Called once at startup (e.g., in BeforeAll hook).
 */
async function load(zenkoName = 'end2end', namespace = 'default') {
    if (_loaded) {
        return;
    }

    const envConfig = loadYamlConfig();
    sharedTestsConfig.Subdomain = envConfig.SUBDOMAIN;

    const adminCreds = await readSecret(
        `${zenkoName}-management-vault-admin-creds.v1`,
        namespace
    );

    sharedTestsConfig.AdminAccessKey = adminCreds.accessKey;
    sharedTestsConfig.AdminSecretKey = adminCreds.secretKey;

    // TODO: Load CTST-specific secrets
    // const drCreds = await k8sClient.readSecret(...);
    // ctstConfig.DRAdminAccessKey = drCreds.accessKey;

    // TODO: Load zenko_tests-specific secrets
    // zenkoTestsConfig.MongoDatabase = ...;

    _loaded = true;
}

module.exports = {
    load,
    sharedTestsConfig: sharedTestsConfig,
    ctstConfig: ctstConfig,
    zenkoTestsConfig: zenkoTestsConfig,
};
