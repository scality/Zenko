import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { aws4Interceptor } from 'aws4-axios';
import {
    CacheHelper,
    ClientOptions,
    cliModeObject,
    Constants,
    IAM,
    STS,
    SuperAdmin,
    Utils,
} from 'cli-testing';
import { Credentials } from 'aws4-axios';
import { extractPropertyFromResults } from '../common/utils';
import qs = require('qs');
import Werelogs from 'werelogs';

export interface AWSVersionObject {
    Key: string;
    VersionId: string;
}

export interface NotificationDestination {
    destinationName: string;
    topic: string;
    hosts: string;
}

export interface UserCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken?: string;
}

interface ServiceUsersCredentials {
    accessKey: string;
    secretKey: string;
}

// Zenko entities
export enum EntityType {
    ACCOUNT = 'ACCOUNT',
    IAM_USER = 'IAM_USER',
    STORAGE_MANAGER = 'STORAGE_MANAGER',
    STORAGE_ACCOUNT_OWNER = 'STORAGE_ACCOUNT_OWNER',
    DATA_CONSUMER = 'DATA_CONSUMER',
    ASSUME_ROLE_USER = 'ASSUME_ROLE_USER',
    ASSUME_ROLE_USER_CROSS_ACCOUNT = 'ASSUME_ROLE_USER_CROSS_ACCOUNT',
}

export interface ZenkoWorldParameters {
    logger?: Werelogs.Logger;
    subdomain: string;
    ssl: boolean;
    port: string;
    AccountName: string;
    AdminAccessKey: string;
    AdminSecretKey: string;
    AccountAccessKey: string;
    AccountSecretKey: string;
    AccessKey: string;
    SecretKey: string;
    VaultAuthHost: string;
    NotificationDestination: string;
    NotificationDestinationTopic: string;
    NotificationDestinationAlt: string;
    NotificationDestinationTopicAlt: string;
    KafkaHosts: string;
    KeycloakPassword: string;
    KeycloakHost: string;
    KeycloakPort: string;
    keycloakRealm: string;
    keycloakClientId: string;
    keycloakGrantType: string;
    StorageManagerUsername: string;
    StorageAccountOwnerUsername: string;
    DataConsumerUsername: string;
    ServiceUsersCredentials: string;
    KeycloakTestPassword: string;
    AssumedSession: ClientOptions['AssumedSession'];
    IAMSession: {
        AccessKeyId: string;
        SecretAccessKey: string;
        SessionToken?: string;
    };
    azureAccountName: string;
    azureAccountKey: string;
    azureArchiveContainer: string;
    AzureArchiveAccessTier: string;
    azureArchiveManifestTier: string;
    azureArchiveQueue: string;
    kafkaObjectTaskTopic: string;
    kafkaDeadLetterQueueTopic: string;
    InstanceID: string;
    KafkaCleanerInterval: string;
    SorbetdRestoreTimeout: string;
    [key: string]: unknown;
}

export interface ApiResult {
    statusCode?: number,
    stdout?: string | null,
    err?: string | null,
    code?: string | null,
    description?: string | null,
}

/**
 * Cucumber custom World implementation to support Zenko.
 * This World is reponsible for AWS CLI calls.
 * Shared between all tests (S3, IAM, STS).
 */
export default class Zenko extends World<ZenkoWorldParameters> {
    private readonly command: string = '';

    private result: ApiResult = {};

    private parsedResult: ApiResult[] = [];

    private serviceType = '';

    parameters: ZenkoWorldParameters = {} as ZenkoWorldParameters;

    private cliOptions: Record<string, unknown> = {};

    private options: Record<string, string> = {};

    private saved: Record<string, unknown> = {};

    private static IAMUserName = '';

    private static IAMUserPolicyName = '';

    private static IAMUserAttachedPolicy = '';

    private static additionalAccountsCredentials: { [id: string]: { AccessKey: string, SecretKey: string } } = {};

    private static serviceUsersCredentials: { [name: string]: { AccessKeyId: string; SecretAccessKey: string } } = {};

    private forceFailed = false;

    private cliMode: cliModeObject = CacheHelper.createCliModeObject();

