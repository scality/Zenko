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

export interface Result {
    err: unknown;
    stdout: string;
}

interface Role {
    Name: string;
    Arn: string;
}

interface Account {
    id: string;
    Arn: string;
    name: string;
    Roles: Role[];
}

interface GetRolesForWIResponse {
    roles: {
        ListOfRoleArns: string[];
        Accounts: Account[];
    }
}

interface ICacheHelper {
    ARWWI: Record<string, unknown>;
}

export interface UserCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
}

interface CacheHelperParameters {
    AccessKey: string,
    AccountName: string,
    SecretKey: string,
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

/**
 * Cucumber custom World implementation to support Zenko.
 * This World is reponsible for AWS CLI calls.
 * Shared between all tests (S3, IAM, STS).
 */
export default class Zenko extends World {
    private readonly command: string = '';

    private result: object = {};

    private parsedResult: Result[] = [];

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

    readonly parameters: Record<string, unknown> = {};

    private cliMode: cliModeObject = CacheHelper.createCliModeObject();

    /**
     * @constructor
     * @param {Object} options - parameters provided as a CLI parameter when running the tests
     */
    constructor(options: IWorldOptions) {
        super(options);

        // store service users credentials from world parameters
        if (this.parameters.ServiceUsersCredentials) {
            Object.entries(JSON.parse(
                this.parameters.ServiceUsersCredentials as string) as UserCredentials)
                .forEach(entry => {
                    Zenko.serviceUsersCredentials[entry[0]] = {
                        AccessKeyId: (entry[1] as {accessKey: string}).accessKey,
                        SecretAccessKey: (entry[1] as {secretKey: string}).secretKey,
                    };
                });
        }

        // Workaround to be able to access global parameters in BeforeAll/AfterAll hooks
        CacheHelper.parameters = this.parameters;
        this.cliMode.parameters = this.parameters as ClientOptions;

        if (this.parameters.AccountSessionToken) {
            ((CacheHelper.ARWWI as Record<string, unknown>)[CacheHelper.AccountName]) = {
                AccessKeyId: this.parameters.AccountAccessKey,
                SecretAccessKey: this.parameters.AccountSecretKey,
                SessionToken: this.parameters.AccountSessionToken,
            };
        } else {
            CacheHelper.AccountName = this.parameters.AccountName as string;
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
    checkResult(result: Result | Utils.Command | Result[]): boolean {
        let usedResult: Result | Utils.Command | Result[];
        if (!Array.isArray(result)) {
            usedResult = [result] as Result[];
        } else {
            usedResult = result;
        }
        let decision = true;
        usedResult.forEach(res => {
            if (!res || res.err || this.forceFailed === true) {
                decision = false;
            }
            try {
                // Accept empty responses (in case of success)
                if (res.stdout && res.stdout !== '') {
                    const parsed = JSON.parse(res.stdout) as Result;
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
        const saved: Record<string, unknown> = this.getSaved();
        const usedParameters = this.parameters;
        const keycloakPassword = usedParameters.KeycloakTestPassword as string || '123';
        const savedParameters = JSON.parse(JSON.stringify(this.cliOptions)) as object;
        this.resetGlobalType();
        switch (entityType) {
        case EntityType.ACCOUNT:
            await this.prepareRootUser();
            saved.type = EntityType.ACCOUNT;
            break;
        case EntityType.IAM_USER:
            await this.prepareIamUser();
            saved.type = EntityType.IAM_USER;
            break;
        case EntityType.STORAGE_MANAGER:
            await this.prepareARWWI(
                    usedParameters.StorageManagerUsername as string || 'storage_manager',
                    keycloakPassword,
                    'storage-manager-role',
            );
            saved.type = EntityType.STORAGE_MANAGER;
            break;
        case EntityType.STORAGE_ACCOUNT_OWNER:
            await this.prepareARWWI(
                    usedParameters.StorageAccountOwnerUsername as string || 'storage_account_owner',
                    keycloakPassword,
                    'storage-account-owner-role',
            );
            saved.type = EntityType.STORAGE_ACCOUNT_OWNER;
            break;
        case EntityType.DATA_CONSUMER:
            await this.prepareARWWI(
                    usedParameters.DataConsumerUsername as string || 'data_consumer',
                    keycloakPassword,
                    'data-consumer-role',
            );
            saved.type = EntityType.DATA_CONSUMER;
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
        const usedParameters = this.parameters;

        if (!(ARWWIName in CacheHelper.ARWWI)) {
            const token: string = await this.getWebIdentityToken(
                ARWWIName,
                ARWWIPassword,
                usedParameters.KeycloakHost as string || 'keycloak.zenko.local',
                usedParameters.keycloakPort as string || '80',
                `/auth/realms/${usedParameters.keycloakRealm as string || 'zenko'}/protocol/openid-connect/token`,
                usedParameters.keycloakClientId as string || Constants.K_CLIENT,
                usedParameters.keycloakGrantType as string || 'password',
            );
            this.options.webIdentityToken = token;
            if (!this.options.webIdentityToken) {
                throw new Error('Error when trying to get a WebIdentity token.');
            }
            // Getting account ID
            const account = await SuperAdmin.getAccount({
                name: usedParameters.AccountName as string || Constants.ACCOUNT_NAME,
            }) as Account;
            // Getting roles with GetRolesForWebIdentity
            // Get the first role with the storage-manager-role name
            const data: GetRolesForWIResponse =
                (await SuperAdmin.getRolesForWebIdentity(this.options.webIdentityToken)).data as GetRolesForWIResponse;
            let roleToAssume: string | undefined = '';
            if (data.roles.ListOfRoleArns) {
                roleToAssume = data.roles.ListOfRoleArns.find(
                    (roleArn: string) => roleArn.includes(ARWWITargetRole) && roleArn.includes(account.id),
                );
            } else {
                data.roles.Accounts.forEach((_account: Account) => {
                    roleToAssume = _account.Roles.find(
                        (role: { Name: string; Arn: string }) =>
                            role.Arn.includes(ARWWITargetRole) && role.Arn.includes(account.id),
                    )?.Arn as string || roleToAssume;
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
            const ARWWI = await STS.assumeRoleWithWebIdentity(this.options, usedParameters);
            if (ARWWI && typeof ARWWI !== 'string' && ARWWI.stdout) {
                usedParameters.AssumedSession =
                (JSON.parse(ARWWI.stdout) as { Credentials: ClientOptions['AssumedSession'] }).Credentials;
            } else {
                throw new Error('Error when trying to Assume Role With Web Identity.');
            }
            // Save the session for future scenarios (increases performance)
            (CacheHelper as ICacheHelper).ARWWI[ARWWIName] = usedParameters.AssumedSession;
            this.cliMode.parameters.AssumedSession =
                (CacheHelper as ICacheHelper).ARWWI[ARWWIName] as ClientOptions['AssumedSession'];
            this.cliMode.assumed = true;
        } else {
            usedParameters.AssumedSession =
                (CacheHelper as ICacheHelper).ARWWI[ARWWIName] as ClientOptions['AssumedSession'];
            this.cliMode.parameters.AssumedSession =
                (CacheHelper as ICacheHelper).ARWWI[ARWWIName] as ClientOptions['AssumedSession'];
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
            name: this.parameters.AccountName as string || Constants.ACCOUNT_NAME,
        }) as Utils.Account['account'];
        Zenko.additionalAccountsCredentials[account.name as string] = {
            AccessKey: (CacheHelper.parameters as CacheHelperParameters).AccessKey,
            SecretKey: (CacheHelper.parameters as CacheHelperParameters).SecretKey,
        };

        // Creating a role to assume
        this.getSaved().roleName = `${(account).name as string}` +
            `${Constants.ROLE_NAME_TEST}${`${Utils.randomString()}`.toLocaleLowerCase()}`;
        this.addCommandParameter({ roleName: this.getSaved().roleName as string });
        this.addCommandParameter({ assumeRolePolicyDocument: Constants.assumeRoleTrustPolicy });
        const roleArnToAssume =
            extractPropertyFromResults((await IAM.createRole(
                this.getCommandParameters() as AWSCliOptions) as Utils.Command) as Result, 'Role', 'Arn');

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
            (CacheHelper.parameters as CacheHelperParameters).AccessKey = account2Credentials.id as string;
            (CacheHelper.parameters as CacheHelperParameters).SecretKey = account2Credentials.value as string;

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
            policyName: `${(accountToBeAssumedFrom).name as string}` +
                `${Constants.POLICY_NAME_TEST}` +
                `${Utils.randomString()}`,
        });
        this.addCommandParameter({ policyDocument: Constants.assumeRolePolicy });
        const assumeRolePolicyArn =
            extractPropertyFromResults((await IAM.createRole(
                this.getCommandParameters() as AWSCliOptions) as Utils.Command) as Result, 'Policy', 'Arn');

        // Attaching the policy to the user
        this.resetCommand();
        this.addCommandParameter({ userName });
        this.addCommandParameter({ policyArn: assumeRolePolicyArn as string });
        await IAM.attachUserPolicy(this.getCommandParameters());

        // Creating credentials for the user
        this.resetCommand();
        this.addCommandParameter({ userName });
        this.parameters.IAMSession =
            extractPropertyFromResults((await IAM.createRole(
                this.getCommandParameters() as AWSCliOptions) as Utils.Command) as Result, 'AccessKey');
        this.resumeRootOrIamUser();

        // Assuming the role
        this.resetCommand();
        this.addCommandParameter({ roleArn: roleArnToAssume as string });
        this.parameters.AssumedSession =
            extractPropertyFromResults((await IAM.createRole(
                this.getCommandParameters() as AWSCliOptions) as Utils.Command) as Result, 'Credentials');
        this.cliMode.assumed = true;
        this.cliMode.env = false;

        // reset the credentials of default account as the defualt credentials
        (CacheHelper.parameters as CacheHelperParameters).AccessKey =
            Zenko.additionalAccountsCredentials[account.name as string].AccessKey;
        (CacheHelper.parameters as CacheHelperParameters).SecretKey =
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
            extractPropertyFromResults(await IAM.getRole(this.getCommandParameters()) as Result, 'Role', 'Arn');
        if (!roleArnToAssume) {
            // if role to assume does not exist in the account, then it should be in the internal services account
            roleArnToAssume =
            `arn:aws:iam::${Constants.INTERNAL_SERVICES_ACCOUNT_ID}:role/scality-internal/${roleName}`;
        }

        // assign the credentials of the service user to the IAM session
        this.parameters.IAMSession =
        Zenko.serviceUsersCredentials[serviceUserName] as UserCredentials;
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
        extractPropertyFromResults(assumeRoleRes as Result, 'Credentials') as string;
        this.resumeAssumedRole();
    }

    /**
     * Hook Zenko is a utility function to prepare a Zenko
     * @param {Object.<string,*>} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: { [key: string]: unknown }) {

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
                (CacheHelper.parameters as CacheHelperParameters).AccessKey = parameters.AccountAccessKey as string;
                (CacheHelper.parameters as CacheHelperParameters).SecretKey = parameters.AccountSecretKey as string;
                CacheHelper.isPreloadedAccount = true;
            } else {
                const accessKeys = await SuperAdmin.generateAccountAccessKey({
                    name: parameters.AccountName as string || Constants.ACCOUNT_NAME,
                });
                if (Utils.isAccessKeys(accessKeys)) {
                    CacheHelper.accountAccessKeys = accessKeys;
                    (CacheHelper.parameters as CacheHelperParameters).AccessKey =
                        CacheHelper.accountAccessKeys?.id as string;
                    (CacheHelper.parameters as CacheHelperParameters).SecretKey =
                        CacheHelper.accountAccessKeys?.value as string;
                } else {
                    throw new Error('Failed to generate account access keys');
                }
            }
            CacheHelper.AccountName = (CacheHelper.parameters as CacheHelperParameters).AccountName
                || Constants.ACCOUNT_NAME;
        } else {
            (CacheHelper.parameters as CacheHelperParameters).AccessKey =
                CacheHelper.accountAccessKeys?.id as string;
            (CacheHelper.parameters as CacheHelperParameters).SecretKey =
                CacheHelper.accountAccessKeys?.value as string;
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
                name: this.parameters.AccountName as string || Constants.ACCOUNT_NAME,
            }) as Utils.Account['account'];
            let policyArn = `arn:aws:iam::${account.id as string}:policy/IAMUserPolicy-${Zenko.IAMUserName}}`;
            try {
                policyArn = (JSON.parse(policy.stdout) as {Policy: {Arn: string}}).Policy.Arn;
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
                extractPropertyFromResults(accessKey as Result, 'AccessKey') as string;
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
        this.addCommandParameter({ userName: this.getSaved().userName as string });
        await IAM.createUser(this.getCommandParameters());
        this.resetCommand();
        // Create credentials for the user
        this.addCommandParameter({ userName: this.getSaved().userName as string });
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
        userCredentials: UserCredentials, headers: AxiosRequestHeaders={}, payload: object={}) {
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
            url: `${protocol}s3.${this.parameters.subdomain as string
            || Constants.DEFAULT_SUBDOMAIN}${path}`,
            headers,
            data: payload,
        };
        try {
            const response: AxiosResponse = await axiosInstance(axiosConfig);
            return { statusCode: response.status, data: response.data as unknown };
        } catch (err: unknown) {
            return { statusCode:
                (err as { response: {status: string }}).response.status,
            err: (err as { response: {data: unknown }}).response.data };
        }
    }
}

setWorldConstructor(Zenko);
