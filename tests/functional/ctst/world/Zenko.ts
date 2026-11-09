import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { DLQMessage, dlqKey } from 'steps/utils/kafka';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { S3Client } from '@aws-sdk/client-s3';
import {
    AttachUserPolicyCommand,
    CreateAccessKeyCommand,
    CreatePolicyCommand,
    CreateRoleCommand,
    CreateUserCommand,
    GetRoleCommand,
    IAMClient,
} from '@aws-sdk/client-iam';
import { AssumeRoleCommand, AssumeRoleWithWebIdentityCommand, Credentials, STSClient } from '@aws-sdk/client-sts';
import { aws4Interceptor } from 'aws4-axios';
import { runOnceAcrossWorkers } from 'common/WorkerCoordination';
import Werelogs from 'werelogs';

import { sleep, randomString, isAccessKeys } from '../common/utils';
import constants from '../common/constants';
import AzureClient from 'clients/azure';
import { BackbeatRoutesClient, BucketQuotaClient } from '@scality/cloudserverclient';
import { AWSCredentials, AwsClients } from 'clients/aws';
import { ApiError, ApiResult } from 'common/result';
import { VaultAccountClient, VaultAdminClient } from 'clients/vault';
import { KubernetesClient } from 'clients/k8s';
import ZenkoDrctl from 'steps/dr/drctl';
import { IdentityRef, IdentityType, getCredentials, saveCredentials } from './identities';
import assert from 'assert';

interface ServiceUsersCredentials {
    accessKey: string;
    secretKey: string;
}

// Zenko entities
export interface SavedIdentity {
    identityName: string;
    identityType: IdentityType;
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

export interface ZenkoWorldParameters {
    subdomain: string;
    ssl: boolean;
    port: string;
    AdminAccessKey: string;
    AdminSecretKey: string;
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
    JaegerQueryEndpoint: string;
    KubeconfigPath: string;
    [key: string]: unknown;
}

/**
 * Cucumber custom World implementation to support Zenko.
 * This World is responsible for AWS CLI calls.
 * Shared between all tests (S3, IAM, STS).
 */
export default class Zenko extends World<ZenkoWorldParameters> {
    private result: ApiResult = {};

    // Overrides of the S3/IAM/STS endpoint protocol and port, set by the HTTPS switch
    // of a scenario
    private endpointOverride: { https: boolean, port: string } | null = null;

    private saved: Record<string, unknown> = {};

    // Identity the requests of the scenario are signed with
    private identity: IdentityRef | null = null;

    // Account the scenario comes back to with resetIdentity
    private defaultAccountName: string | undefined;

    public zenkoDrCtl: ZenkoDrctl | null = null;

    public praInstallCount = 0;

    private static vaultAdmins: Record<string, VaultAdminClient> = {};

    private static awsClients = new Map<string, AwsClients>();

    private _azureClient: AzureClient | null = null;

    public get azureClient(): AzureClient {
        if (!this._azureClient) {
            this._azureClient = new AzureClient({
                accountName: this.parameters.AzureAccountName,
                accountKey: this.parameters.AzureAccountKey,
            });
        }
        return this._azureClient;
    }

    private _kubernetesClient: KubernetesClient | null = null;

    public get kubernetesClient(): KubernetesClient {
        if (!this._kubernetesClient) {
            this._kubernetesClient = new KubernetesClient(this.logger, this.parameters.KubeconfigPath);
        }
        return this._kubernetesClient;
    }

    static sites: {
        [key: string]: {
            accountName: string;
            adminIdentityName: string;
        };
    } = {};

    public logger: Werelogs.RequestLogger = new Werelogs.Logger('CTST').newRequestLogger();

    static readonly PRIMARY_SITE_NAME = 'admin';
    static readonly SECONDARY_SITE_NAME = 'dradmin';
    // Keyed by dlqKey(op, bucketName, objectKey). Array per key handles
    // Kafka at-least-once delivery and retries of the same object.
    static readonly dlqBuffer = new Map<string, DLQMessage[]>();

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
        // store service users credentials from world parameters
        if (this.parameters.ServiceUsersCredentials) {
            const serviceUserCredentials =
                JSON.parse(this.parameters.ServiceUsersCredentials) as Record<string, ServiceUsersCredentials>;
            for (const serviceUserName in serviceUserCredentials) {
                if (!getCredentials(IdentityType.SERVICE_USER, serviceUserName, this.parameters.AccountName)) {
                    saveCredentials(IdentityType.SERVICE_USER, serviceUserName, {
                        accessKeyId: serviceUserCredentials[serviceUserName].accessKey,
                        secretAccessKey: serviceUserCredentials[serviceUserName].secretKey,
                    }, this.parameters.AccountName);
                }
            }
        }

