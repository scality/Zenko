import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import axios, { AxiosRequestConfig, AxiosResponse, Method, AxiosRequestHeaders } from 'axios';
import { aws4Interceptor } from 'aws4-axios';
import {
    CacheHelper,
    ClientOptions,
    cliModeObject,
    Constants,
    IAM,
    IAMUserPolicy,
    STS,
    SuperAdmin,
    Utils,
    AWSCliOptions,
} from 'cli-testing';
import { Credentials } from 'aws4-axios';
import { extractPropertyFromResults } from '../common/utils';
import qs = require('qs');

export interface AWSVersionObject {
    Key: string;
    VersionId: string;
}

export interface NotificationDestination {
    destinationName: string;
    topic: string;
    hosts: string;
}

interface GetRolesForWIResponse {
    roles: {
        ListOfRoleArns: string[];
        Accounts: Utils.AccountObject[];
    }
}

export interface UserCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
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
}

interface ZenkoWorldParameters {
    subdomain: string;
    ssl: boolean;
    port: string;
    AccountName: string;
    AdminAccessKey: string;
    AdminSecretKey: string;
    AccountAccessKey: string;
    AccountSecretKey: string;
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
    AccountSessionToken: string;
    AssumedSession: string | object;
    [key: string]: unknown;
}

/**
 * Cucumber custom World implementation to support Zenko.
 * This World is reponsible for AWS CLI calls.
 * Shared between all tests (S3, IAM, STS).
 */
export default class Zenko extends World<ZenkoWorldParameters> {
    private readonly command: string = '';

    private result: object = {};

    private parsedResult: Utils.Command[] = [];

    private serviceType = '';

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

        // store service users credentials from world parameters
        if (this.parameters.ServiceUsersCredentials) {
            const serviceUserCredentials =
                JSON.parse(this.parameters.ServiceUsersCredentials) as ServiceUsersCredentials;
            for (const key in serviceUserCredentials) {
                Zenko.serviceUsersCredentials[key] = {
                    AccessKeyId: serviceUserCredentials.accessKey,
                    SecretAccessKey: serviceUserCredentials.secretKey,
                };
            }
        }

        // Workaround to be able to access global parameters in BeforeAll/AfterAll hooks
        CacheHelper.parameters = this.parameters as Record<string, unknown>;
        this.cliMode.parameters = this.parameters as ClientOptions;

