import axios from 'axios';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface KeycloakOptions {
    namespace: string;
    instanceId?: string;
    dryRun?: boolean;
}

interface KeycloakConfig {
    endpoint: string;
    adminUsername: string;
    adminPassword: string;
    realm: string;
}

export async function setupKeycloak(options: KeycloakOptions): Promise<void> {
    logger.info('Setting up Keycloak realm, users, and roles');

    const k8s = new KubernetesClient();
    const keycloakConfig = await getKeycloakConfig(k8s, options.namespace);

    if (!keycloakConfig) {
        logger.warn('Keycloak not found or not configured, skipping Keycloak setup');
        return;
    }

    const adminToken = await getAdminToken(keycloakConfig);

    await createRealm(keycloakConfig, adminToken);
    await createRoles(keycloakConfig, adminToken, options.instanceId);
    await createUsers(keycloakConfig, adminToken, options.instanceId);

    logger.info('Keycloak setup completed');
}

async function getKeycloakConfig(k8s: KubernetesClient, namespace: string): Promise<KeycloakConfig | null> {
    try {
        // Look for Keycloak service
        const services = await k8s.coreApi.listNamespacedService(namespace);
        const keycloakService = services.body.items.find(svc =>
            svc.metadata?.name?.toLowerCase().includes('keycloak') ||
            svc.metadata?.name?.toLowerCase().includes('auth')
        );

        if (!keycloakService) {
            return null;
        }

        // Look for Keycloak admin credentials
        const secrets = await k8s.coreApi.listNamespacedSecret(namespace);
        const keycloakSecret = secrets.body.items.find(secret =>
            secret.metadata?.name?.toLowerCase().includes('keycloak') &&
            (secret.metadata?.name?.toLowerCase().includes('admin') ||
                secret.metadata?.name?.toLowerCase().includes('credentials'))
        );

        let adminUsername = 'admin';
        let adminPassword = 'admin';

        if (keycloakSecret?.data) {
            adminUsername = keycloakSecret.data['username'] ?
                Buffer.from(keycloakSecret.data['username'], 'base64').toString() : 'admin';
            adminPassword = keycloakSecret.data['password'] ?
                Buffer.from(keycloakSecret.data['password'], 'base64').toString() : 'admin';
        }

        const serviceName = keycloakService.metadata!.name;
        const port = keycloakService.spec?.ports?.[0]?.port || 8080;
        const endpoint = `http://${serviceName}.${namespace}.svc.cluster.local:${port}`;

        return {
            endpoint,
            adminUsername,
            adminPassword,
            realm: 'zenko'
        };

    } catch (error) {
        logger.debug(`Error getting Keycloak config: ${error}`);
        return null;
    }
}

