import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { DLQMessage, dlqKey } from 'steps/utils/kafka';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import {
    AttachUserPolicyCommand,
    CreateAccessKeyCommand,
    CreatePolicyCommand,
    CreateRoleCommand,
    CreateUserCommand,
    GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
    AssumeRoleCommand,
    AssumeRoleWithWebIdentityCommand,
} from '@aws-sdk/client-sts';
import { AwsClientManager, AwsCredentials } from './AwsClientManager';
import { aws4Interceptor } from 'aws4-axios';
import fs from 'fs';
import lockFile from 'proper-lockfile';
import Werelogs from 'werelogs';
import {
    CacheHelper,
    ClientOptions,
    Constants,
    Identity,
    IdentityEnum,
    SuperAdmin,
    Utils,
    Logger,
} from 'cli-testing';
import ZenkoDrctl from 'steps/dr/drctl';
import assert from 'assert';

interface ServiceUsersCredentials {
    accessKey: string;
    secretKey: string;
}

// Zenko entities
export interface SavedIdentity {
    identityName: string;
    identityType: IdentityEnum;
    accountName: string;
}

export enum EntityType {
    ACCOUNT = 'ACCOUNT',
    IAM_USER = 'IAM_USER',
    STORAGE_MANAGER = 'STORAGE_MANAGER',
    STORAGE_ACCOUNT_OWNER = 'STORAGE_ACCOUNT_OWNER',
    DATA_CONSUMER = 'DATA_CONSUMER',
    DATA_ACCESSOR = 'DATA_ACCESSOR',
    ASSUME_ROLE_USER = 'ASSUME_ROLE_USER',
    ASSUME_ROLE_USER_CROSS_ACCOUNT = 'ASSUME_ROLE_USER_CROSS_ACCOUNT',
}

export interface ZenkoWorldParameters extends ClientOptions {
    AccountName: string;
    AccountAccessKey: string;
    AccountSecretKey: string;
    DRAdminAccessKey?: string;
    DRAdminSecretKey?: string;
    DRSubdomain?: string;
    VaultAuthHost: string;
    NotificationDestination: string;
    NotificationDestinationTopic: string;
    NotificationDestinationAlt: string;
    NotificationDestinationTopicAlt: string;
    NotificationDestinationPlain: string;
    NotificationDestinationTopicPlain: string;
    NotificationDestinationScram: string;
    NotificationDestinationTopicScram: string;
    KafkaExternalIps: string;
    KafkaHosts: string;
    KafkaAuthHosts: string;
    KafkaConnectUrl: string;
    PrometheusService: string;
    PrometheusEndpoint: string;
    KeycloakUsername: string;
    KeycloakPassword: string;
    KeycloakHost: string;
    KeycloakPort: string;
    KeycloakRealm: string;
    KeycloakClientId: string;
    KeycloakGrantType: string;
    StorageManagerUsername: string;
    StorageAccountOwnerUsername: string;
    DataConsumerUsername: string;
    DataAccessorUsername: string;
    ServiceUsersCredentials: string;
    KeycloakTestPassword: string;
    AzureAccountName: string;
    AzureAccountKey: string;
    AzureArchiveContainer: string;
    AzureArchiveContainer2: string;
    AzureArchiveAccessTier: string;
    AzureArchiveManifestTier: string;
    AzureArchiveQueue: string;
    TimeProgressionFactor: number;
    KafkaDeadLetterQueueTopic: string;
    KafkaObjectTaskTopic: string;
    KafkaGCRequestTopic: string;
    InstanceID: string;
    BackbeatApiHost: string;
    BackbeatApiPort: string;
    KafkaCleanerInterval: string;
    SorbetdRestoreTimeout: string;
    UtilizationServiceHost: string;
    UtilizationServicePort: string;
    [key: string]: unknown;
}

export type S3Outcome<T = unknown> =
    | { ok: true; data: T }
    | { ok: false; error: Error };

/**
 * Cucumber custom World implementation to support Zenko.
 * This World is responsible for AWS CLI calls.
 * Shared between all tests (S3, IAM, STS).
 */
export default class Zenko extends World<ZenkoWorldParameters> {
    private lastS3Outcome: S3Outcome | null = null;

    private commandParameters: Record<string, unknown> = {};

    private saved: Record<string, unknown> = {};

    public zenkoDrCtl: ZenkoDrctl | null = null;

    static sites: {
        [key: string]: {
            accountName: string;
            adminIdentityName: string;
        };
    } = {};

    public logger: Werelogs.RequestLogger = new Werelogs.Logger('CTST').newRequestLogger();