    /**
     * @constructor
     * @param {Object} options - parameters provided as a CLI parameter when running the tests
     */
    constructor(options: IWorldOptions<ZenkoWorldParameters>) {
        super(options);
        this.parameters = options.parameters;
        // store service users credentials from world parameters
        if (this.parameters.ServiceUsersCredentials) {
            const serviceUserCredentials =
                JSON.parse(this.parameters.ServiceUsersCredentials) as Record<string, ServiceUsersCredentials>;
            for (const serviceUserName in serviceUserCredentials) {
                Zenko.serviceUsersCredentials[serviceUserName] = {
                    AccessKeyId: serviceUserCredentials[serviceUserName].accessKey,
                    SecretAccessKey: serviceUserCredentials[serviceUserName].secretKey,
                };
            }
        }

        // Workaround to be able to access global parameters in BeforeAll/AfterAll hooks
        CacheHelper.parameters = this.parameters;
        this.cliMode.parameters = this.parameters as ClientOptions;

        CacheHelper.AccountName = this.parameters.AccountName;
        CacheHelper.isPreloadedAccount = true;
    }

    /**
     * This function will dynamically determine if the result from the AWS CLI command
     * is a success or a failure. Based on the fact that AWS CLI either return an empty string
     * or a JSON-parsable string.
     * @param {Array} result - array with result objects containing both stderr and stdout from the CLI command.
     * @returns {boolean} - if the result is a success or a failure
     */
    checkResults(result: ApiResult[]): boolean {
        const usedResult: ApiResult[] = Array.isArray(result) ? result : [result];
        let decision = true;
        usedResult.forEach(res => {
            if (!res || res.err || this.forceFailed === true) {
                decision = false;
            }
            try {
                // Accept empty responses (in case of success)
                if (res.stdout && res.stdout !== '') {
                    const parsed = JSON.parse(res.stdout) as ApiResult;
                    this.parsedResult.push(parsed);
                } else if (res.stdout !== '') {
                    decision = false;
                }
            } catch (err) {
                decision = res.stdout === '';
            }
        });
        return decision;
    }

    /**
     * This function will dynamically prepare credentials based on the type of
     * entity provided to let the test run the AWS CLI command using this particular
     * type of entity.
     * @param {ScenarioCallerType} entityType - type of entity, can be 'account', 'storage manager',
     * 'storage account owner', 'data consumer' or 'iam user'
     * @returns {undefined}
     */
    async setupEntity(entityType: string): Promise<void> {
        const defaultParameters = this.parameters;
        const keycloakPassword = defaultParameters.KeycloakTestPassword || '123';
        const savedParameters = JSON.parse(JSON.stringify(this.cliOptions)) as object;
        this.resetGlobalType();
        this.addToSaved('identityType', entityType);
        switch (entityType) {
        case EntityType.ACCOUNT:
            await this.createAccount();
            this.addToSaved('type', EntityType.ACCOUNT);
            break;
        case EntityType.IAM_USER:
            await this.prepareIamUser();
            this.addToSaved('type', EntityType.IAM_USER);
            break;
        case EntityType.STORAGE_MANAGER:
            this.addToSaved('identityName', 'StorageManager');
            await this.prepareARWWI(
                defaultParameters.StorageManagerUsername || 'storage_manager',
                keycloakPassword,
                'storage-manager-role',
            );
            this.addToSaved('type', EntityType.STORAGE_MANAGER);
            break;
        case EntityType.STORAGE_ACCOUNT_OWNER:
            this.addToSaved('identityName', 'StorageAccountOwner');
            await this.prepareARWWI(
                defaultParameters.StorageAccountOwnerUsername || 'storage_account_owner',
                keycloakPassword,
                'storage-account-owner-role',
            );
            this.addToSaved('type', EntityType.STORAGE_ACCOUNT_OWNER);
            break;
        case EntityType.DATA_CONSUMER:
            this.addToSaved('identityName', 'DataConsumer');
            await this.prepareARWWI(
                defaultParameters.DataConsumerUsername || 'data_consumer',
                keycloakPassword,
                'data-consumer-role',
            );
            this.addToSaved('type', EntityType.DATA_CONSUMER);
            break;
        case EntityType.ASSUME_ROLE_USER:
            await this.prepareAssumeRole(false);
            this.addToSaved('type', EntityType.ASSUME_ROLE_USER);
            break;
        case EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT:
            await this.prepareAssumeRole(true);
            this.addToSaved('type', EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT);
            break;
        default:
            break;
        }
        this.saveAuthMode('test_identity');
        this.resetCommand();
        this.cliOptions = savedParameters as Record<string, unknown>;
    }