async function getAdminToken(config: KeycloakConfig): Promise<string> {
    try {
        const response = await axios.post(
            `${config.endpoint}/auth/realms/master/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: 'password',
                client_id: 'admin-cli',
                username: config.adminUsername,
                password: config.adminPassword
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 30000
            }
        );

        return response.data.access_token;
    } catch (error: any) {
        logger.error(`Failed to get Keycloak admin token: ${error.message}`);
        throw error;
    }
}

async function createRealm(config: KeycloakConfig, token: string): Promise<void> {
    const realmData = {
        realm: config.realm,
        enabled: true,
        displayName: 'Zenko Test Realm',
        registrationAllowed: false,
        resetPasswordAllowed: true,
        editUsernameAllowed: false,
        loginWithEmailAllowed: true,
        duplicateEmailsAllowed: false,
        verifyEmail: false,
        loginTheme: 'keycloak',
        accountTheme: 'keycloak',
        adminTheme: 'keycloak',
        emailTheme: 'keycloak'
    };

    try {
        await axios.post(
            `${config.endpoint}/auth/admin/realms`,
            realmData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        logger.debug(`Created realm: ${config.realm}`);
    } catch (error: any) {
        if (error.response?.status === 409) {
            logger.debug(`Realm ${config.realm} already exists`);
        } else {
            throw error;
        }
    }
}

async function createRoles(config: KeycloakConfig, token: string, instanceId?: string): Promise<void> {
    const baseRoles = [
        'StorageManager',
        'StorageAccountOwner',
        'DataConsumer'
    ];

    // Add instance-specific account roles
    const accountRoles = instanceId ? [
        `AccountTest::${instanceId}`,
        `AccountTest::${instanceId}::StorageManager`,
        `AccountTest::${instanceId}::DataConsumer`
    ] : [
        'AccountTest::xyz123',
        'AccountTest::xyz123::StorageManager',
        'AccountTest::xyz123::DataConsumer'
    ];

    const allRoles = [...baseRoles, ...accountRoles];

    for (const roleName of allRoles) {
        try {
            await axios.post(
                `${config.endpoint}/auth/admin/realms/${config.realm}/roles`,
                {
                    name: roleName,
                    description: `Zenko test role: ${roleName}`
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            logger.debug(`Created role: ${roleName}`);
        } catch (error: any) {
            if (error.response?.status === 409) {
                logger.debug(`Role ${roleName} already exists`);
            } else {
                logger.error(`Failed to create role ${roleName}: ${error.message}`);
            }
        }
    }
}

async function createUsers(config: KeycloakConfig, token: string, instanceId?: string): Promise<void> {
    const testUsers = [
        {
            username: 'storage-manager',
            email: 'storage-manager@test.local',
            firstName: 'Storage',
            lastName: 'Manager',
            roles: ['StorageManager'],
            password: 'password123'
        },
        {
            username: 'account-owner',
            email: 'account-owner@test.local',
            firstName: 'Account',
            lastName: 'Owner',
            roles: ['StorageAccountOwner'],
            password: 'password123'
        },
        {
            username: 'data-consumer',
            email: 'data-consumer@test.local',
            firstName: 'Data',
            lastName: 'Consumer',
            roles: ['DataConsumer'],
            password: 'password123'
        }
    ];

    // Add instance-specific test user
    if (instanceId) {
        testUsers.push({
            username: `test-${instanceId}`,
            email: `test-${instanceId}@test.local`,
            firstName: 'Test',
            lastName: 'User',
            roles: [`AccountTest::${instanceId}`, `AccountTest::${instanceId}::StorageManager`],
            password: 'password123'
        });
    }

    for (const user of testUsers) {
        try {
            // Create user
            const createUserResponse = await axios.post(
                `${config.endpoint}/auth/admin/realms/${config.realm}/users`,
                {
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    enabled: true,
                    emailVerified: true,
                    credentials: [{
                        type: 'password',
                        value: user.password,
                        temporary: false
                    }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            // Get user ID from Location header or by querying
            let userId = '';
            if (createUserResponse.headers.location) {
                userId = createUserResponse.headers.location.split('/').pop();
            } else {
                // Query for user ID
                const usersResponse = await axios.get(
                    `${config.endpoint}/auth/admin/realms/${config.realm}/users?username=${user.username}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` },
                        timeout: 30000
                    }
                );
                userId = usersResponse.data[0]?.id;
            }

            if (userId) {
                // Assign roles to user
                for (const roleName of user.roles) {
                    try {
                        // Get role details
                        const roleResponse = await axios.get(
                            `${config.endpoint}/auth/admin/realms/${config.realm}/roles/${roleName}`,
                            {
                                headers: { 'Authorization': `Bearer ${token}` },
                                timeout: 30000
                            }
                        );

                        // Assign role to user
                        await axios.post(
                            `${config.endpoint}/auth/admin/realms/${config.realm}/users/${userId}/role-mappings/realm`,
                            [roleResponse.data],
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                timeout: 30000
                            }
                        );
                        logger.debug(`Assigned role ${roleName} to user ${user.username}`);
                    } catch (roleError) {
                        logger.warn(`Failed to assign role ${roleName} to user ${user.username}`);
                    }
                }
            }

            logger.debug(`Created user: ${user.username}`);

        } catch (error: any) {
            if (error.response?.status === 409) {
                logger.debug(`User ${user.username} already exists`);
            } else {
                logger.error(`Failed to create user ${user.username}: ${error.message}`);
            }
        }
    }
}