import KcAdminClient from '@keycloak/keycloak-admin-client';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import * as Werelogs from 'werelogs';

const DEFAULT_ACCOUNT_NAME = 'AccountTest';

/**
 * Keycloak configuration utility using the official Keycloak Admin Client.
 * Handles authentication and setup of groups, roles, and users in Keycloak.
 * Supports default roles from typical Scality products.
 */
export default class Keycloak {
    private readonly kcAdminClient: KcAdminClient;
    private readonly realm: string;
    private readonly host: string;
    private readonly username: string;
    private readonly password: string;
    private readonly clientId: string;

    // Configuration from environment variables with defaults
    private readonly config = {
        account: process.env.ACCOUNT || DEFAULT_ACCOUNT_NAME,
        storageManager: process.env.STORAGE_MANAGER || 'storage_manager',
        storageAccountOwner: process.env.STORAGE_ACCOUNT_OWNER || 'storage_account_owner',
        dataConsumer: process.env.DATA_CONSUMER || 'data_consumer',
        dataAccessor: process.env.DATA_ACCESSOR || 'data_accessor',
    };

    private readonly passwordConfig = [
        {
            type: 'password',
            value: '123',
            temporary: false,
        },
    ];

    private readonly logger: Werelogs.RequestLogger;

    constructor(
        parameters: {
            host: string;
            realm: string;
            username: string;
            password: string;
            clientId: string;
        },
        logger?: Werelogs.RequestLogger,
    ) {
        this.logger = logger || new Werelogs.Logger('Keycloak').newRequestLogger();
        this.realm = parameters.realm;
        this.host = parameters.host;
        this.username = parameters.username;
        this.password = parameters.password;
        this.clientId = parameters.clientId;

        logger?.debug('Keycloak parameters', {
            host: this.host,
            realm: this.realm,
            username: this.username,
            clientId: this.clientId,
        });

        // Initialize Keycloak Admin Client
        this.kcAdminClient = new KcAdminClient({
            baseUrl: `${this.host}/auth`,
            realmName: 'master', // Auth realm for authentication
        });
    }

    /**
     * Authenticate with Keycloak using the admin client
     */
    private async authenticate(): Promise<void> {
        this.logger.info('Authenticating with Keycloak...');

        try {
            await this.kcAdminClient.auth({
                username: this.username,
                password: this.password,
                grantType: 'password',
                clientId: this.clientId,
            });

            // should set the realm to the one we are using
            this.kcAdminClient.setConfig({ realmName: this.realm });

            this.logger.info('Successfully authenticated with Keycloak');
        } catch (error) {
            this.logger.error('Failed to authenticate with Keycloak', { error });
            throw error;
        }
    }

    /**
     * Check if a group exists in Keycloak
     */
    private async groupExists(groupName: string): Promise<boolean> {
        try {
            const groups = await this.kcAdminClient.groups.find({
                realm: this.realm,
                search: groupName,
            });
            return groups.some(group => group.name === groupName);
        } catch (error) {
            this.logger.error(`Failed to check if group exists: ${groupName}`, { error });
            return false; // Assume it doesn't exist if we can't check
        }
    }

    /**
     * Check if a role exists in Keycloak
     */
    private async roleExists(roleName: string): Promise<boolean> {
        try {
            // Uses roles.find() + filter instead of findOneByName to avoid
            // URL encoding issues with special characters (e.g. '::') in role names.
            const roles = await this.kcAdminClient.roles.find({
                realm: this.realm,
            });
            return roles.some(role => role.name === roleName);
        } catch (error) {
            this.logger.error(`Failed to check if role exists: ${roleName}`, { error });
            return false; // Assume it doesn't exist if we can't check
        }
    }

    /**
     * Check if a user exists in Keycloak
     */
    private async userExists(username: string): Promise<boolean> {
        try {
            const users = await this.kcAdminClient.users.find({
                realm: this.realm,
                username,
                exact: true,
            });
            return users && users.length > 0;
        } catch (error) {
            this.logger.error(`Failed to check if user exists: ${username}`, { error });
            return false; // Assume it doesn't exist if we can't check
        }
    }

    /**
     * Create a group in Keycloak (noop if already exists)
     */
    private async createGroup(groupName: string): Promise<void> {
        if (await this.groupExists(groupName)) {
            this.logger.debug(`Group already exists, skipping creation: ${groupName}`);
            return;
        }

        try {
            await this.kcAdminClient.groups.create({
                realm: this.realm,
                name: groupName,
            });
            this.logger.info(`Successfully created group: ${groupName}`);
        } catch (error) {
            this.logger.error(`Failed to create group: ${groupName}`, { error });
            throw error;
        }
    }

    /**
     * Create a role in Keycloak (noop if already exists)
     */
    private async createRole(roleName: string): Promise<void> {
        if (await this.roleExists(roleName)) {
            this.logger.debug(`Role already exists, skipping creation: ${roleName}`);
            return;
        }

        try {
            await this.kcAdminClient.roles.create({
                realm: this.realm,
                name: roleName,
            });
            this.logger.info(`Successfully created role: ${roleName}`);
        } catch (error) {
            this.logger.error(`Failed to create role: ${roleName}`, { error });
            throw error;
        }
    }

