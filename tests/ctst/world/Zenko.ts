import { setWorldConstructor, World } from '@cucumber/cucumber';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { aws4Interceptor } from 'aws4-axios'

import { CacheHelper, cliModeObject, Constants, IAM, IAMUserPolicy, S3, STS, SuperAdmin, Utils, } from 'cli-testing';
import qs = require('qs');
import {extractPropertyFromResults} from "../common/utils";

interface AwsCliObjectParameters {
    [key: string]: number | string | undefined | object;
}

// Zenko entities
export enum EntityType {
    ACCOUNT = 'ACCOUNT',
    IAM_USER = 'IAM_USER',
    STORAGE_MANAGER = 'STORAGE_MANAGER',
    STORAGE_ACCOUNT_OWNER = 'STORAGE_ACCOUNT_OWNER',
    DATA_CONSUMER = 'DATA_CONSUMER',
}

/**
 * Cucumber custom World implementation to support Zenko.
 * This World is reponsible for AWS CLI calls.
 * Shared between all tests (S3, IAM, STS).
 */
export default class Zenko extends World {
    private readonly command: string = '';

    private result: any | null = null;

    private parsedResult: any[] = [];

    private commandType = '';

    private cliOptions: AwsCliObjectParameters = {};

    private options: any = {};

    private saved: any = {};

    private static IAMUserName = '';

    private static IAMUserPolicyName = '';

    private static IAMUserAttachedPolicy = '';

    private forceFailed = false;

    private cliMode: cliModeObject = CacheHelper.createCliModeObject();

