import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface AccountConfig {
    name: string;
    email: string;
    description?: string;
}

export interface AccountsConfig {
    accounts: AccountConfig[];
}

export interface AccountsOptions {
    namespace: string;
    instanceId?: string;
    configFile?: string;
}

function loadAccountsConfig(configFile?: string): AccountsConfig {
    const defaultConfigPath = path.join(__dirname, '..', 'configs', 'accounts.json');
    const configPath = configFile ? path.resolve(configFile) : defaultConfigPath;

    if (!fs.existsSync(configPath)) {
        throw new Error(`Accounts configuration file not found: ${configPath}`);
    }

    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configData) as AccountsConfig;
    } catch (error) {
        throw new Error(`Failed to parse accounts configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function setupAccounts(options: AccountsOptions): Promise<void> {
    const k8s = new KubernetesClient();
    const config = loadAccountsConfig(options.configFile);

    logger.info('Setting up test accounts via Management API');

    // Get management API endpoint and credentials
    const { managementEndpoint, authToken } = await getManagementCredentials(k8s, options);

    // Get instance ID from Zenko CR if not provided
    const instanceId = options.instanceId || await getInstanceId(k8s, options);

    if (!instanceId) {
        throw new Error('Instance ID is required for account creation. Either provide --instance-id or ensure Zenko CR exists');
    }

    for (const account of config.accounts) {
        try {
            await createAccount(managementEndpoint, authToken, instanceId, account, options);
            logger.info(`Created account: ${account.name}`);
        } catch (error) {
            logger.error(`Failed to create account ${account.name}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    logger.info(`Successfully created ${config.accounts.length} test accounts`);
}

async function getManagementCredentials(k8s: KubernetesClient, options: AccountsOptions): Promise<{ managementEndpoint: string; authToken: string }> {
    // Get management API endpoint from service
    const managementService = await k8s.coreApi.readNamespacedService({
        name: 'zenko-management',
        namespace: options.namespace,
    });

    const managementPort = managementService.spec?.ports?.find(p => p.name === 'http')?.port || 8080;
    const managementEndpoint = `http://zenko-management.${options.namespace}.svc.cluster.local:${managementPort}`;

    // Get admin credentials for authentication
    const adminSecret = await k8s.coreApi.readNamespacedSecret({
        name: 'zenko-admin',
        namespace: options.namespace,
    });

    if (!adminSecret.data) {
        throw new Error('Failed to retrieve admin credentials from zenko-admin secret');
    }

    const accessKey = Buffer.from(adminSecret.data['access-key'], 'base64').toString();
    const secretKey = Buffer.from(adminSecret.data['secret-key'], 'base64').toString();

    // Create admin auth token (basic auth for management API)
    const authToken = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');

    return { managementEndpoint, authToken };
}

async function getInstanceId(k8s: KubernetesClient, options: AccountsOptions): Promise<string | null> {
    try {
        // Try to get instance ID from Zenko CR
        const customObjects = k8s.customObjectsApi;
        const zenkoList = await customObjects.listNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha1',
            namespace: options.namespace,
            plural: 'zenkos',
        });

        const zenkos = zenkoList.body as any;
        if (zenkos.items && zenkos.items.length > 0) {
            return zenkos.items[0].spec?.instanceId || zenkos.items[0].metadata?.name;
        }

        return null;
    } catch (error) {
        logger.debug(`Failed to retrieve instance ID from Zenko CR: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

async function createAccount(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    account: AccountConfig,
    options: AccountsOptions
): Promise<void> {

    const accountPayload = {
        userName: account.name,
        email: account.email,
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/user`,
        accountPayload,
        {
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    // Store account credentials in a Kubernetes secret for later use in tests
    const accountData = response.data;
    const k8s = new KubernetesClient();

    const secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
            name: `end2end-account-${account.name}`,
            namespace: options.namespace,
            labels: {
                'app.kubernetes.io/name': 'zenko-test-setup',
                'app.kubernetes.io/component': 'account-credentials',
                'test.zenko.io/account-name': account.name,
            },
        },
        data: {
            'account-id': Buffer.from(accountData.id || '').toString('base64'),
            'account-name': Buffer.from(account.name).toString('base64'),
            'account-email': Buffer.from(account.email).toString('base64'),
            'access-key': Buffer.from(accountData.accessKey || '').toString('base64'),
            'secret-key': Buffer.from(accountData.secretKey || '').toString('base64'),
        },
    };

    await k8s.applyManifest(secret, options.namespace);
    logger.debug(`Created secret end2end-account-${account.name} with account credentials`);
}