        if (this.parameters.AccountSessionToken) {
            (CacheHelper.ARWWI[CacheHelper.AccountName]) = {
                AccessKeyId: this.parameters.AccountAccessKey,
                SecretAccessKey: this.parameters.AccountSecretKey,
                SessionToken: this.parameters.AccountSessionToken,
            };
        } else {
            CacheHelper.AccountName = this.parameters.AccountName;
            CacheHelper.isPreloadedAccount = true;
        }
    }

    /**
     * This function will dynamically determine if the result from the AWS CLI command
     * is a success or a failure. Based on the fact that AWS CLI either return an empty string
     * or a JSON-parsable string.
     * @param {object} result - contains both stderr and stdout from the CLI command.
     * @returns {boolean} - if the result is a success or a failure
     */
    checkResult(result: Utils.Command | Utils.Command[]): boolean {
        const usedResult: Utils.Command[] = Array.isArray(result) ? result : [result];
        let decision = true;
        usedResult.forEach(res => {
            if (!res || res.err || this.forceFailed === true) {
                decision = false;
            }
            try {
                // Accept empty responses (in case of success)
                if (res.stdout && res.stdout !== '') {
                    const parsed = JSON.parse(res.stdout) as Utils.Command;
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
        const usedParameters = this.parameters;
        const keycloakPassword = usedParameters.KeycloakTestPassword as string || '123';
        const savedParameters = JSON.parse(JSON.stringify(this.cliOptions)) as object;
        this.resetGlobalType();
        switch (entityType) {
        case EntityType.ACCOUNT:
            await this.prepareRootUser();
            this.saved.type = EntityType.ACCOUNT;
            break;
        case EntityType.IAM_USER:
            await this.prepareIamUser();
            this.saved.type = EntityType.IAM_USER;
            break;
        case EntityType.STORAGE_MANAGER:
            await this.prepareARWWI(
                usedParameters.StorageManagerUsername || 'storage_manager',
                keycloakPassword,
                'storage-manager-role',
            );
            this.saved.type = EntityType.STORAGE_MANAGER;
            break;
        case EntityType.STORAGE_ACCOUNT_OWNER:
            await this.prepareARWWI(
                usedParameters.StorageAccountOwnerUsername || 'storage_account_owner',
                keycloakPassword,
                'storage-account-owner-role',
            );
            this.saved.type = EntityType.STORAGE_ACCOUNT_OWNER;
            break;
        case EntityType.DATA_CONSUMER:
            await this.prepareARWWI(
                usedParameters.DataConsumerUsername || 'data_consumer',
                keycloakPassword,
                'data-consumer-role',
            );
            this.saved.type = EntityType.DATA_CONSUMER;
            break;
        default:
            break;
        }
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

        if (!(ARWWIName in CacheHelper.ARWWI)) {
            const token: string = await this.getWebIdentityToken(
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
                name: this.parameters.AccountName || Constants.ACCOUNT_NAME,
            }) as Utils.AccountObject;
            // Getting roles with GetRolesForWebIdentity
            // Get the first role with the storage-manager-role name
            const data: GetRolesForWIResponse =
                (await SuperAdmin.getRolesForWebIdentity(this.options.webIdentityToken)).data as GetRolesForWIResponse;
            let roleToAssume: string | undefined = '';
            if (data.roles.ListOfRoleArns) {
                roleToAssume = data.roles.ListOfRoleArns.find(
                    (roleArn: string) => roleArn.includes(ARWWITargetRole) && roleArn.includes(account.id as string),
                );
            } else {
                data.roles.Accounts.forEach((_account: Utils.GRFWIAccount) => {
                    roleToAssume = _account.Roles?.find(
                        (role: Utils.Role) =>
                            role.Arn.includes(ARWWITargetRole) && role.Arn.includes(account.id as string),
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
            if (ARWWI && typeof ARWWI !== 'string' && ARWWI.stdout) {
                const parsedOutput = JSON.parse(ARWWI.stdout) as { Credentials: ClientOptions['AssumedSession'] };
                if (parsedOutput && parsedOutput.Credentials) {
                    this.parameters.AssumedSession = parsedOutput.Credentials;
                }
            } else {
                throw new Error('Error when trying to Assume Role With Web Identity.');
            }
            // Save the session for future scenarios (increases performance)
            CacheHelper.ARWWI[ARWWIName] = this.parameters.AssumedSession as ClientOptions['AssumedSession'];
            this.cliMode.parameters.AssumedSession =
                CacheHelper.ARWWI[ARWWIName];
            this.cliMode.assumed = true;
        } else {
            this.parameters.AssumedSession =
                CacheHelper.ARWWI[ARWWIName] as object;
            this.cliMode.parameters.AssumedSession =
                CacheHelper.ARWWI[ARWWIName];
            this.cliMode.assumed = true;
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

    /**
     * Creates an assumed role session with a duration of 12 hours.
     * @param {boolean} crossAccount - If true, the role will be assumed cross account.
     * @returns {undefined}
     */
    async prepareAssumeRole(crossAccount = false) {
        this.resetGlobalType();

        // Getting default account ID
        const account = await SuperAdmin.getAccount({
            name: this.parameters.AccountName || Constants.ACCOUNT_NAME,
        }) as Utils.Account['account'];
        Zenko.additionalAccountsCredentials[account.name as string] = {
            AccessKey: CacheHelper.parameters?.AccessKey as string,
            SecretKey: CacheHelper.parameters?.SecretKey as string,
        };

        // Creating a role to assume
        this.saved.roleName = `${(account).name as string}` +
            `${Constants.ROLE_NAME_TEST}${`${Utils.randomString()}`.toLocaleLowerCase()}`;
        this.addCommandParameter({ roleName: this.saved.roleName as string });
        this.addCommandParameter({ assumeRolePolicyDocument: Constants.assumeRoleTrustPolicy });
        const roleArnToAssume =
            extractPropertyFromResults(await IAM.createRole(
                this.getCommandParameters() as AWSCliOptions), 'Role', 'Arn');

        let accountToBeAssumedFrom = account;

        if (crossAccount) {
            // Creating a second account if its Cross-Account AssumeRole
            const account2 = await SuperAdmin.createAccount({
                name: `${Constants.ACCOUNT_NAME}${Utils.randomString()}`,
            }) as Utils.Account;

            // Creating credentials for the second account
            const account2Credentials = await SuperAdmin.generateAccountAccessKey({
                name: account2.account.name,
            }) as Utils.AccessKeys;

            // Set the credentials of the second account as the default credentials
            CacheHelper.parameters ??= {};
            CacheHelper.parameters.AccessKey = account2Credentials.id as string;
            CacheHelper.parameters.SecretKey = account2Credentials.value as string;

            accountToBeAssumedFrom = account2.account;
        }

        // Creating a user in the account to be assumed from
        this.resetCommand();
        const userName = `${accountToBeAssumedFrom.name as string}${Constants.USER_NAME_TEST}${Utils.randomString()}`;
        this.addCommandParameter({ userName });
        await IAM.createUser(this.getCommandParameters());

        // Creating a policy to allow it to AssumeRole
        this.resetCommand();
        this.addCommandParameter({
            policyName: `${(accountToBeAssumedFrom).name as string }` +
                `${Constants.POLICY_NAME_TEST}` +
                `${Utils.randomString()}`,
        });
        this.addCommandParameter({ policyDocument: Constants.assumeRolePolicy });
        const assumeRolePolicyArn =
            extractPropertyFromResults(await IAM.createRole(
                this.getCommandParameters() as AWSCliOptions), 'Policy', 'Arn');

        // Attaching the policy to the user
        this.resetCommand();
        this.addCommandParameter({ userName });
        this.addCommandParameter({ policyArn: assumeRolePolicyArn });
        await IAM.attachUserPolicy(this.getCommandParameters());

        // Creating credentials for the user
        this.resetCommand();
        this.addCommandParameter({ userName });
        this.parameters.IAMSession =
            extractPropertyFromResults(await IAM.createRole(
                this.getCommandParameters() as AWSCliOptions), 'AccessKey');
        this.resumeRootOrIamUser();

        // Assuming the role
        this.resetCommand();
        this.addCommandParameter({ roleArn: roleArnToAssume as string });
        const res = extractPropertyFromResults(await IAM.createRole(
            this.getCommandParameters() as AWSCliOptions), 'Credentials');
        if (res) {
            this.parameters.AssumedSession = res;
        }
        this.cliMode.assumed = true;
        this.cliMode.env = false;

        CacheHelper.parameters ??= {};
        // reset the credentials of default account as the defualt credentials
        CacheHelper.parameters.AccessKey =
            Zenko.additionalAccountsCredentials[account.name as string].AccessKey;
        CacheHelper.parameters.SecretKey =
            Zenko.additionalAccountsCredentials[account.name as string].SecretKey;
    }

    /**
     * Creates an assumed role session as service user with a duration of 12 hours.
     * @Param {string} serviceUserName - The name of the service user to be used,
     * @Param {string} roleName - the role name to assume.
     * @returns {undefined}
     */
    async prepareServiceUser(serviceUserName: string, roleName: string) {
        this.resetGlobalType();

        let roleArnToAssume: string | null = null;
        // Getting the role to assume
        this.addCommandParameter({ roleName });
        roleArnToAssume =
            extractPropertyFromResults(await IAM.getRole(this.getCommandParameters()), 'Role', 'Arn');
        if (!roleArnToAssume) {
            // if role to assume does not exist in the account, then it should be in the internal services account
            roleArnToAssume =
                `arn:aws:iam::${Constants.INTERNAL_SERVICES_ACCOUNT_ID}:role/scality-internal/${roleName}`;
        }

        // assign the credentials of the service user to the IAM session
        this.parameters.IAMSession =
            Zenko.serviceUsersCredentials[serviceUserName];
        this.resumeRootOrIamUser();

        // Assuming the role as the service user
        this.resetCommand();
        this.addCommandParameter({ roleArn: roleArnToAssume });
        const assumeRoleRes = await STS.assumeRole(this.getCommandParameters());
        if (assumeRoleRes.err) {
            throw new Error(`Error when trying to assume role ${roleArnToAssume} as service user ${serviceUserName}.
            ${assumeRoleRes.err}`);
        }

        //assign the assumed session credentials to the Assumed session.
        this.parameters.AssumedSession =
            extractPropertyFromResults(assumeRoleRes, 'Credentials');
        this.resumeAssumedRole();
    }

    /**
     * Hook Zenko is a utility function to prepare a Zenko
     * @param {Object.<string,*>} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: Record<string, unknown>) {
        CacheHelper.parameters ??= {};
        if (!CacheHelper.accountAccessKeys) {
            // TODO will need to see how VaultClient is typed
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            CacheHelper.adminClient = await Utils.getAdminCredentials(parameters);

            let account = null;
            // Create the account if already exist will not throw any error
            await SuperAdmin.createAccount({
                name: parameters.AccountName as string || Constants.ACCOUNT_NAME,
            });
            // Waiting until the account exists, in case of parallel mode.
            let remaining = Constants.MAX_ACCOUNT_CHECK_RETRIES;
            while (!account && remaining > 0) {
                await Utils.sleep(1000);
                account = (await SuperAdmin.getAccount({
                    name: parameters.AccountName as string || Constants.ACCOUNT_NAME,
                })) as Utils.Account['account'];
                remaining--;
            }
            if (!account) {
                throw new Error(`Account ${parameters.AccountName as string
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
                    name: parameters.AccountName as string || Constants.ACCOUNT_NAME,
                });
                if (Utils.isAccessKeys(accessKeys)) {
                    CacheHelper.accountAccessKeys = accessKeys;
                    CacheHelper.parameters.AccessKey =
                        CacheHelper.accountAccessKeys?.id;
                    CacheHelper.parameters.SecretKey =
                        CacheHelper.accountAccessKeys?.value;
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

    /**
     * Creates an root user with policy and access keys to be used in the tests.
     * The IAM user is cached for future tests to reduce the overall test suite
     * duration.
     * @returns {undefined}
     */
    async prepareRootUser() {
        Zenko.IAMUserName = Zenko.IAMUserName || `${this.parameters.IAMUserName as string
            || 'usertest'}${Utils.randomString()}`;
        Zenko.IAMUserPolicyName = `IAMUserPolicy-${Zenko.IAMUserName}${Utils.randomString()}`;
        if (!this.cliMode.parameters.IAMSession) {
            // Create IAM user
            this.addCommandParameter({ userName: Zenko.IAMUserName });
            await IAM.createUser(this.getCommandParameters());
            this.resetCommand();
            // Create policy
            this.addCommandParameter({ policyName: Zenko.IAMUserPolicyName });
            this.addCommandParameter({ policyPath: '/' });
            if (process.env.POLICY_DOCUMENT) {
                this.addCommandParameter({ policyDocument: JSON.parse(process.env.POLICY_DOCUMENT) as object });
            } else {
                this.addCommandParameter({ policyDocument: IAMUserPolicy });
            }
            const policy = await IAM.createPolicy(this.getCommandParameters());
            const account = await SuperAdmin.getAccount({
                name: this.parameters.AccountName || Constants.ACCOUNT_NAME,
            }) as Utils.Account['account'];
            let policyArn = `arn:aws:iam::${account.id as string}:policy/IAMUserPolicy-${Zenko.IAMUserName}}`;
            try {
                policyArn = (JSON.parse(policy.stdout) as { Policy: { Arn: string } }).Policy.Arn;
            } catch (err: unknown) {
                const usedErr = err as { message: string };
                process.stderr.write('Failed to create the IAM User policy.\n' +
                    `${JSON.stringify(policy)}\n${usedErr.message}\n`);
            }
            this.resetCommand();
            // Attach user policy
            this.addCommandParameter({ userName: Zenko.IAMUserName });
            this.addCommandParameter({ policyArn });
            // Save the attached policy for cleanup
            Zenko.IAMUserAttachedPolicy = policyArn;
            await IAM.attachUserPolicy(this.getCommandParameters());
            this.resetCommand();
            // Create credentials for the user
            this.addCommandParameter({ userName: Zenko.IAMUserName });
            const accessKey = await IAM.createAccessKey(this.getCommandParameters());
            if (accessKey.err) {
                throw new Error(`Error creating the IAM User's access key.\n
                 ${accessKey.err}`);
            }
            this.parameters.IAMSession =
                extractPropertyFromResults(accessKey, 'AccessKey');
            this.cliMode.parameters.IAMSession =
                this.parameters.IAMSession as ClientOptions['IAMSession'];
            this.cliMode.env = true;
            this.resetCommand();
        } else {
            this.parameters.IAMSession =
                this.cliMode.parameters.IAMSession;
            this.cliMode.env = true;
        }
    }

    /**
     * Creates an IAM user with policy and access keys to be used in the tests.
     * The IAM user is cached for future tests to reduce the overall test suite
     * duration.
     * @returns {undefined}
     */
    async prepareIamUser() {
        this.saved.userName = `iamusertest${Utils.randomString()}`;
        // Create IAM user
        this.addCommandParameter({ userName: this.saved.userName as string });
        await IAM.createUser(this.getCommandParameters());
        this.resetCommand();
        // Create credentials for the user
        this.addCommandParameter({ userName: this.saved.userName as string });
        const accessKey = await IAM.createAccessKey(this.getCommandParameters());
        this.parameters.IAMSession =
            (JSON.parse(accessKey.stdout) as { AccessKey: string })?.AccessKey;
        this.cliMode.parameters.IAMSession =
            this.parameters.IAMSession as ClientOptions['IAMSession'];
        (CacheHelper.parameters as { IAMSession: ClientOptions['IAMSession'] }).IAMSession =
            this.parameters.IAMSession as ClientOptions['IAMSession'];
        this.cliMode.env = true;
        this.resetCommand();
    }

    resumeRootOrIamUser() {
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
     * Get all saved parameters
     * @returns {Object.<string,*>} - an object with any saved parameters
     */
    public getSaved(): Record<string, unknown> {
        return this.saved;
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
     * Get all saved result object
     * @returns {Object.<string,*>} - an object with saved API call results
     */
    public getResult(): object {
        return this.result;
    }

    /**
     * Get all saved result object
     * @param {object} result - an object with API call results
     * @returns {undefined}
     */
    public setResult(result: object): void {
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
        userCredentials: UserCredentials, headers: AxiosRequestHeaders = {}, payload: object = {}) {
        const credentials: Credentials = {
            accessKeyId: userCredentials.AccessKeyId,
            secretAccessKey: userCredentials.SecretAccessKey,
        };
        if (userCredentials.SessionToken) {
            credentials['sessionToken'] = userCredentials.SessionToken;
        }
        const interceptor = aws4Interceptor({
            region: 'us-east-1',
            service: 's3',
        }, credentials);

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
        } catch (err: unknown) {
            return {
                statusCode:
                    (err as { response: { status: string } }).response.status,
                err: (err as { response: { data: unknown } }).response.data,
            };
        }
    }
}

setWorldConstructor(Zenko);