    /**
     * As the type of the current request is set as a static variable, this helper
     * function resets the current configuration to use the account by default
     * @returns {undefined}
     */
    resetGlobalType(): void {
        this.cliMode.env = false;
        this.cliMode.assumed = false;
    }

    /**
     * Creates an assumed role session using a web identity from the IDP with a
     * duration of 12 hours.
     * @param {string} ARWWIName - IDP username of the current STS session
     * @param {string} ARWWIPassword - IDP password of the current STS session
     * @param {string} ARWWITargetRole - role to assume. The first role returned
     * by GetRolesForWebIdentity matching this name will be dynamically chosen
     * @returns {undefined}
     */
    async prepareARWWI(ARWWIName: string, ARWWIPassword: string, ARWWITargetRole: string) {
        const accountName = this.getSaved<string>('accountName') ||
            this.parameters.AccountName || Constants.ACCOUNT_NAME;
        const key = `${accountName}_${ARWWIName}`;
        if (!(key in CacheHelper.ARWWI)) {
            const token = await this.getWebIdentityToken(
                ARWWIName,
                ARWWIPassword,
                this.parameters.KeycloakHost || 'keycloak.zenko.local',
                this.parameters.KeycloakPort || '80',
                `/auth/realms/${this.parameters.keycloakRealm || 'zenko'}/protocol/openid-connect/token`,
                this.parameters.keycloakClientId || Constants.K_CLIENT,
                this.parameters.keycloakGrantType || 'password',
            );
            this.options.webIdentityToken = token;
            if (!this.options.webIdentityToken) {
                throw new Error('Error when trying to get a WebIdentity token.');
            }
            // Getting account ID
            const account = await SuperAdmin.getAccount({
                accountName,
            });
            // Getting roles with GetRolesForWebIdentity
            // Get the first role with the storage-manager-role name
            const data =
                (await SuperAdmin.getRolesForWebIdentity(this.options.webIdentityToken)).data;
            let roleToAssume: string | undefined = '';

            if (data.ListOfRoleArns) {
                roleToAssume = data.ListOfRoleArns.find(
                    (roleArn: string) => roleArn.includes(ARWWITargetRole) && roleArn.includes(account.id!),
                );
            } else {
                data.Accounts.forEach((_account: Utils.GRFWIAccount) => {
                    roleToAssume = _account.Roles?.find(
                        (role: Utils.Role) =>
                            role.Arn.includes(ARWWITargetRole) && role.Arn.includes(account.id!),
                    )?.Arn || roleToAssume;
                });
            }
            // Ensure we can assume at least one role
            if (!roleToAssume) {
                throw new Error('Error when trying to list roles for web identity.');
            }
            // Arn to assume
            const arn = roleToAssume;
            this.options.roleArn = arn;
            // Assume the role and save the credentials
            const ARWWI = await STS.assumeRoleWithWebIdentity(this.options, this.parameters);
            this.parameters.logger?.debug('Assumed role with web identity', ARWWI);
            this.addToSaved('identityArn', extractPropertyFromResults(ARWWI, 'AssumedRoleUser', 'Arn'));
            if (ARWWI && typeof ARWWI !== 'string' && ARWWI.stdout) {
                const parsedOutput = JSON.parse(ARWWI.stdout) as { Credentials: ClientOptions['AssumedSession'] };
                if (parsedOutput && parsedOutput.Credentials) {
                    this.parameters.AssumedSession = parsedOutput.Credentials;
                }
            } else {
                throw new Error('Error when trying to Assume Role With Web Identity.');
            }
            // Save the session for future scenarios (increases performance)
            CacheHelper.ARWWI[key] = this.parameters.AssumedSession;
            this.cliMode.parameters.AssumedSession =
                CacheHelper.ARWWI[key];
            CacheHelper.parameters!.AssumedSession = CacheHelper.ARWWI[key];
            this.cliMode.assumed = true;
            this.cliMode.env = false;
        } else {
            this.parameters.AssumedSession =
                CacheHelper.ARWWI[key];
            this.cliMode.parameters.AssumedSession =
                CacheHelper.ARWWI[key];
            CacheHelper.parameters!.AssumedSession = CacheHelper.ARWWI[key];
            this.cliMode.assumed = true;
            this.cliMode.env = false;
        }
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
        this.parameters;
        const baseUrl = this.parameters.ssl === false ? 'http://' : 'https://';
        const data = qs.stringify({
            username,
            password,
            // eslint-disable-next-line camelcase
            client_id: clientId,
            // eslint-disable-next-line camelcase
            grant_type: grantType,
        });
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

    async createAccount(name?: string, force?: boolean) {
        this.resetGlobalType();
        if (!force && this.getSaved<string>('accountName')) {
            Zenko.restoreAccountAccessKeys();
        } else {
            const accountName = name || `${Constants.ACCOUNT_NAME}${Utils.randomString()}`;
            this.addToSaved('accountName', accountName);
            await SuperAdmin.createAccount({ accountName });
            const credentials = await SuperAdmin.generateAccountAccessKey({ accountName });
            Zenko.saveAccountAccessKeys(credentials.id!, credentials.value!);
            CacheHelper.AccountName = accountName;
        }
    }

    /**
     * Creates an assumed role session with a duration of 12 hours.
     * @param {boolean} crossAccount - If true, the role will be assumed cross account.
     * @returns {undefined}
     */
    async prepareAssumeRole(crossAccount = false) {
        this.resetGlobalType();

        // Getting default account ID
        const account = await SuperAdmin.getAccount({
            accountName: this.parameters.AccountName || Constants.ACCOUNT_NAME,
        });
        Zenko.additionalAccountsCredentials[account.name!] = {
            AccessKey: CacheHelper.parameters!.AccessKey as string,
            SecretKey: CacheHelper.parameters!.SecretKey as string,
        };

        // Creating a role to assume
        this.addToSaved('roleName', `${(account).name!}` +
            `${Constants.ROLE_NAME_TEST}${`${Utils.randomString()}`.toLocaleLowerCase()}`);
        this.addCommandParameter({ roleName: this.getSaved<string>('roleName') });
        this.addCommandParameter({ assumeRolePolicyDocument: Constants.assumeRoleTrustPolicy });
        const roleArnToAssume =
            extractPropertyFromResults(await IAM.createRole(
                this.getCommandParameters()), 'Role', 'Arn');

        let accountToBeAssumedFrom = account;

        if (crossAccount) {
            // Creating a second account if its Cross-Account AssumeRole
            const account2 = await SuperAdmin.createAccount({
                accountName: `${Constants.ACCOUNT_NAME}${Utils.randomString()}`,
            });

            // Creating credentials for the second account
            const account2Credentials = await SuperAdmin.generateAccountAccessKey({
                accountName: account2.account.name,
            });

            // Set the credentials of the second account as the default credentials
            CacheHelper.parameters ??= {};
            CacheHelper.parameters.AccessKey = account2Credentials.id;
            CacheHelper.parameters.SecretKey = account2Credentials.value;

            accountToBeAssumedFrom = account2.account;
        }

        // Creating a user in the account to be assumed from
        this.resetCommand();
        const userName = `${accountToBeAssumedFrom.name!}${Constants.USER_NAME_TEST}${Utils.randomString()}`;
        this.addCommandParameter({ userName });
        await IAM.createUser(this.getCommandParameters());

        // Creating a policy to allow it to AssumeRole
        this.resetCommand();
        this.addCommandParameter({
            policyName: `${(accountToBeAssumedFrom).name!}` +
                `${Constants.POLICY_NAME_TEST}` +
                `${Utils.randomString()}`,
        });
        this.addCommandParameter({ policyDocument: Constants.assumeRolePolicy });
        const assumeRolePolicyArn =
            extractPropertyFromResults(await IAM.createPolicy(
                this.getCommandParameters()), 'Policy', 'Arn');

        // Attaching the policy to the user
        this.resetCommand();
        this.addCommandParameter({ userName });
        this.addCommandParameter({ policyArn: assumeRolePolicyArn });
        await IAM.attachUserPolicy(this.getCommandParameters());

        // Creating credentials for the user
        this.resetCommand();
        this.addCommandParameter({ userName });
        this.parameters.IAMSession =
            extractPropertyFromResults(await IAM.createAccessKey(
                this.getCommandParameters()), 'AccessKey')!;
        this.resumeIamUser();

        // Assuming the role
        this.resetCommand();
        this.addCommandParameter({ roleArn: roleArnToAssume });
        const res = extractPropertyFromResults<ClientOptions['AssumedSession']>(await STS.assumeRole(
            this.getCommandParameters()), 'Credentials');
        if (res) {
            this.parameters.AssumedSession = res;
        }
        this.cliMode.assumed = true;
        this.cliMode.env = false;

        // Save the identity
        this.addToSaved('identityArn', roleArnToAssume);
        this.addToSaved('identityName', this.getSaved<string>('roleName'));

        CacheHelper.parameters ??= {};
        // reset the credentials of default account as the defualt credentials
        CacheHelper.parameters.AccessKey =
            Zenko.additionalAccountsCredentials[account.name!].AccessKey;
        CacheHelper.parameters.SecretKey =
            Zenko.additionalAccountsCredentials[account.name!].SecretKey;
    }

    /**
     * Creates an assumed role session as service user with a duration of 12 hours.
     * @Param {string} serviceUserName - The name of the service user to be used,
     * @Param {string} roleName - the role name to assume.
     * @Param {string} internal - if true, target role is attached to an internal account
     * @returns {undefined}
     */
    async prepareServiceUser(serviceUserName: string, roleName: string, internal = false) {
        this.resetGlobalType();

        let roleArnToAssume: string | null = null;
        // Getting the role to assume
        this.addCommandParameter({ roleName });
        if (internal) {
            roleArnToAssume =
                `arn:aws:iam::${Constants.INTERNAL_SERVICES_ACCOUNT_ID}:role/scality-internal/${roleName}`;
        } else {
            const role = await IAM.getRole(this.getCommandParameters());
            if (role.err) {
                throw new Error(`Error occured when getting ${roleName} for user account`);
            }

            roleArnToAssume = extractPropertyFromResults(role, 'Role', 'Arn');
            if (!roleArnToAssume) {
                throw new Error(`Failed to extract role ARN for ${roleName}`);
            }
        }

        // assign the credentials of the service user to the IAM session
        this.parameters.IAMSession =
            Zenko.serviceUsersCredentials[serviceUserName];
        this.resumeIamUser();

        // Assuming the role as the service user
        this.resetCommand();
        this.addCommandParameter({ roleArn: roleArnToAssume });
        const assumeRoleRes = await STS.assumeRole(this.getCommandParameters());
        if (assumeRoleRes.err) {
            throw new Error(`Error when trying to assume role ${roleArnToAssume} as service user ${serviceUserName}.
            ${assumeRoleRes.err}`);
        }

        //assign the assumed session credentials to the Assumed session.
        const res = extractPropertyFromResults<ClientOptions['AssumedSession']>(assumeRoleRes, 'Credentials');
        // necessary to avoid linter error
        if (res) {
            this.parameters.AssumedSession = res;
        } else {
            throw new Error(`Error when trying to assume role ${roleArnToAssume} as service user ${serviceUserName}.
            No credentials returned.`);
        }
        this.resumeAssumedRole();
    }

    /**
     * Hook Zenko is a utility function to prepare a Zenko
     * @param {Object.<string,*>} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: ZenkoWorldParameters) {
        CacheHelper.parameters ??= {};
        if (!CacheHelper.accountAccessKeys) {
            CacheHelper.adminClient = await Utils.getAdminCredentials(parameters);

            let account = null;
            // Create the account if already exist will not throw any error
            try {
                await SuperAdmin.createAccount({
                    accountName: parameters.AccountName || Constants.ACCOUNT_NAME,
                });
                /* eslint-disable */
            } catch (err: any) {
                if (!err.EntityAlreadyExists && err.code !== 'EntityAlreadyExists') {
                    throw err;
                }
            }
            /* eslint-enable */
            // Waiting until the account exists, in case of parallel mode.
            let remaining = Constants.MAX_ACCOUNT_CHECK_RETRIES;
            while (!account && remaining > 0) {
                await Utils.sleep(1000);
                account = (await SuperAdmin.getAccount({
                    accountName: parameters.AccountName || Constants.ACCOUNT_NAME,
                }));
                remaining--;
            }
            if (!account) {
                throw new Error(`Account ${parameters.AccountName
                    || Constants.ACCOUNT_NAME} not found \
        after ${Constants.MAX_ACCOUNT_CHECK_RETRIES} retries.`);
            }
            if (parameters.AccountName && parameters.AccountAccessKey
                && parameters.AccountSecretKey) {
                CacheHelper.parameters.AccessKey = parameters.AccountAccessKey;
                CacheHelper.parameters.SecretKey = parameters.AccountSecretKey;
                CacheHelper.isPreloadedAccount = true;
            } else {
                const accessKeys = await SuperAdmin.generateAccountAccessKey({
                    accountName: parameters.AccountName || Constants.ACCOUNT_NAME,
                });
                if (Utils.isAccessKeys(accessKeys)) {
                    this.saveAccountAccessKeys(accessKeys.id!, accessKeys.value!);
                } else {
                    throw new Error('Failed to generate account access keys');
                }
            }
            CacheHelper.AccountName = CacheHelper.parameters.AccountName as string
                || Constants.ACCOUNT_NAME;
        } else {
            CacheHelper.parameters.AccessKey =
                CacheHelper.accountAccessKeys?.id;
            CacheHelper.parameters.SecretKey =
                CacheHelper.accountAccessKeys?.value;
        }
    }

    static saveAccountAccessKeys(accessKey: string, secretKey: string) {
        CacheHelper.accountAccessKeys = {
            id: accessKey,
            value: secretKey,
        };
        if (!CacheHelper.parameters) {
            CacheHelper.parameters = {};
        }
        CacheHelper.parameters.AccessKey =
            CacheHelper.accountAccessKeys?.id;
        CacheHelper.parameters.SecretKey =
            CacheHelper.accountAccessKeys?.value;
    }

    static restoreAccountAccessKeys() {
        if (CacheHelper.accountAccessKeys) {
            CacheHelper.parameters!.AccessKey =
                CacheHelper.accountAccessKeys.id;
            CacheHelper.parameters!.SecretKey =
                CacheHelper.accountAccessKeys.value;
        }
    }

    /**
     * Creates an IAM user with policy and access keys to be used in the tests.
     * The IAM user is cached for future tests to reduce the overall test suite
     * duration.
     * @returns {undefined}
     */
    async prepareIamUser() {
        this.addToSaved('userName', `iamusertest${Utils.randomString()}`);
        // Create IAM user
        this.addCommandParameter({ userName: this.getSaved<string>('userName') });
        const userInfos = await IAM.createUser(this.getCommandParameters());
        this.addToSaved('identityArn', extractPropertyFromResults(userInfos, 'User', 'Arn'));
        this.addToSaved('identityName', extractPropertyFromResults(userInfos, 'User', 'UserName'));
        this.resetCommand();
        // Create credentials for the user
        this.addCommandParameter({ userName: this.getSaved<string>('userName') });
        const accessKey = await IAM.createAccessKey(this.getCommandParameters());
        this.parameters.IAMSession =
            (JSON.parse(accessKey.stdout) as { AccessKey: UserCredentials }).AccessKey;
        this.cliMode.parameters.IAMSession =
            this.parameters.IAMSession;
        CacheHelper.parameters!.IAMSession =
            this.parameters.IAMSession;
        this.cliMode.env = true;
        this.resetCommand();
    }

    resumeIamUser() {
        this.cliMode.env = true;
    }

    resumeAssumedRole() {
        this.cliMode.env = false;
        this.cliMode.assumed = true;
    }

    /**
     * Erases all the environment configuration from setupEntity
     * @returns {undefined}
     */
    cleanupEntity(): void {
        this.cliMode.assumed = false;
        this.cliMode.env = false;
    }

    saveAuthMode(authMode: string): void {
        // save current cliMode.assumed and cliMode.env in saved for later use
        this.addToSaved(authMode, {
            cacheSession: {
                ...CacheHelper.parameters!.IAMSession,
            },
            cliModeParameters: {
                ...this.cliMode.parameters.IAMSession,
            },
            env: this.cliMode.env,
            assumed: this.cliMode.assumed,
        } as ClientOptions);
    }

    setAuthMode(authMode: string): void {
        // restore cliMode.assumed and cliMode.env from saved
        const savedConfiguration = this.getSaved<{
            cacheSession: {
                AccessKeyId: string;
                SecretAccessKey: string;
                SessionToken?: string | undefined;
            } | undefined,
            cliModeParameters: ClientOptions['AssumedSession'],
            env: boolean,
            assumed: boolean,
        }>(authMode);
        CacheHelper.parameters!.IAMSession = savedConfiguration.cacheSession;
        this.cliMode.parameters.IAMSession = savedConfiguration.cliModeParameters;
        this.cliMode.env = savedConfiguration.env;
        this.cliMode.assumed = savedConfiguration.assumed;
        this.resetCommand();
    }

    restoreEnvironment() {
        if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.getSaved<EntityType>('type'))) {
            this.resumeIamUser();
        } else {
            this.resumeAssumedRole();
        }
    }

    /**
     * Helper function to change the default aws cli command type (iam|sts|s3).
     * @param {string} service - type of the AWS CLI command (sts, iam, s3)
     * @returns {undefined}
     */
    setCommandServiceType(service: string): void {
        this.serviceType = service;
    }

    /**
     * Map the given parameter to the AWS CLI command
     * @param {object} param - an object with a key and a value
     * @returns {undefined}
     */
    addCommandParameter(param: Record<string, unknown>): void {
        this.cliOptions[Object.keys(param)[0]] = param[Object.keys(param)[0]];
    }

    /**
     * Clean all mapped parameters
     * @returns {undefined}
     */
    resetCommand(): void {
        this.cliOptions = {};
    }

    /**
     * Remove option from set of options
     * @param {string} key - name of the key to remove
     * @returns {undefined}
     */
    deleteKeyFromCommand(key: string): void {
        if (key in this.cliOptions) {
            delete this.cliOptions[key];
        }
    }

    /**
     * Get all mapped parameters
     * @returns {Record<string, unknown>} - an object with the cli command options
     */
    getCommandParameters() {
        return {
            ___mode: this.cliMode,
            ...this.cliOptions,
        };
    }

    /**
     * Get the current cli mode
     * @returns {string} - the current service type
     */
    getCliMode() {
        return this.cliMode;
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
     * Get all saved result object
     * @returns {ApiResult} - an object with saved API call results
     */
    public getResult(): ApiResult {
        return this.result;
    }

    /**
     * Get all saved result object
     * @param {ApiResult} result - an object with API call results
     * @returns {undefined}
     */
    public setResult(result: ApiResult): void {
        this.result = result;
    }

    /**
     * Cleanup function for the Zenko world
     * @returns {undefined}
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    static async teardown() { }

    async metadataSearchResponseCode(userCredentials: UserCredentials, bucketName: string) {
        return await this.awsS3Request(
            'GET',
            `/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`,
            userCredentials,
        );
    }

    async putObjectVersionResponseCode(userCredentials: UserCredentials, bucketName: string, objectKey: string) {
        return await this.awsS3Request(
            'PUT',
            `/${bucketName}/${objectKey}`,
            userCredentials,
            { 'x-scal-s3-version-id': '' },
        );
    }

    async awsS3Request(method: Method, path: string,
        userCredentials: UserCredentials, headers: object = {}, payload: object = {}) {
        const credentials: Credentials = {
            accessKeyId: userCredentials.AccessKeyId,
            secretAccessKey: userCredentials.SecretAccessKey,
        };
        if (userCredentials.SessionToken) {
            credentials['sessionToken'] = userCredentials.SessionToken;
        }
        const interceptor = aws4Interceptor({
            options: {
                region: 'us-east-1',
                service: 's3',
            },
            credentials,
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
            return { statusCode: response.status, data: response.data as unknown };
            /* eslint-disable */
        } catch (err: any) {
            return {
                statusCode: err.response.status,
                err: err.response.data,
            };
            /* eslint-enable */
        }
    }
}

setWorldConstructor(Zenko);