    /**
     * Create a user in Keycloak
     */
    private async createUser(username: string, groups?: string[], realmRoles?: string[]): Promise<void> {
        const userData = {
            realm: this.realm,
            username,
            firstName: username,
            lastName: username,
            email: `${username}@scality.com`,
            enabled: true,
            credentials: this.passwordConfig,
            ...(groups && { groups }),
            ...(realmRoles && { realmRoles }),
        };

        if (await this.userExists(username)) {
            this.logger.debug(`User already exists, skipping creation: ${username}`);
            return;
        }

        try {
            await this.kcAdminClient.users.create(userData);
            this.logger.info(`Successfully created user: ${username}`);
        } catch (error) {
            this.logger.error(`Failed to create user: ${username}`, { error });
            throw error;
        }
    }

    /**
     * Get user ID by username
     */
    private async getUserId(username: string): Promise<string> {
        try {
            const users = await this.kcAdminClient.users.find({
                realm: this.realm,
                username,
                exact: true,
            });

            if (!users || users.length === 0) {
                throw new Error(`User not found: ${username}`);
            }

            if (users.length > 1) {
                throw new Error(`Found duplicate users for username: ${username}`);
            }

            return users[0].id!;
        } catch (error) {
            this.logger.error(`Failed to get user ID for: ${username}`, { error });
            throw error;
        }
    }

    /**
     * Get role by name
     */
    private async getRole(roleName: string): Promise<RoleRepresentation> {
        try {
            // Uses roles.find() + filter instead of findOneByName to avoid
            // URL encoding issues with special characters (e.g. '::') in role names.
            const roles = await this.kcAdminClient.roles.find({
                realm: this.realm,
            });
            const role = roles.find(r => r.name === roleName);

            if (!role) {
                throw new Error(`Role not found: ${roleName}`);
            }

            return role;
        } catch (error) {
            this.logger.error(`Failed to get role: ${roleName}`, { error });
            throw error;
        }
    }

    /**
     * Assign role to user
     */
    private async assignRoleToUser(userId: string, role: RoleRepresentation): Promise<void> {
        try {
            await this.kcAdminClient.users.addRealmRoleMappings({
                realm: this.realm,
                id: userId,
                roles: [
                    {
                        id: role.id!,
                        name: role.name!,
                    },
                ],
            });
            this.logger.info(`Successfully assigned role ${role.name} to user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to assign role ${role.name} to user ${userId}`, { error });
            throw error;
        }
    }

    /**
     * Setup groups in Keycloak
     */
    private async setupGroups(): Promise<void> {
        this.logger.info('Setting up Keycloak groups...');

        const groups = [
            `${this.config.account}::StorageAccountOwner`,
            `${this.config.account}::DataConsumer`,
            `${this.config.account}::DataAccessor`,
        ];

        for (const group of groups) {
            await this.createGroup(group);
        }

        this.logger.info('Successfully set up all Keycloak groups');
    }

    /**
     * Setup roles in Keycloak
     */
    private async setupRoles(): Promise<void> {
        this.logger.info('Setting up Keycloak roles...');

        const roles = [
            `${this.config.account}::StorageAccountOwner`,
            `${this.config.account}::DataConsumer`,
            `${this.config.account}::DataAccessor`,
        ];

        for (const role of roles) {
            await this.createRole(role);
        }

        this.logger.info('Successfully set up all Keycloak roles');
    }

    /**
     * Setup users in Keycloak
     */
    private async setupUsers(): Promise<void> {
        this.logger.info('Setting up Keycloak users...');

        // Create storage manager with realm role
        await this.createUser(this.config.storageManager, undefined, ['StorageManager']);

        // Create users with groups
        await this.createUser(this.config.storageAccountOwner, [`${this.config.account}::StorageAccountOwner`]);
        await this.createUser(this.config.dataConsumer, [`${this.config.account}::DataConsumer`]);
        await this.createUser(this.config.dataAccessor, [`${this.config.account}::DataAccessor`]);

        this.logger.info('Successfully set up all Keycloak users');
    }

    /**
     * Attach roles to users
     */
    private async attachRoles(): Promise<void> {
        this.logger.info('Attaching roles to users...');

        // Attach StorageManager role to storage manager
        try {
            const storageManagerId = await this.getUserId(this.config.storageManager);
            const storageManagerRole = await this.getRole('StorageManager');
            await this.assignRoleToUser(storageManagerId, storageManagerRole);
        } catch (error) {
            this.logger.warn('Failed to attach StorageManager role - role may not exist yet', {
                error,
            });
        }

        // Attach account-specific roles to users
        const userRoleMappings = [
            {
                username: this.config.storageAccountOwner,
                roleName: `${this.config.account}::StorageAccountOwner`,
            },
            {
                username: this.config.dataConsumer,
                roleName: `${this.config.account}::DataConsumer`,
            },
            {
                username: this.config.dataAccessor,
                roleName: `${this.config.account}::DataAccessor`,
            },
        ];

        for (const mapping of userRoleMappings) {
            try {
                const userId = await this.getUserId(mapping.username);
                const role = await this.getRole(mapping.roleName);
                await this.assignRoleToUser(userId, role);
            } catch (error) {
                this.logger.error(`Failed to attach role ${mapping.roleName} to user ${mapping.username}`, {
                    error,
                });
                throw error;
            }
        }

        this.logger.info('Successfully attached all roles to users');
    }

    /**
     * Full Keycloak seeding process
     */
    public async seedKeycloakWithDefaultRoles(): Promise<void> {
        this.logger.info('Starting Keycloak seeding process...');

        try {
            await this.authenticate();
            await this.setupGroups();
            await this.setupRoles();
            await this.setupUsers();
            await this.attachRoles();

            this.logger.info('Keycloak seeding completed successfully');
        } catch (error) {
            this.logger.error('Keycloak seeding failed', { error });
            throw error;
        }
    }
}