    readonly awsClients: AwsClientManager;

    static readonly PRIMARY_SITE_NAME = 'admin';
    static readonly SECONDARY_SITE_NAME = 'dradmin';
    static readonly PRA_INSTALL_COUNT_KEY = 'praInstallCount';
    // Keyed by dlqKey(op, bucketName, objectKey). Array per key handles
    // Kafka at-least-once delivery and retries of the same object.
    static readonly dlqBuffer = new Map<string, DLQMessage[]>();
    static readonly storedCredentials = new Map<string, AwsCredentials>();

    static addToDLQBuffer(msg: DLQMessage): void {
        const key = dlqKey(msg.op, msg.bucketName, msg.objectKey);
        const list = Zenko.dlqBuffer.get(key) ?? [];
        list.push(msg);
        Zenko.dlqBuffer.set(key, list);
    }

    /**
     * @constructor
     * @param {Object} options - parameters provided as a CLI parameter when running the tests
     */
    constructor(options: IWorldOptions<ZenkoWorldParameters>) {
        super(options);
        Logger.createLogger(this);

        const protocol = this.parameters.ssl === false ? 'http' : 'https';
        const subdomain = this.parameters.subdomain || Constants.DEFAULT_SUBDOMAIN;
        this.awsClients = new AwsClientManager(
            `${protocol}://s3.${subdomain}`,
            `${protocol}://iam.${subdomain}`,
            `${protocol}://sts.${subdomain}`,
        );

        // store service users credentials from world parameters
        if (this.parameters.ServiceUsersCredentials) {
            const serviceUserCredentials =
                JSON.parse(this.parameters.ServiceUsersCredentials) as Record<string, ServiceUsersCredentials>;
            for (const serviceUserName in serviceUserCredentials) {
                this.registerIdentity(serviceUserName, {
                    accessKeyId: serviceUserCredentials[serviceUserName].accessKey,
                    secretAccessKey: serviceUserCredentials[serviceUserName].secretKey,
                });
            }
        }

        // Workaround to be able to access global parameters in BeforeAll/AfterAll hooks
        CacheHelper.cacheParameters({
            ...this.parameters,
        });

        CacheHelper.savedAcrossTests[Zenko.PRA_INSTALL_COUNT_KEY] = 0;


        if (this.parameters.AccountName &&
            this.parameters.AccountAccessKey &&
            this.parameters.AccountSecretKey &&
            !Zenko.storedCredentials.has(this.parameters.AccountName)) {
            Zenko.storedCredentials.set(this.parameters.AccountName, {
                accessKeyId: this.parameters.AccountAccessKey,
                secretAccessKey: this.parameters.AccountSecretKey,
            });
        }

        if (this.parameters.AccountName) {
            // Zenko.init() may have run before this constructor and cached updated creds.
            // Read back from cache so the new credentials map always has the current keys.
            const creds = Zenko.storedCredentials.get(this.parameters.AccountName) || {
                accessKeyId: this.parameters.AccountAccessKey,
                secretAccessKey: this.parameters.AccountSecretKey,
            };
            this.registerIdentity(this.parameters.AccountName, creds, true);
        }

        if (this.parameters.AdminAccessKey && this.parameters.AdminSecretKey &&
            !Identity.hasIdentity(IdentityEnum.ADMIN, Zenko.PRIMARY_SITE_NAME)) {
            Identity.addIdentity(IdentityEnum.ADMIN, Zenko.PRIMARY_SITE_NAME, {
                accessKeyId: this.parameters.AdminAccessKey,
                secretAccessKey: this.parameters.AdminSecretKey,
            }, undefined, undefined, undefined, this.parameters.subdomain);

            Zenko.sites['source'] = {
                accountName: this.parameters.AccountName,
                adminIdentityName: Zenko.PRIMARY_SITE_NAME,
            };
        }

        if (this.needsSecondarySite()) {
            if (!Identity.hasIdentity(IdentityEnum.ADMIN, Zenko.SECONDARY_SITE_NAME)) {
                Identity.addIdentity(IdentityEnum.ADMIN, Zenko.SECONDARY_SITE_NAME, {
                    accessKeyId: this.parameters.DRAdminAccessKey!,
                    secretAccessKey: this.parameters.DRAdminSecretKey!,
                }, undefined, undefined, undefined, this.parameters.DRSubdomain);
            }

            Zenko.sites['sink'] = {
                accountName: `dr${this.parameters.AccountName}`,
                adminIdentityName: Zenko.SECONDARY_SITE_NAME,
            };
        }

        this.logger.debug('Zenko sites', {
            sites: Zenko.sites,
        });
    }