        if (this.parameters.AccountName) {
            if (!getCredentials(IdentityType.ACCOUNT, this.parameters.AccountName)) {
                saveCredentials(IdentityType.ACCOUNT, this.parameters.AccountName, {
                    accessKeyId: this.parameters.AccountAccessKey,
                    secretAccessKey: this.parameters.AccountSecretKey,
                });
            }
            this.useDefaultAccount(this.parameters.AccountName);
        }

        if (this.parameters.AdminAccessKey && this.parameters.AdminSecretKey &&
            !Zenko.vaultAdmins[Zenko.PRIMARY_SITE_NAME]) {
            Zenko.vaultAdmins[Zenko.PRIMARY_SITE_NAME] = this.createVaultAdmin(this.parameters.subdomain,
                this.parameters.AdminAccessKey, this.parameters.AdminSecretKey);

            Zenko.sites['source'] = {
                accountName: this.parameters.AccountName,
                adminIdentityName: Zenko.PRIMARY_SITE_NAME,
            };
        }

        if (this.needsSecondarySite()) {
            if (!Zenko.vaultAdmins[Zenko.SECONDARY_SITE_NAME]) {
                Zenko.vaultAdmins[Zenko.SECONDARY_SITE_NAME] = this.createVaultAdmin(this.parameters.DRSubdomain!,
                    this.parameters.DRAdminAccessKey!, this.parameters.DRAdminSecretKey!);
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

    private createVaultAdmin(subdomain: string, accessKeyId: string, secretAccessKey: string): VaultAdminClient {
        return new VaultAdminClient({
            host: `iam.${subdomain}`,
            port: Number(this.parameters.port),
            https: this.parameters.ssl,
            credentials: { accessKeyId, secretAccessKey },
        });
    }

    // Vault admin client of a site, the primary one by default
    static vaultAdmin(site: string = Zenko.PRIMARY_SITE_NAME): VaultAdminClient {
        const admin = Zenko.vaultAdmins[site];
        if (!admin) {
            throw new Error(`No Vault admin client for site "${site}"`);
        }
        return admin;
    }

    private needsSecondarySite() {
        return this.parameters.DRAdminAccessKey && this.parameters.DRAdminSecretKey && this.parameters.DRSubdomain;
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
        const accountName = this.getSaved<string>('accountName') || this.currentAccountName;
        const key = `${accountName}_${ARWWIName}`;
        this.logger.debug('preparing ARWWI', {
            accountName,
            key,
        });

        if (!getCredentials(IdentityType.ASSUMED_ROLE, key, accountName)) {
            const webIdentityToken = await this.getWebIdentityToken(
                ARWWIName,
                ARWWIPassword || '123',
                this.parameters.KeycloakHost || 'keycloak.zenko.local',
                this.parameters.KeycloakPort || '80',
                `/auth/realms/${this.parameters.KeycloakRealm || 'zenko'}/protocol/openid-connect/token`,
                this.parameters.KeycloakClientId || constants.K_CLIENT,
                this.parameters.KeycloakGrantType || 'password',
            );
            if (!webIdentityToken) {
                throw new Error('Error when trying to get a WebIdentity token.');
            }
            // Getting account ID
            const account = await Zenko.vaultAdmin().getAccount(accountName);
            this.logger.debug('Got account', account);

            // Getting roles with GetRolesForWebIdentity
            // Get the first role with the storage-manager-role name
            let roleArn: string | undefined = '';
            let callNumber = 1;
            let nextMarker: string | undefined;
            do {
                const GRFWIResponse = await Zenko.vaultAdmin()
                    .getRolesForWebIdentity(webIdentityToken, nextMarker);

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
                await sleep(500);
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
            const ARWWI = await this.sts.send(new AssumeRoleWithWebIdentityCommand({
                RoleArn: roleArn,
                WebIdentityToken: webIdentityToken,
                RoleSessionName: 'cli-tests',
                DurationSeconds: constants.STS_DURATION_SECONDS,
            }));
            this.logger.debug('Assumed role with web identity', ARWWI);
            this.addToSaved('identityArn', ARWWI.AssumedRoleUser?.Arn);

            const extractedCredentials = ARWWI.Credentials;

            if (!extractedCredentials) {
                throw new Error('Error when trying to assume role with web identity: no credential');
            }

            saveCredentials(IdentityType.ASSUMED_ROLE, key, {
                accessKeyId: extractedCredentials.AccessKeyId!,
                secretAccessKey: extractedCredentials.SecretAccessKey!,
                sessionToken: extractedCredentials.SessionToken,
            }, accountName);
        }
        this.useIdentity(IdentityType.ASSUMED_ROLE, key, accountName);
        this.saveIdentityInformation(key, IdentityType.ASSUMED_ROLE, accountName);
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

    async createAccount(name?: string, force?: boolean): Promise<string> {
        this.resetIdentity();
        const accountName = name || this.getSaved<string>('accountName') ||
            `${constants.ACCOUNT_NAME}${randomString()}`;
        if (getCredentials(IdentityType.ACCOUNT, accountName) && !force) {
            this.useIdentity(IdentityType.ACCOUNT, accountName);
            return accountName;
        }

        await Zenko.vaultAdmin().createAccount(accountName);
        const credentials = await Zenko.vaultAdmin().generateAccountAccessKey(accountName);
        saveCredentials(IdentityType.ACCOUNT, accountName, credentials);
        this.useDefaultAccount(accountName);

        // Save the identity
        this.saveIdentityInformation(accountName, IdentityType.ACCOUNT, accountName);
        return accountName;
    }

    async deleteAccount(name: string) {
        if (!name) {
            throw new Error('No account name provided');
        }
        await Zenko.vaultAdmin().deleteAccount(name);
    }

    /**
     * Creates an assumed role session with a duration of 12 hours.
     * @param {boolean} crossAccount - If true, the role will be assumed cross account.
     * @returns {undefined}
     */
    async prepareAssumeRole(crossAccount = false) {
        this.resetIdentity();

        // Getting default account ID
        const accountName = this.currentAccountName;

        // Creating a role to assume
        const roleName = `${accountName}${constants.ROLE_NAME_TEST}${randomString()}`;
        this.addToSaved('roleName', roleName);
        const roleArnToAssume = (await this.iam.send(new CreateRoleCommand({
            RoleName: roleName,
            AssumeRolePolicyDocument: constants.assumeRoleTrustPolicy,
        }))).Role?.Arn;
        if (!roleArnToAssume) {
            throw new Error(`Error when trying to create role ${roleName}`);
        }

        let accountToBeAssumedFrom = accountName;

        if (crossAccount) {
            // Creating a second account if its Cross-Account AssumeRole
            const account2 = await Zenko.vaultAdmin()
                .createAccount(`${constants.ACCOUNT_NAME}${randomString()}`);

            // Creating credentials for the second account
            const account2Credentials = await Zenko.vaultAdmin().generateAccountAccessKey(account2.account.name);

            saveCredentials(IdentityType.ACCOUNT, account2.account.name, account2Credentials);
            this.useIdentity(IdentityType.ACCOUNT, account2.account.name);
            this.addToSaved('crossAccountName', account2.account.name);

            accountToBeAssumedFrom = account2.account.name;
        }

        // Creating a user in the account to be assumed from
        const userName = `${accountToBeAssumedFrom}${constants.USER_NAME_TEST}${randomString()}`;
        await this.iam.send(new CreateUserCommand({ UserName: userName }));

        // Creating a policy to allow it to AssumeRole, and attaching it to the user
        const assumeRolePolicyArn = (await this.iam.send(new CreatePolicyCommand({
            PolicyName: `${accountToBeAssumedFrom}${constants.POLICY_NAME_TEST}${randomString()}`,
            PolicyDocument: constants.assumeRolePolicy,
        }))).Policy?.Arn;
        await this.iam.send(new AttachUserPolicyCommand({ UserName: userName, PolicyArn: assumeRolePolicyArn }));

        // Creating credentials for the user
        const userCredentials = (await this.iam.send(new CreateAccessKeyCommand({ UserName: userName }))).AccessKey;
        if (!userCredentials) {
            throw new Error('Error when trying to create access key for user');
        }
        const extractedCredentials: AWSCredentials = {
            accessKeyId: userCredentials.AccessKeyId!,
            secretAccessKey: userCredentials.SecretAccessKey!,
        };
        saveCredentials(IdentityType.IAM_USER, userName, extractedCredentials, this.currentAccountName);
        this.useIdentity(IdentityType.IAM_USER, userName, this.currentAccountName);

        // Assuming the role
        const res = (await this.sts.send(new AssumeRoleCommand({
            RoleArn: roleArnToAssume,
            RoleSessionName: `cli-tests${randomString()}`,
            DurationSeconds: constants.STS_DURATION_SECONDS,
        }))).Credentials;

        if (!res) {
            throw new Error('Error when trying to assume role');
        }

        this.useNewAssumedRole(roleName, res);

        // Save the identity
        this.addToSaved('identityArn', roleArnToAssume);
        this.saveIdentityInformation(roleName, IdentityType.ASSUMED_ROLE, this.currentAccountName);
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

        let roleArnToAssume: string | undefined;
        // Getting the role to assume
        if (internal) {
            roleArnToAssume =
                `arn:aws:iam::${constants.INTERNAL_SERVICES_ACCOUNT_ID}:role/scality-internal/${roleName}`;
        } else {
            roleArnToAssume = (await this.iam.send(new GetRoleCommand({ RoleName: roleName }))).Role?.Arn;
            if (!roleArnToAssume) {
                throw new Error(`Failed to extract role ARN for ${roleName}`);
            }
        }

        // Assign the credentials of the service user to the IAM session.
        this.useIdentity(IdentityType.SERVICE_USER, serviceUserName, this.defaultAccountName);

        // Assuming the role as the service user
        const res = (await this.sts.send(new AssumeRoleCommand({
            RoleArn: roleArnToAssume,
            RoleSessionName: `cli-tests${randomString()}`,
            DurationSeconds: constants.STS_DURATION_SECONDS,
        }))).Credentials;

        if (!res) {
            throw new Error(`Error when trying to assume role ${roleArnToAssume} as service user ${serviceUserName}`);
        }

        this.useNewAssumedRole(roleName, res);

        // Save the identity
        this.saveIdentityInformation(roleName, IdentityType.ASSUMED_ROLE, this.currentAccountName);
    }

    /**
     * Hook Zenko is a utility function to prepare a Zenko
     * @param {Object.<string,*>} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: ZenkoWorldParameters, logger: Werelogs.RequestLogger) {
        logger.debug('Initializing Zenko', {
            parameters,
        });
        // Create the default account for each site configured
        // and generate access keys for it
        for (const siteKey in Zenko.sites) {
            const site = Zenko.sites[siteKey];
            const admin = Zenko.vaultAdmin(site.adminIdentityName);
            const accountName = site.accountName;
            assert(accountName, `Account name is not defined for site ${siteKey}`);
            logger.debug('Initializing account for Zenko site', {
                siteKey,
                accountName,
            });

            if (!getCredentials(IdentityType.ACCOUNT, accountName)) {
                await runOnceAcrossWorkers(
                    { lockName: `account-init-${accountName}`, logger },
                    async () => {
                        await admin.createAccount(accountName);
                    },
                );
                let account = null;
                // Waiting until the account exists, in case of parallel mode.
                let remaining = constants.MAX_ACCOUNT_CHECK_RETRIES;
                account = await admin.getAccount(accountName);
                while (!account && remaining > 0) {
                    await sleep(500);
                    account = await admin.getAccount(accountName);
                    remaining--;
                }
                if (!account) {
                    throw new Error(`Account ${accountName} not found in site ${siteKey}.`);
                }

                // Account was found, generate access keys for it
                const accessKeys = await admin.generateAccountAccessKey(accountName);
                if (!isAccessKeys(accessKeys)) {
                    throw new Error(`Failed to generate account access keys for site ${siteKey}`);
                }
                logger.debug('Adding account identity', { accountName });
                saveCredentials(IdentityType.ACCOUNT, accountName, {
                    accessKeyId: accessKeys.accessKeyId,
                    secretAccessKey: accessKeys.secretAccessKey,
                });
            }
        }

        const accountName = this.sites['source']?.accountName || parameters.AccountName;
        if (!getCredentials(IdentityType.ACCOUNT, accountName)) {
            const accessKeys = await Zenko.vaultAdmin().generateAccountAccessKey(accountName);
            if (!isAccessKeys(accessKeys)) {
                throw new Error(`Failed to generate account access keys for account ${accountName}`);
            }
            saveCredentials(IdentityType.ACCOUNT, accountName, {
                accessKeyId: accessKeys.accessKeyId,
                secretAccessKey: accessKeys.secretAccessKey,
            });
        }
    }

    /**
     * Creates an IAM user with policy and access keys to be used in the tests.
     * The IAM user is cached for future tests to reduce the overall test suite
     * duration.
     * @returns {undefined}
     */
    async prepareIamUser() {
        const userName = `iamusertest${randomString()}`;
        this.resetIdentity();
        this.addToSaved('userName', userName);
        const user = (await this.iam.send(new CreateUserCommand({ UserName: userName }))).User;
        const credentials = (await this.iam.send(new CreateAccessKeyCommand({ UserName: userName }))).AccessKey;

        if (!credentials) {
            throw new Error('Error when trying to create access key for user');
        }

        const accountName = this.currentAccountName;
        saveCredentials(IdentityType.IAM_USER, userName, {
            accessKeyId: credentials.AccessKeyId!,
            secretAccessKey: credentials.SecretAccessKey!,
        }, accountName);
        this.useIdentity(IdentityType.IAM_USER, userName, accountName);

        this.addToSaved('identityArn', user?.Arn);
        this.saveIdentityInformation(userName, IdentityType.IAM_USER, accountName);
    }

    // Saves the session of a role assumed by the current identity, and uses it
    private useNewAssumedRole(roleName: string, session: Credentials) {
        const accountName = this.currentAccountName;
        saveCredentials(IdentityType.ASSUMED_ROLE, roleName, {
            accessKeyId: session.AccessKeyId!,
            secretAccessKey: session.SecretAccessKey!,
            sessionToken: session.SessionToken,
        }, accountName);
        this.useIdentity(IdentityType.ASSUMED_ROLE, roleName, accountName);
    }

    useIdentity(type: IdentityType, name: string, accountName?: string) {
        this.logger.debug('Using identity', { type, name, accountName });
        this.identity = { type, name, accountName };
    }

    // Uses the account, and makes it the one resetIdentity comes back to
    useDefaultAccount(accountName: string) {
        this.defaultAccountName = accountName;
        this.useIdentity(IdentityType.ACCOUNT, accountName);
    }

    // Comes back to the default account of the scenario, if any
    resetIdentity() {
        if (this.defaultAccountName) {
            this.useIdentity(IdentityType.ACCOUNT, this.defaultAccountName);
        }
    }

    // The current account, or the default one when the current identity is not an account
    get currentAccountName(): string {
        return this.identity?.type === IdentityType.ACCOUNT ? this.identity.name : this.defaultAccountName!;
    }

    private findCredentials(): AWSCredentials | undefined {
        return this.identity
            ? getCredentials(this.identity.type, this.identity.name, this.identity.accountName)
            : undefined;
    }

    // Credentials of the current identity
    get credentials(): AWSCredentials {
        const credentials = this.findCredentials();
        if (!credentials) {
            throw new Error(`Missing credentials for the current identity ${JSON.stringify(this.identity)}`);
        }
        return credentials;
    }

    saveIdentityInformation(name: string, identity: IdentityType, accountName: string) {
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
        this.useIdentity(last.identityType, last.identityName, last.accountName);
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

    /**
     * Outcome of the last API call made by a step, to be checked by the next steps
     * @returns {ApiResult} - the saved outcome
     */
    public getResult<T = unknown>(): ApiResult<T> {
        return this.result as ApiResult<T>;
    }

    /**
     * Saves the outcome of an API call for the next steps
     * @param {ApiResult} result - the outcome to save
     * @returns {undefined}
     */
    public setResult(result: ApiResult): void {
        this.result = result;
    }

    /**
     * Sends the S3, IAM and STS requests over HTTPS on port 443, or HTTP on port 80
     * @param {boolean} https - whether to use HTTPS
     * @returns {undefined}
     */
    public useHttps(https: boolean): void {
        this.endpointOverride = { https, port: https ? '443' : '80' };
    }

    /**
     * Goes back to the protocol and port of the world parameters
     * @returns {undefined}
     */
    public resetEndpoint(): void {
        this.endpointOverride = null;
    }

    public get https(): boolean {
        return this.endpointOverride?.https ?? this.parameters.ssl !== false;
    }

    private get port(): string {
        return this.endpointOverride?.port ?? String(this.parameters.port);
    }

    /**
     * Cleanup function for the Zenko world
     * @returns {undefined}
     */
    static async teardown() { }

    async metadataSearchResponseCode(userCredentials: AWSCredentials, bucketName: string) {
        return await this.awsS3Request(
            'GET',
            `/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`,
            userCredentials,
        );
    }

    async putObjectVersionResponseCode(userCredentials: AWSCredentials, bucketName: string, objectKey: string) {
        return await this.awsS3Request(
            'PUT',
            `/${bucketName}/${objectKey}`,
            userCredentials,
            { 'x-scal-s3-version-id': '' },
        );
    }

    async awsS3Request(method: Method, path: string,
        userCredentials: AWSCredentials, headers: object = {}, payload: object = {}): Promise<ApiResult> {
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
                || constants.DEFAULT_SUBDOMAIN}${path}`,
            headers,
            data: payload,
        };
        try {
            const response: AxiosResponse = await axiosInstance(axiosConfig);
            return { data: response.data as unknown };
        } catch (err) {
            if (!axios.isAxiosError(err) || !err.response) {
                throw err;
            }
            // S3 error bodies are XML: <Error><Code>AccessDenied</Code><Message>...</Message></Error>
            const body = String(err.response.data);
            const error: ApiError = new Error(body.match(/<Message>(.*?)<\/Message>/)?.[1] ?? body);
            error.name = body.match(/<Code>(.*?)<\/Code>/)?.[1] ?? `HTTP ${err.response.status}`;
            error.$metadata = { httpStatusCode: err.response.status };
            return { error };
        }
    }

    // Clients of the current identity, on the endpoint of the scenario's HTTPS switch
    private currentAwsClients(allowMissingCredentials = false): AwsClients {
        const credentials = allowMissingCredentials ? this.findCredentials() : this.credentials;
        const endpoint = {
            subdomain: this.parameters.subdomain,
            https: this.https,
            port: this.port,
        };
        const key = JSON.stringify([credentials?.accessKeyId, credentials?.sessionToken, endpoint]);
        let clients = Zenko.awsClients.get(key);
        if (!clients) {
            clients = new AwsClients(credentials, endpoint);
            Zenko.awsClients.set(key, clients);
        }
        return clients;
    }

    get s3(): S3Client {
        return this.currentAwsClients().s3;
    }

    get iam(): IAMClient {
        return this.currentAwsClients().iam;
    }

    // AssumeRoleWithWebIdentity is unsigned, so STS may be used without credentials
    get sts(): STSClient {
        return this.currentAwsClients(true).sts;
    }

    get backbeatRoutes(): BackbeatRoutesClient {
        return this.currentAwsClients().backbeatRoutes;
    }

    get bucketQuota(): BucketQuotaClient {
        return this.currentAwsClients().bucketQuota;
    }

    // Vault calls of the current identity on its own account
    get vaultAccount(): VaultAccountClient {
        const { accessKeyId, secretAccessKey, sessionToken } = this.credentials;
        return new VaultAccountClient({
            host: `iam.${this.parameters.subdomain}`,
            port: Number(this.port),
            https: this.https,
            credentials: { accessKeyId, secretAccessKey, sessionToken },
        });
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
            this.parameters.KeycloakClientId || constants.K_CLIENT,
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
            url: `${protocol}management.${this.parameters.subdomain || constants.DEFAULT_SUBDOMAIN}/api/v1${path}`,
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