    /**
     * @constructor
     * @param {Object} options - parameters provided as a CLI parameter when running the tests
     */
    constructor(options: any) {
        super(options);
        // Workaround to be able to access global parameters in BeforeAll/AfterAll hooks
        CacheHelper.parameters = this.parameters;
        this.cliMode.parameters = this.parameters;

        if (this.parameters.AccountSessionToken) {
            CacheHelper.ARWWI[CacheHelper.AccountName] = {
                AccessKeyId: this.parameters.AccountAccessKey,
                SecretAccessKey: this.parameters.AccountSecretKey,
                SessionToken: this.parameters.AccountSessionToken,
            };
            CacheHelper.parameters.AccessKey = this.parameters.AccountAccessKey;
            CacheHelper.parameters.SecretKey = this.parameters.AccountSecretKey;
            CacheHelper.parameters.SessionToken = this.parameters.AccountSessionToken;
        } else {
            CacheHelper.AccountName = CacheHelper.parameters.AccountName;
            CacheHelper.parameters.AccessKey = this.parameters.AccountAccessKey;
            CacheHelper.parameters.SecretKey = this.parameters.AccountSecretKey;
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
    checkResult(result: any[]): boolean {
        if (!Array.isArray(result)) {
            result = [result];
        }
        let decision = true;
        result.forEach(res => {
            if (!res || res.err || this.forceFailed === true) {
                decision = false;
            }
            try {
                // Accept empty responses (in case of success)
                if (res.stdout && res.stdout !== '') {
                    const parsed = JSON.parse(res.stdout);
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
        const keycloakTestPassword = this.parameters.KeycloakTestPassword || '123';
        const savedParameters = JSON.parse(JSON.stringify(this.cliOptions));
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
                    this.parameters.StorageManagerUsername || 'storage_manager',
                    keycloakTestPassword,
                    'storage-manager-role',
                );
                this.saved.type = EntityType.STORAGE_MANAGER;
                break;
            case EntityType.STORAGE_ACCOUNT_OWNER:
                await this.prepareARWWI(
                    this.parameters.StorageAccountOwnerUsername || 'storage_account_owner',
                    keycloakTestPassword,
                    'storage-account-owner-role',
                );
                this.saved.type = EntityType.STORAGE_ACCOUNT_OWNER;
                break;
            case EntityType.DATA_CONSUMER:
                await this.prepareARWWI(
                    this.parameters.DataConsumerUsername || 'data_consumer',
                    keycloakTestPassword,
                    'data-consumer-role',
                );
                this.saved.type = EntityType.DATA_CONSUMER;
                break;
            default:
                break;
        }
        this.resetCommand();
        this.cliOptions = savedParameters;
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
            const token = await this.getWebIdentityToken(
                ARWWIName,
                ARWWIPassword,
                this.parameters.KeycloakHost || 'keycloak.zenko.local',
                this.parameters.keycloakPort || 80,
                `/auth/realms/${this.parameters.keycloakRealm || "zenko"}/protocol/openid-connect/token`,
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
            });
            // Getting roles with GetRolesForWebIdentity
            const { data: { data: roles } } = await SuperAdmin.getRolesForWebIdentity(this.options.webIdentityToken);            // Get the first role with the storage-manager-role name
            let roleToAssume = '';
            if (roles.ListOfRoleArns) {
                roleToAssume = roles.find(
                    (roleArn: string) => roleArn.includes(ARWWITargetRole) && roleArn.includes(account.id),
                );
            } else {
                roles.Accounts.forEach((_account: any) => {
                    roleToAssume = _account.Roles.find(
                        (role: { Name: string; Arn: string }) =>
                            role.Arn.includes(ARWWITargetRole) && role.Arn.includes(account.id),
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
                this.parameters.AssumedSession = JSON.parse(ARWWI.stdout).Credentials;
            } else {
                throw new Error('Error when trying to Assume Role With Web Identity.');
            }
            // Save the session for future scenarios (increases performance)
            CacheHelper.ARWWI[ARWWIName] = this.parameters.AssumedSession;
            this.cliMode.parameters.AssumedSession = CacheHelper.ARWWI[ARWWIName];
            this.cliMode.assumed = true;
        } else {
            this.parameters.AssumedSession = CacheHelper.ARWWI[ARWWIName];
            this.cliMode.parameters.AssumedSession = CacheHelper.ARWWI[ARWWIName];
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
    ) {
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
            return result.data.id_token;
        }
        catch (error) {
            throw new Error(`Error when trying to get a WebIdentity token: ${(error as Error).message}`);
        }
    }

    /**
     * Hook Zenko is a utility function to prepare a Zenko
     * @param {object} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: any) {
        if (!CacheHelper.accountAccessKeys) {
            CacheHelper.adminClient = await Utils.getAdminCredentials(parameters);

            let account = null;
            // Create the account if already exist will not throw any error
            await SuperAdmin.createAccount({
                name: parameters.AccountName || Constants.ACCOUNT_NAME,
            });
            // Waiting until the account exists, in case of parallel mode.
            let remaining = Constants.MAX_ACCOUNT_CHECK_RETRIES;
            while (!account && remaining > 0) {
                await Utils.sleep(1000);
                account = (await SuperAdmin.getAccount({
                    name: parameters.AccountName || Constants.ACCOUNT_NAME,
                }));
                remaining--;
            }
            if (!account) {
                throw new Error(`Account ${parameters.AccountName || Constants.ACCOUNT_NAME} not found \
        after ${Constants.MAX_ACCOUNT_CHECK_RETRIES} retries.`);
            }
            if (parameters.AccountName && parameters.AccountAccessKey
                && parameters.AccountSecretKey) {
                CacheHelper.parameters.AccessKey = parameters.AccountAccessKey;
                CacheHelper.parameters.SecretKey = parameters.AccountSecretKey;
                CacheHelper.isPreloadedAccount = true;
            } else {
                const accessKeys = await SuperAdmin.generateAccountAccessKey({
                    name: parameters.AccountName || Constants.ACCOUNT_NAME,
                });
                if (Utils.isAccessKeys(accessKeys)) {
                    CacheHelper.accountAccessKeys = accessKeys;
                    CacheHelper.parameters.AccessKey = CacheHelper.accountAccessKeys?.id;
                    CacheHelper.parameters.SecretKey = CacheHelper.accountAccessKeys?.value;
                } else {
                    throw new Error('Failed to generate account access keys');
                }
            }
            CacheHelper.AccountName = CacheHelper.parameters.AccountName || Constants.ACCOUNT_NAME;
        } else {
            CacheHelper.parameters.AccessKey = CacheHelper.accountAccessKeys?.id;
            CacheHelper.parameters.SecretKey = CacheHelper.accountAccessKeys?.value;
        }
    }

    /**
     * Creates an root user with policy and access keys to be used in the tests.
     * The IAM user is cached for future tests to reduce the overall test suite
     * duration.
     * @returns {undefined}
     */
    async prepareRootUser() {
        Zenko.IAMUserName = Zenko.IAMUserName || `${this.parameters.IAMUserName || 'usertest'}${Utils.randomString()}`;
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
                this.addCommandParameter({ policyDocument: JSON.parse(process.env.POLICY_DOCUMENT) });
            } else {
                this.addCommandParameter({ policyDocument: IAMUserPolicy });
            }
            const policy = await IAM.createPolicy(this.getCommandParameters());
            const account = await SuperAdmin.getAccount({
                name: this.parameters.AccountName || Constants.ACCOUNT_NAME,
            });
            let policyArn = `arn:aws:iam::${account.id}:policy/IAMUserPolicy-${Zenko.IAMUserName}}`;
            try {
                policyArn = JSON.parse(policy.stdout).Policy.Arn;
            } catch (err: any) {
                process.stderr.write(`Failed to create the IAM User policy.\n
${JSON.stringify(policy)}\n${err.message}\n`);
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
            this.parameters.IAMSession = extractPropertyFromResults(accessKey, 'AccessKey');
            this.cliMode.parameters.IAMSession = this.parameters.IAMSession;
            this.cliMode.env = true;
            this.resetCommand();
        } else {
            this.parameters.IAMSession = this.cliMode.parameters.IAMSession;
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
        Zenko.IAMUserName = Zenko.IAMUserName || `${this.parameters.IAMUserName || 'usertest'}${Utils.randomString()}`;
        if (!this.cliMode.parameters.IAMSession) {
            // Create IAM user
            this.addCommandParameter({ userName: Zenko.IAMUserName });
            await IAM.createUser(this.getCommandParameters());
            this.resetCommand();
            // Create credentials for the user
            this.addCommandParameter({ userName: Zenko.IAMUserName });
            const accessKey = await IAM.createAccessKey(this.getCommandParameters());
            this.parameters.IAMSession = JSON.parse(accessKey.stdout).AccessKey;
            this.cliMode.parameters.IAMSession = this.parameters.IAMSession;
            this.cliMode.env = true;
            this.resetCommand();
        } else {
            this.parameters.IAMSession = this.cliMode.parameters.IAMSession;
            this.cliMode.env = true;
        }
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
     * @param {string} type - type of the AWS CLI command (sts, iam, s3)
     * @returns {undefined}
     */
    setCommandType(type: string): void {
        this.commandType = type;
    }

    /**
     * Map the given parameter to the AWS CLI command
     * @param {object} param - an object with a key and a value
     * @returns {undefined}
     */
    addCommandParameter(param: AwsCliObjectParameters): void {
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
     * @returns {AwsCliObjectParameters} - an object with the cli command options
     */
    getCommandParameters() {
        return {
            ___mode: this.cliMode,
            ...this.cliOptions,
        };
    }

    /**
     * Cleanup function for the Zenko world
     * @returns {undefined}
     */
    static async teardown() { }

    async metadataSearchResponseCode(userCredentials: any, bucketName: string) {
        return await this.awsS3GetRequest(
            `/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`,
            userCredentials,
        );
    }

    async awsS3GetRequest(path: string, userCredentials: any) {
        const credentials: any = {
            accessKeyId: userCredentials.AccessKeyId,
            secretAccessKey: userCredentials.SecretAccessKey,
        };
        if (userCredentials.SessionToken) {
            credentials['sessionToken'] = userCredentials.SessionToken;
        }
        const interceptor = aws4Interceptor({
            region: 'us-east-1',
            service: 's3'
        }, credentials);

        axios.interceptors.request.use(interceptor);
        const protocol = this.parameters.ssl === false ? 'http://' : 'https://';
        try {
            const response = await axios.get(`${protocol}s3.${this.parameters.subdomain || Constants.DEFAULT_SUBDOMAIN}` + path);
            return { statusCode: response.status, data: response.data }
        } catch (err: any) {
            return { statusCode: err.response.status, data: err.response.data };
        }
    }  
}

setWorldConstructor(Zenko);