    private needsSecondarySite() {
        return this.parameters.DRAdminAccessKey && this.parameters.DRAdminSecretKey && this.parameters.DRSubdomain;
    }

    registerIdentity(name: string, creds: AwsCredentials, isDefault = false): void {
        this.awsClients.registerIdentity(name, creds, isDefault);
    }

    useIdentity(name: string): void {
        this.awsClients.useIdentity(name);
    }

    resetIdentity(): void {
        this.awsClients.reset();
    }


    /**
     * This function will dynamically prepare credentials based on the type of
     * entity provided to let the test run the AWS CLI command using this particular
     * type of entity.
     * @param {ScenarioCallerType} entityType - type of entity, can be 'account', 'storage manager',
     * 'storage account owner', 'data consumer', 'data accessor' or 'iam user'
     * @returns {undefined}
     */
    async setupEntity(entityType: string): Promise<void> {
        const savedParameters = JSON.parse(JSON.stringify(this.commandParameters)) as object;
        this.addToSaved('identityType', entityType);

        switch (entityType) {
        case EntityType.ACCOUNT:
            await this.createAccount();
            break;
        case EntityType.IAM_USER:
            await this.prepareIamUser();
            break;
        case EntityType.STORAGE_MANAGER:
            await this.prepareARWWI(this.parameters.StorageManagerUsername || 'storage_manager',
                'storage-manager-role', this.parameters.KeycloakTestPassword);
            break;
        case EntityType.STORAGE_ACCOUNT_OWNER:
            await this.prepareARWWI(this.parameters.StorageAccountOwnerUsername || 'storage_account_owner',
                'storage-account-owner-role', this.parameters.KeycloakTestPassword);
            break;
        case EntityType.DATA_CONSUMER:
            await this.prepareARWWI(this.parameters.DataConsumerUsername || 'data_consumer',
                'data-consumer-role', this.parameters.KeycloakTestPassword);
            break;
        case EntityType.DATA_ACCESSOR:
            await this.prepareARWWI(this.parameters.DataAccessorUsername || 'data_accessor',
                'data-accessor-role', this.parameters.KeycloakTestPassword);
            break;
        case EntityType.ASSUME_ROLE_USER:
            await this.prepareAssumeRole(false);
            break;
        case EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT:
            await this.prepareAssumeRole(true);
            break;
        default:
            break;
        }

        this.resetCommand();
        this.commandParameters = savedParameters as Record<string, unknown>;
    }

    /**
     * Creates an assumed role session using a web identity from the IDP with a
     * duration of 12 hours.
     * @param {string} ARWWIName - IDP username of the current STS session
     * @param {string} ARWWITargetRole - role to assume. The first role returned
     * by GetRolesForWebIdentity matching this name will be dynamically chosen
     * @param {string} ARWWIPassword - IDP password of the current STS session
     * @returns {undefined}
     */
    async prepareARWWI(ARWWIName: string, ARWWITargetRole: string, ARWWIPassword: string) {
        const accountName = this.getSaved<string>('accountName') || this.parameters.AccountName;
        const key = `${accountName}_${ARWWIName}`;
        this.logger.debug('preparing ARWWI', {
            accountName,
            key,
        });

        if (!this.awsClients.hasIdentity(key)) {
            const webIdentityToken = await this.getWebIdentityToken(
                ARWWIName,
                ARWWIPassword || '123',
                this.parameters.KeycloakHost || 'keycloak.zenko.local',
                this.parameters.KeycloakPort || '80',
                `/auth/realms/${this.parameters.KeycloakRealm || 'zenko'}/protocol/openid-connect/token`,
                this.parameters.KeycloakClientId || Constants.K_CLIENT,
                this.parameters.KeycloakGrantType || 'password',
            );
            if (!webIdentityToken) {
                throw new Error('Error when trying to get a WebIdentity token.');
            }
            // Getting account ID
            const account = await SuperAdmin.getAccount({
                accountName,
            });
            this.logger.debug('Got account', account);

            // Getting roles with GetRolesForWebIdentity
            // Get the first role with the storage-manager-role name
            let roleArn: string | undefined = '';
            let callNumber = 1;
            let nextMarker: string | undefined;
            do {
                const GRFWIResponse = await SuperAdmin.getRolesForWebIdentity(webIdentityToken, nextMarker);

                this.logger.debug('getting roles for web identity', {
                    data: GRFWIResponse.data,
                    callNumber,
                });

                GRFWIResponse.data.Accounts.forEach(_account => {
                    roleArn = _account.Roles.find(
                        role => role.Arn.includes(ARWWITargetRole) &&
                            role.Arn.includes(account.id),
                    )?.Arn || roleArn;
                });

                if (roleArn) {
                    break;
                }

                nextMarker = GRFWIResponse.data.IsTruncated ? GRFWIResponse.data.Marker : undefined;
                callNumber++;
                await Utils.sleep(500);
            } while (callNumber < 100);

            // Ensure we can assume at least one role
            if (!roleArn) {
                this.logger.error('No role found for web identity', {
                    accountName,
                    ARWWIName,
                    ARWWITargetRole,
                    account,
                    callNumber,
                    nextMarker,
                });
                throw new Error('Error when trying to list roles for web identity.');
            }

            // Assume the role and save the credentials
            const arwwiResult = await this.awsClients.sts.send(new AssumeRoleWithWebIdentityCommand({
                RoleArn: roleArn!,
                RoleSessionName: `arwwi-${key}`,
                WebIdentityToken: webIdentityToken,
            }));
            this.logger.debug('Assumed role with web identity', arwwiResult);
            this.addToSaved('identityArn', arwwiResult.AssumedRoleUser?.Arn);

            if (!arwwiResult.Credentials) {
                throw new Error('Error when trying to assume role with web identity: no credential');
            }

            const arwwiCreds = {
                accessKeyId: arwwiResult.Credentials.AccessKeyId!,
                secretAccessKey: arwwiResult.Credentials.SecretAccessKey!,
                sessionToken: arwwiResult.Credentials.SessionToken,
            };
            this.registerIdentity(key, arwwiCreds);
            this.awsClients.useIdentity(key);
        } else {
            this.awsClients.useIdentity(key);
        }
        this.saveIdentityInformation(key, IdentityEnum.ASSUMED_ROLE, accountName);
    }

