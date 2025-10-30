
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import * as k8s from './utils/k8s';
import { logger } from './utils/logger';
import {
    getInstanceId,
    getManagementToken,
    getManagementEndpoint,
    createAccount as createAccountAPI,
    assumeRoleWithWebIdentity,
    AccountPayload,
    STSCredentials
} from './utils/management';
import { resolveEnvValues } from './utils/resource-creation';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface AccountOptions {
    namespace: string;
    accounts?: string[];
    configFile?: string;
}

export interface AccountConfig {
    name: string;
    email: string;
    role?: string;
    quota?: number | null;
    description?: string;
}

export interface AccountsConfiguration {
    accounts: AccountConfig[];
    config: {
        defaultRole: string;
        stsSessionDuration: number;
        createSecrets: boolean;
        secretNamePrefix: string;
    };
}

/**
 * Setup accounts and credentials
 * @param options - Account options
 * @returns Promise that resolves when the accounts are setup
 */
export async function setupAccounts(options: AccountOptions): Promise<void> {
    logger.info('Setting up test accounts and credentials');

    try {
        const namespace = options.namespace || 'default';

        const instanceId = await getInstanceId();
        if (!instanceId) {
            throw new Error('instance ID is required for account setup. Ensure UUID environment variable is set or Zenko CR exists');
        }

        const accountsConfig = await loadAccountsConfig(options.configFile);

        const accountsToCreate = options.accounts
            ? options.accounts.map(name => {
                const existingAccount = accountsConfig.accounts.find(acc => acc.name === name);
                return existingAccount || {
                    name,
                    email: `${name}@zenko.local`,
                    role: accountsConfig.config.defaultRole
                };
            })
            : accountsConfig.accounts;

        logger.info('Account setup configuration', {
            accounts: accountsToCreate.map(a => ({ name: a.name, email: a.email })),
            namespace,
            instanceId: instanceId.substring(0, 8) + '...', // Log partial ID for security
        });

        logger.info('Connecting to management API...');
        const managementEndpoint = await getManagementEndpoint();
        const authToken = await getManagementToken();

        for (const accountConfig of accountsToCreate) {
            try {
                const accountName = resolveEnvValues(accountConfig.name);
                const accountEmail = accountConfig.email.replace(accountConfig.name, accountName);

                logger.info(`Processing account: ${accountName}`);

                const accountPayload: AccountPayload = {
                    userName: accountName,
                    email: accountEmail,
                    quota: accountConfig.quota
                };

                const createdAccount = await createAccountAPI(managementEndpoint, authToken, instanceId, accountPayload);

                const stsCredentials = await getSTSSessionCredentials(authToken, createdAccount.id, accountConfig.role || accountsConfig.config.defaultRole);

                if (accountsConfig.config.createSecrets) {
                    await createAccountSecret(namespace, accountName, stsCredentials, createdAccount.id, accountsConfig.config.secretNamePrefix);
                }

                logger.info(`Successfully created account: ${accountName}`, {
                    secretName: `end2end-account-${accountName}`,
                    namespace
                });

            } catch (error) {
                logger.error(`Failed to create account: ${accountConfig.name}`, {
                    error: error instanceof Error ? error.message : String(error),
                    accountConfig
                });
                throw error;
            }
        }

        logger.info('Account setup completed successfully', {
            createdAccounts: accountsToCreate.length,
            namespace
        });

    } catch (error) {
        logger.error('Account setup failed', {
            error: error instanceof Error ? error.message : String(error),
            options
        });
        throw error;
    }
}

/**
 * Load accounts configuration
 * @param configFile - Configuration file
 * @returns Accounts configuration
 */
async function loadAccountsConfig(configFile?: string): Promise<AccountsConfiguration> {
    const defaultConfigPath = join(__dirname, '../configs/accounts.json');
    const configPath = configFile || defaultConfigPath;

    try {
        logger.debug('Loading accounts configuration', { configPath });
        const configContent = await readFile(configPath, 'utf-8');
        const config: AccountsConfiguration = JSON.parse(configContent);

        logger.debug('Accounts configuration loaded', {
            accountsCount: config.accounts.length,
            defaultRole: config.config.defaultRole
        });

        return config;
    } catch (error) {
        logger.error('Failed to load accounts configuration', { error, configPath });
        throw new Error(`Failed to load accounts configuration from ${configPath}: ${error}`);
    }
}


/**
 * Get STS session credentials via assume role
 * @param oidcToken - OIDC token
 * @param accountId - Account ID
 * @param role - Role
 * @returns STS credentials
 */
async function getSTSSessionCredentials(oidcToken: string, accountId: string, role: string): Promise<STSCredentials> {
    logger.debug('Getting STS session credentials via assume role');

    try {
        const roleArn = `arn:aws:iam::${accountId}:role/scality-internal/${role}`;
        const roleSessionName = 'end2end-account-setup';
        const durationSeconds = 43200; // 12 hours

        const stsCredentials = await assumeRoleWithWebIdentity('zenko.local', {
            RoleArn: roleArn,
            RoleSessionName: roleSessionName,
            WebIdentityToken: oidcToken,
            DurationSeconds: durationSeconds
        });

        logger.info('STS session credentials obtained', {
            accountId,
            roleArn,
            accessKeyId: stsCredentials.AccessKeyId.substring(0, 8) + '...'
        });

        return stsCredentials;
    } catch (error) {
        logger.error('Failed to get STS session credentials', { error, accountId, role });
        throw new Error(`STS session credential retrieval failed for account ${accountId}: ${error}`);
    }
}

/**
 * Create account secret
 * @param namespace - Namespace
 * @param accountName - Account name
 * @param credentials - STS credentials
 * @param accountId - Account ID
 * @param secretNamePrefix - Secret name prefix
 * @returns Promise that resolves when the account secret is created
 */
async function createAccountSecret(
    namespace: string,
    accountName: string,
    credentials: STSCredentials,
    accountId: string,
    secretNamePrefix: string = 'end2end-account'
): Promise<void> {
    logger.debug(`Creating Kubernetes secret for account: ${accountName}`);

    const secretName = `${secretNamePrefix}-${accountName}`;

    const secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
            name: secretName,
            namespace,
            labels: {
                'type': 'end2end',
                'account': accountName
            }
        },
        stringData: {
            AccessKeyId: credentials.AccessKeyId,
            SecretAccessKey: credentials.SecretAccessKey,
            SessionToken: credentials.SessionToken,
            AccountId: accountId
        }
    };

    try {
        await KubernetesHelper.applySecret(secret, namespace);
        logger.info(`Created account secret: ${secretName}`);
    } catch (error) {
        logger.error(`Failed to create account secret: ${secretName}`, { error });
        throw error;
    }
}