    /**
     * HTTP client to request JWT token given the username and password.
     *
     * @param {string} username - username of user requesting token
     * @param {string} password - password of user requesting token
     * @param {string} host - host URL of keycloak service
     * @param {number} port - port of keycloak service
     * @param {string} path - path of keycloak service authentication API
     * @param {string} clientId - id of the client of the user
     * @param {string} grantType - grant of the user
     * @returns {string} the OIDC token
     */
    async getWebIdentityToken(
        username: string,
        password: string,
        host: string,
        port: string,
        path: string,
        clientId: string,
        grantType: string,
    ): Promise<string> {
        const baseUrl = this.parameters.ssl === false ? 'http://' : 'https://';
        const data = new URLSearchParams({
            username,
            password,
            // eslint-disable-next-line camelcase
            client_id: clientId,
            // eslint-disable-next-line camelcase
            grant_type: grantType,
        }).toString();
        const config: AxiosRequestConfig = {
            method: 'post',
            url: `${baseUrl}${host}:${port}${path}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data,
        };
        try {
            const result: AxiosResponse = await axios(config);
            return (result.data as { access_token: string }).access_token;
        }
        catch (error) {
            throw new Error(`Error when trying to get a WebIdentity token: ${(error as Error).message}`);
        }
    }

    async createAccount(name?: string, force?: boolean, adminClientName?: string): Promise<string> {
        const accountName = name || this.getSaved<string>('accountName') ||
            `${Constants.ACCOUNT_NAME}${Utils.randomString()}`;
        if (this.awsClients.hasIdentity(accountName) && !force) {
            this.awsClients.useIdentity(accountName);
            return accountName;
        }

        if (adminClientName && Identity.hasIdentity(IdentityEnum.ADMIN, adminClientName)) {
            Identity.useIdentity(IdentityEnum.ADMIN, adminClientName);
        }

        await SuperAdmin.createAccount({ accountName });
        const credentials = await SuperAdmin.generateAccountAccessKey({ accountName });
        Zenko.storedCredentials.set(accountName, credentials);
        this.registerIdentity(accountName, credentials);
        this.awsClients.useIdentity(accountName);

        // Save the identity
        this.saveIdentityInformation(accountName, IdentityEnum.ACCOUNT, accountName);
        return accountName;
    }

    async deleteAccount(name: string) {
        if (!name) {
            throw new Error('No account name provided');
        }
        await SuperAdmin.deleteAccount({ accountName: name });
    }

    /**
     * Creates an assumed role session with a duration of 12 hours.
     * @param {boolean} crossAccount - If true, the role will be assumed cross account.
     * @returns {undefined}
     */
    async prepareAssumeRole(crossAccount = false) {
        this.resetIdentity();

        const accountName = this.parameters.AccountName;
        const roleName = `${accountName}${Constants.ROLE_NAME_TEST}${Utils.randomString()}`;
        this.addToSaved('roleName', roleName);

        const roleResult = await this.awsClients.iam.send(new CreateRoleCommand({
            RoleName: roleName,
            AssumeRolePolicyDocument: Constants.assumeRoleTrustPolicy as string,
        }));
        const roleArnToAssume = roleResult.Role!.Arn!;

        let accountToBeAssumedFrom = accountName;

        if (crossAccount) {
            const account2 = await SuperAdmin.createAccount({
                accountName: `${Constants.ACCOUNT_NAME}${Utils.randomString()}`,
            });
            const account2Credentials = await SuperAdmin.generateAccountAccessKey({
                accountName: account2.account.name,
            });
            this.registerIdentity(account2.account.name, account2Credentials);
            this.awsClients.useIdentity(account2.account.name);
            this.addToSaved('crossAccountName', account2.account.name);
            accountToBeAssumedFrom = account2.account.name;
        }

        const userName = `${accountToBeAssumedFrom}${Constants.USER_NAME_TEST}${Utils.randomString()}`;
        await this.awsClients.iam.send(new CreateUserCommand({ UserName: userName }));

        const policyName = `${accountToBeAssumedFrom}${Constants.POLICY_NAME_TEST}${Utils.randomString()}`;
        const policyResult = await this.awsClients.iam.send(new CreatePolicyCommand({
            PolicyName: policyName,
            PolicyDocument: Constants.assumeRolePolicy as string,
        }));
        const assumeRolePolicyArn = policyResult.Policy!.Arn!;

        await this.awsClients.iam.send(new AttachUserPolicyCommand({
            UserName: userName,
            PolicyArn: assumeRolePolicyArn,
        }));

        const keyResult = await this.awsClients.iam.send(new CreateAccessKeyCommand({ UserName: userName }));
        if (!keyResult.AccessKey) {
            throw new Error('Error when trying to create access key for user');
        }
        const extractedCredentials = {
            accessKeyId: keyResult.AccessKey.AccessKeyId!,
            secretAccessKey: keyResult.AccessKey.SecretAccessKey!,
        };
        this.registerIdentity(userName, extractedCredentials);
        this.awsClients.useIdentity(userName);

        const stsResult = await this.awsClients.sts.send(new AssumeRoleCommand({
            RoleArn: roleArnToAssume,
            RoleSessionName: `session-${roleName}`,
        }));
        if (!stsResult.Credentials) {
            throw new Error('Error when trying to assume role');
        }

        const assumedRoleCreds = {
            accessKeyId: stsResult.Credentials.AccessKeyId!,
            secretAccessKey: stsResult.Credentials.SecretAccessKey!,
            sessionToken: stsResult.Credentials.SessionToken,
        };
        this.registerIdentity(roleName, assumedRoleCreds);

        this.addToSaved('identityArn', roleArnToAssume);
        this.saveIdentityInformation(roleName, IdentityEnum.ASSUMED_ROLE, accountToBeAssumedFrom);
    }

    /**
     * Creates an assumed role session as service user with a duration of 12 hours.
     * @Param {string} serviceUserName - The name of the service user to be used,
     * @Param {string} roleName - the role name to assume.
     * @Param {string} internal - if true, target role is attached to an internal account
     * @returns {undefined}
     */
    async prepareServiceUser(serviceUserName: string, roleName: string, internal = false) {
        this.resetIdentity();

        let roleArnToAssume: string;
        if (internal) {
            roleArnToAssume =
                `arn:aws:iam::${Constants.INTERNAL_SERVICES_ACCOUNT_ID}:role/scality-internal/${roleName}`;
        } else {
            const roleResult = await this.awsClients.iam.send(new GetRoleCommand({ RoleName: roleName }));
            if (!roleResult.Role?.Arn) {
                throw new Error(`Failed to extract role ARN for ${roleName}`);
            }
            roleArnToAssume = roleResult.Role.Arn;
        }

        this.awsClients.useIdentity(serviceUserName);

        const stsResult = await this.awsClients.sts.send(new AssumeRoleCommand({
            RoleArn: roleArnToAssume,
            RoleSessionName: `session-${roleName}`,
        }));
        if (!stsResult.Credentials) {
            throw new Error(`Error when trying to assume role ${roleArnToAssume} as service user ${serviceUserName}`);
        }

        const serviceAssumedRoleCreds = {
            accessKeyId: stsResult.Credentials.AccessKeyId!,
            secretAccessKey: stsResult.Credentials.SecretAccessKey!,
            sessionToken: stsResult.Credentials.SessionToken,
        };
        this.registerIdentity(roleName, serviceAssumedRoleCreds);

        this.saveIdentityInformation(roleName, IdentityEnum.ASSUMED_ROLE, this.parameters.AccountName);
    }

    /**
     * Hook Zenko is a utility function to prepare a Zenko
     * @param {Object.<string,*>} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: ZenkoWorldParameters) {
        CacheHelper.logger.debug('Initializing Zenko', {
            parameters,
        });
        // Create the default account for each site configured
        // and generate access keys for it
        for (const siteKey in Zenko.sites) {
            const site = Zenko.sites[siteKey];
            Identity.useIdentity(IdentityEnum.ADMIN, site.adminIdentityName);
            const accountName = site.accountName;
            assert(accountName, `Account name is not defined for site ${siteKey}`);
            CacheHelper.logger.debug('Initializing account for Zenko site', {
                siteKey,
                accountName,
            });

            if (!Zenko.storedCredentials.has(accountName)) {
                Identity.useIdentity(IdentityEnum.ADMIN, site.adminIdentityName);
                const filePath = `/tmp/account-init-${accountName}.json`;
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, JSON.stringify({
                        ready: false,
                    }));
                }
                let account = null;
                let releaseLock: (() => Promise<void>) | null = null;
                try {
                    releaseLock = await lockFile.lock(filePath, {
                        stale: Constants.DEFAULT_TIMEOUT / 2,
                        retries: {
                            retries: 5,
                            factor: 3,
                            minTimeout: 1000,
                            maxTimeout: 5000,
                        }
                    });

                    try {
                        await SuperAdmin.createAccount({ accountName });
                        /* eslint-disable */
                    } catch (err: any) {
                        if (!err.EntityAlreadyExists && err.code !== 'EntityAlreadyExists') {
                            throw err;
                        }
                    }
                } finally {
                    if (releaseLock) {
                        await releaseLock();
                    }
                }
                /* eslint-enable */
                // Waiting until the account exists, in case of parallel mode.
                let remaining = Constants.MAX_ACCOUNT_CHECK_RETRIES;
                account = await SuperAdmin.getAccount({ accountName });
                while (!account && remaining > 0) {
                    await Utils.sleep(500);
                    account = await SuperAdmin.getAccount({ accountName });
                    remaining--;
                }
                if (!account) {
                    throw new Error(`Account ${accountName} not found in site ${siteKey}.`);
                }

                // Account was found, generate access keys if not provided
                let accountAccessKeys = Zenko.storedCredentials.get(accountName);

                if (!accountAccessKeys?.accessKeyId || !accountAccessKeys?.secretAccessKey) {
                    const accessKeys = await SuperAdmin.generateAccountAccessKey({ accountName });
                    if (!Utils.isAccessKeys(accessKeys)) {
                        throw new Error('Failed to generate account access keys for site ${siteKey}');
                    }
                    accountAccessKeys = { accessKeyId: accessKeys.accessKeyId, secretAccessKey: accessKeys.secretAccessKey };
                }

                CacheHelper.logger.debug('Adding account identity', {
                    accountName,
                    accountAccessKeys,
                });
                Zenko.storedCredentials.set(accountName, accountAccessKeys);
            }
        }

        const accountName = this.sites['source']?.accountName || CacheHelper.parameters.AccountName!;
        let accountAccessKeys = Zenko.storedCredentials.get(accountName);

        if (!accountAccessKeys?.accessKeyId || !accountAccessKeys?.secretAccessKey) {
            const accessKeys = await SuperAdmin.generateAccountAccessKey({ accountName });
            if (!Utils.isAccessKeys(accessKeys)) {
                throw new Error('Failed to generate account access keys for site ${siteKey}');
            }
            accountAccessKeys = { accessKeyId: accessKeys.accessKeyId, secretAccessKey: accessKeys.secretAccessKey };
            Zenko.storedCredentials.set(accountName, accountAccessKeys);
        }
    }

    /**
     * Creates an IAM user with policy and access keys to be used in the tests.
     * The IAM user is cached for future tests to reduce the overall test suite
     * duration.
     * @returns {undefined}
     */
    async prepareIamUser() {
        const userName = `iamusertest${Utils.randomString()}`;
        this.resetIdentity();
        this.addToSaved('userName', userName);

        const userResult = await this.awsClients.iam.send(new CreateUserCommand({ UserName: userName }));
        const keyResult = await this.awsClients.iam.send(new CreateAccessKeyCommand({ UserName: userName }));
        if (!keyResult.AccessKey) {
            throw new Error('Error when trying to create access key for user');
        }
        const iamUserCreds = {
            accessKeyId: keyResult.AccessKey.AccessKeyId!,
            secretAccessKey: keyResult.AccessKey.SecretAccessKey!,
        };
        this.registerIdentity(userName, iamUserCreds);
        this.awsClients.useIdentity(userName);

        this.addToSaved('identityArn', userResult.User?.Arn);
        this.saveIdentityInformation(userName, IdentityEnum.IAM_USER, this.parameters.AccountName);
    }

    saveIdentityInformation(name: string, identity: IdentityEnum, accountName: string) {
        const identities = this.getSavedIdentities();
        identities.push({ identityName: name, identityType: identity, accountName });
        this.addToSaved('savedIdentities', identities);
    }

    getSavedIdentities(): SavedIdentity[] {
        return this.getSaved<SavedIdentity[]>('savedIdentities') || [];
    }

    getSavedIdentity(index = -1): SavedIdentity {
        const identities = this.getSavedIdentities();
        const i = index < 0 ? identities.length + index : index;
        return identities[i];
    }

    useSavedIdentity() {
        const last = this.getSavedIdentity();
        if (!last) {
            return;
        }
        if (this.awsClients.hasIdentity(last.identityName)) {
            this.awsClients.useIdentity(last.identityName);
        }
    }

    /**
     * Map the given parameter to the AWS CLI command
     * @param {object} param - an object with a key and a value
     * @returns {undefined}
     */
    addCommandParameter(param: Record<string, unknown>): void {
        this.commandParameters[Object.keys(param)[0]] = param[Object.keys(param)[0]];
    }

    /**
     * Clean all mapped parameters
     * @returns {undefined}
     */
    resetCommand(): void {
        this.commandParameters = {};
    }

    /**
     * Remove option from set of options
     * @param {string} key - name of the key to remove
     * @returns {undefined}
     */
    deleteKeyFromCommand(key: string): void {
        if (key in this.commandParameters) {
            delete this.commandParameters[key];
        }
    }

    /**
     * Get all mapped parameters
     * @returns {Record<string, unknown>} - an object with the api command options
     */
    getCommandParameters() {
        return {
            ...this.commandParameters,
        };
    }

    /**
     * Get all saved parameters
     * @param {string} key - key to recover
     * @returns {T} - an object with any saved parameters
     */
    public getSaved<T>(key: string): T {
        return this.saved[key] as T;
    }

    /**
     * Get all saved parameters
     * @param {string} key - key to save
     * @param {*} value - value to save
     * @returns {undefined}
     */
    public addToSaved(key: string, value: unknown): void {
        this.saved[key] = value;
    }

    /**
     * Resets the saved data.
     * @returns {undefined}
     */
    public resetSaved() {
        this.saved = {};
    }

    public saveS3Result(data: unknown): void {
        this.lastS3Outcome = { ok: true, data };
    }

    public saveS3Error(err: unknown): void {
        this.lastS3Outcome = {
            ok: false,
            error: err instanceof Error ? err : new Error(String(err)),
        };
    }

    public getS3Outcome<T = unknown>(): S3Outcome<T> {
        if (this.lastS3Outcome === null) {
            throw new Error('No S3 outcome recorded — call saveS3Result or saveS3Error first');
        }
        return this.lastS3Outcome as S3Outcome<T>;
    }

    /**
     * Cleanup function for the Zenko world
     * @returns {undefined}
     */
    static async teardown() { }

    async metadataSearchResponseCode(bucketName: string): Promise<{ statusCode: number }> {
        return this.awsS3Request(
            'GET',
            `/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`,
        );
    }

    async putObjectVersionResponseCode(bucketName: string, objectKey: string): Promise<{ statusCode: number }> {
        return this.awsS3Request(
            'PUT',
            `/${bucketName}/${objectKey}`,
            { 'x-scal-s3-version-id': '' },
        );
    }

    async awsS3Request(method: Method, path: string, headers: object = {}, payload: object = {}): Promise<{ statusCode: number }> {
        const userCredentials = this.awsClients.getCredentials();
        const interceptor = aws4Interceptor({
            options: {
                region: 'us-east-1',
                service: 's3',
            },
            credentials: userCredentials,
        });

        const axiosInstance = axios.create();
        axiosInstance.interceptors.request.use(interceptor);
        const protocol = this.parameters.ssl === false ? 'http://' : 'https://';
        const axiosConfig: AxiosRequestConfig = {
            method,
            url: `${protocol}s3.${this.parameters.subdomain
                || Constants.DEFAULT_SUBDOMAIN}${path}`,
            headers,
            data: payload,
        };
        try {
            const response: AxiosResponse = await axiosInstance(axiosConfig);
            return { statusCode: response.status };
            /* eslint-disable */
        } catch (err: any) {
            const body = err.response?.data;
            const codeMatch = typeof body === 'string' ? body.match(/<Code>([^<]+)<\/Code>/) : null;
            const errorCode = codeMatch ? codeMatch[1] : `HTTP_${err.response?.status}`;
            const error = new Error(typeof body === 'string' ? body : JSON.stringify(body ?? ''));
            error.name = errorCode;
            throw error;
            /* eslint-enable */
        }
    }

    /**
     * @param {Method} method HTTP Method
     * @param {string} path Path to the API endpoint
     * @param {AxiosRequestHeaders} headers Headers to the request
     * @param {object} payload Payload to the request
     * @returns {object} object
     */
    async managementAPIRequest(
        method: Method,
        path: string,
        headers: object = {},
        payload: object | string = {},
        username?: string,
    ): Promise<{ statusCode: number; data: object } | { statusCode: number; err: unknown }> {
        const token = await this.getWebIdentityToken(
            username || this.parameters.KeycloakUsername || 'storage_manager',
            this.parameters.KeycloakPassword || '123',
            this.parameters.KeycloakHost || 'keycloak.zenko.local',
            this.parameters.KeycloakPort || '80',
            `/auth/realms/${this.parameters.KeycloakRealm || 'zenko'}/protocol/openid-connect/token`,
            this.parameters.KeycloakClientId || Constants.K_CLIENT,
            this.parameters.KeycloakGrantType || 'password',
        );
        const axiosInstance = axios.create();
        const protocol = this.parameters.ssl === false ? 'http://' : 'https://';
        // eslint-disable-next-line no-param-reassign
        headers = {
            ...headers,
            'X-Authentication-Token': token,
        };
        const axiosConfig: AxiosRequestConfig = {
            method,
            url: `${protocol}management.${this.parameters.subdomain || Constants.DEFAULT_SUBDOMAIN}/api/v1${path}`,
            headers,
            data: payload,
        };
        try {
            const response: AxiosResponse = await axiosInstance(axiosConfig);
            this.logger.debug('Management API request', {
                method,
                path,
                headers,
                payload,
                response: response.data,
                statusCode: response.status,
            });
            return { statusCode: response.status, data: response.data as object };
            /* eslint-disable */
        } catch (err: any) {
            this.logger.debug('Error when making management API request', {
                method,
                path,
                headers,
                payload,
                err: err.response.data,
                status: err.response.status,
            });
            return {
                statusCode: err.response.status,
                err: err.response.data,
            };
            /* eslint-enable */
        }
    }

    async addWebsiteEndpoint(this: Zenko, endpoint: string):
        Promise<{ statusCode: number; data: object } | { statusCode: number; err: unknown }> {
        return await this.managementAPIRequest('POST',
            `/config/${this.parameters.InstanceID}/website/endpoint`,
            {
                'Content-Type': 'application/json',
            },
            `"${endpoint}"`);
    }

    async deleteLocation(this: Zenko, locationName: string):
        Promise<{ statusCode: number; data: object } | { statusCode: number; err: unknown }> {
        return await this.managementAPIRequest('DELETE',
            `/config/${this.parameters.InstanceID}/location/${locationName}`);
    }

    saveCreatedObject(objectName: string, versionId: string) {
        const createdObjects = this.getSaved<Map<string, string[]>>('createdObjects') || new Map<string, string[]>();
        createdObjects.set(objectName, (createdObjects.get(objectName) || []).concat(versionId));
        this.addToSaved('createdObjects', createdObjects);
        this.addToSaved('lastVersionId', versionId);
    }

    getCreatedObjects() {
        return this.getSaved<Map<string, string[]>>('createdObjects');
    }

    getCreatedObject(objectName: string) {
        return this.getSaved<Map<string, string[]>>('createdObjects')?.get(objectName);
    }

    getLatestObjectVersion(objectName: string) {
        return this.getSaved<Map<string, string[]>>('createdObjects')?.get(objectName)?.slice(-1)[0];
    }
}

setWorldConstructor(Zenko);
