import { setWorldConstructor, World } from '@cucumber/cucumber';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { aws4Interceptor } from 'aws4-axios'

import { CacheHelper, cliModeObject, Constants, IAM, IAMUserPolicy, S3, STS, SuperAdmin, Utils, } from 'cli-testing';
import qs = require('qs');

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
            }
            // this.cliMode.parameters.AssumedSession = CacheHelper.ARWWI[CacheHelper.AccountName];
            // this.cliMode.assumed = true;
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
     * @param {ScenarioCallerType} type - type of entity, can be 'account', 'storage manager',
     * 'storage account owner', 'data consumer' or 'iam user'
     * @returns {undefined}
     */
    async prepareForType(type: string): Promise<void> {
        const savedParameters = JSON.parse(JSON.stringify(this.cliOptions));
        this.resetGlobalType();
        switch (type) {
            case EntityType.ACCOUNT:
                await this.prepareRootUser();
                this.saved.type = EntityType.IAM_USER;
                break;
            case EntityType.IAM_USER:
                await this.prepareIamUser();
                this.saved.type = EntityType.ACCOUNT;
                break;
            case EntityType.STORAGE_MANAGER:
                await this.prepareARWWI(
                    'storage_manager',
                    this.parameters.KeycloakTestPassword || '123',
                    'storage-manager-role',
                );
                this.saved.type = EntityType.STORAGE_MANAGER;
                break;
            case EntityType.STORAGE_ACCOUNT_OWNER:
                await this.prepareARWWI(
                    'storage_account_owner',
                    this.parameters.KeycloakTestPassword || '123',
                    'storage-account-owner-role',
                );
                this.saved.type = EntityType.STORAGE_ACCOUNT_OWNER;
                break;
            case EntityType.DATA_CONSUMER:
                await this.prepareARWWI(
                    'data_consumer',
                    this.parameters.KeycloakTestPassword || '123',
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
            const roles = await SuperAdmin.getRolesForWebIdentity(this.options.webIdentityToken);
            // Get the first role with the storage-manager-role name
            let roleToAssume = '';
            if (roles.data.data.ListOfRoleArns) {
                roleToAssume = roles.data.data.ListOfRoleArns.find(
                    (roleArn: string) => roleArn.includes(ARWWITargetRole) && roleArn.includes(account.id),
                );
            } else {
                roles.data.data.Accounts.forEach((_account: any) => {
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
        // console.log("keycloak");
        // console.log(config);
        const result: AxiosResponse = await axios(config);
        // console.log(result);
        return result.data.access_token;
    }

    /**
     * Hook Zenko is a utility function to prepare a Zenko
     * @param {object} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: any) {
        if (!CacheHelper.accountAccessKeys) {
            CacheHelper.adminClient = await Utils.getAdminCredentials(parameters);
            // console.log("adminClient");
            // console.log(CacheHelper.adminClient);
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
     * Erases all the environment configuration from prepareForType
     * @returns {undefined}
     */
    endForType(): void {
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
            console.log("RESPONSE: ", response.data);
            return { statusCode: response.status, data: response.data }
        } catch (err: any) {
            console.log("ERR RESP: ", err.response);
            return { statusCode: err.response.status, data: err.response.data };
        }
    }

    async restoreObjectResponseCode() {
        this.addCommandParameter({ restoreRequest: "Days=1" });
        return await S3.restoreObject(this.getCommandParameters());
    }

    async putObjectResponseCode() {
        return await S3.putObject(this.getCommandParameters());
    }

    async putObjectAclResponseCode() {
        this.addCommandParameter({ acl: "public-read-write" });
        return await S3.putObjectAcl(this.getCommandParameters());
    }

    // async putObjectVersionAclResponseCode() {
    //     // this.addCommandParameter({
    //     //     acl: '<AccessControlPolicy xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'
    //     //         + '</AccessControlPolicy>'
    //     // });
    //     return await S3.putObjectAcl(this.getCommandParameters());
    // }

    async getObjectResponseCode() {
        return await S3.getObject(this.getCommandParameters());
    }

    // async getObjectVersionResponseCode() {
    //     return await S3.getObject(this.getCommandParameters());
    // }

    async getObjectAclResponseCode() {
        return await S3.getObjectAcl(this.getCommandParameters());
    }

    // async getObjectVersionAclResponseCode() {
    //     return await S3.getObjectAcl(this.getCommandParameters());
    // }

    async deleteObjectResponseCode() {
        return await S3.deleteObject(this.getCommandParameters());
    }

    // async deleteObjectVersionResponseCode() {
    //     return await S3.deleteObject(this.getCommandParameters());
    // }

    async getBucketVersioningResponseCode() {
        return await S3.getBucketVersioning(this.getCommandParameters());
    }

    async getBucketCorsResponseCode() {
        return await S3.getBucketCors(this.getCommandParameters());
    }

    async getBucketAclResponseCode() {
        return await S3.getBucketAcl(this.getCommandParameters());
    }

    async getBucketObjectLockConfResponseCode() {
        return await S3.getObjectLockConfiguration(this.getCommandParameters());
    }

    async getBucketObjectRetentionResponseCode() {
        return await S3.getObjectRetention(this.getCommandParameters());
    }

    // async getBucketObjectVersionRetentionResponseCode() {
    //     return await S3.getObjectRetention(this.getCommandParameters());
    // }

    async getBucketTaggingResponseCode() {
        return await S3.getBucketTagging(this.getCommandParameters());
    }

    async putBucketTaggingResponseCode() {
        this.addCommandParameter({
            tagging: 'TagSet=[{Key=tag1,Value=value1},{Key=tag2,Value=value2}]'
        });
        return await S3.putBucketTagging(this.getCommandParameters());
    }

    async deleteBucketTaggingResponseCode() {
        return await S3.deleteBucketTagging(this.getCommandParameters());
    }

    async getObjectLegalHoldResponseCode() {
        return await S3.getObjectLegalHold(this.getCommandParameters());
    }

    // async getObjectVersionLegalHoldResponseCode() {
    //     return await S3.getObjectLegalHold(this.getCommandParameters());
    // }

    async LegalHoldResponseCode() {
        return S3.putObjectLegalHold(this.getCommandParameters());
    }

    async getObjectTaggingResponseCode() {
        return await S3.getObjectTagging(this.getCommandParameters());
    }

    // async putObjectVersionTaggingResponseCode() {
    //     this.addCommandParameter({
    //         tagging: 'TagSet=[{Key=string,Value=string},{Key=string,Value=string}]'
    //     });
    //     return await S3.putObjectTagging(this.getCommandParameters());
    // }

    async deleteObjectVersionTaggingResponseCode() {
        return await S3.deleteObjectTagging(this.getCommandParameters());
    }

    async listObjectsV2ResponseCode() {
        return await S3.listObjectsV2(this.getCommandParameters());
    }

    async listObjectVersionsResponseCode() {
        return await S3.listObjectVersions(this.getCommandParameters());
    }

    async copyObjectResponseCode() {
        return await S3.copyObject(this.getCommandParameters());
    }

    async putObjectRetentionResponseCode() {
        return await S3.putObjectRetention(this.getCommandParameters());
    }

    // async putObjectVersionRetentionResponseCode() {
    //     return await S3.putObjectRetention(this.getCommandParameters());
    // }

    async putObjectTaggingResponseCode() {
        this.addCommandParameter({
            tagging: 'TagSet=[{Key=string,Value=string}]'
        });
        return await S3.putObjectTagging(this.getCommandParameters());
    }

    async putObjectLegalHoldTaggingResponseCode() {
        return await S3.putObjectLegalHold(this.getCommandParameters());
    }

    // async putObjectVersionLegalHoldTaggingResponseCode() {
    //     return await S3.putObjectLegalHold(this.getCommandParameters());
    // }

    async putObjectLockConfigurationResponseCode() {
        this.addCommandParameter({
            objectLockConfiguration: 'ObjectLockEnabled=Enabled,Rule=[{DefaultRetention={Mode=GOVERNANCE,Days=1}}]'
        });
        return await S3.putObjectLockConfiguration(this.getCommandParameters());
    }

    async headObjectResponseCode() {
        return await S3.headObject(this.getCommandParameters());
    }

    async deleteObjectsResponseCode() {
        this.addCommandParameter({
            delete: `Objects=[{Key=${this.saved.objectName},VersionId=${this.saved.versionId}}]`
        });
        return await S3.deleteObjects(this.getCommandParameters());
    }

    async getReplicationConfigurationResponseCode() {
        return await S3.getBucketReplication(this.getCommandParameters());
    }

    async getLifecycleConfigurationResponseCode() {
        return await S3.getBucketLifecycleConfiguration(this.getCommandParameters());
    }

    async putLifecycleConfigurationResponseCode() {
        this.addCommandParameter({
            lifecycleConfiguration: JSON.stringify(
                {
                    Rules: [
                        {
                            Filter: {
                                Prefix: "documents/"
                            },
                            Status: "Enabled",
                            Transitions: [
                                {
                                    Days: 365,
                                    StorageClass: "e2e-cold"
                                }
                            ],
                            Expiration: {
                                Days: 3650
                            },
                            ID: "ExampleRule"
                        }
                    ]
                })
        });
        return await S3.putBucketLifecycleConfiguration(this.getCommandParameters());
    }

    async putReplicationConfigurationResponseCode() {
        this.addCommandParameter({
            replicationConfiguration: JSON.stringify(
                {
                    "Role": "arn:aws:iam::123456789012:role/S3-replication-role",
                    "Rules": [
                        {
                            "Status": "Enabled",
                            "Destination": {
                                "Bucket": "arn:aws:s3:::AWSDOC-EXAMPLE-BUCKET2"
                            }
                        }
                    ]
                })
        });
        return await S3.putBucketReplication(this.getCommandParameters());
    }



    // function createPolicy(action, isAllow = true, resource = '*') {
    //     return JSON.stringify({
    //         Version: '2012-10-17',
    //         Statement: [
    //             {
    //                 Sid: 'Stmt1644586763301',
    //                 Action: [
    //                     action,
    //                 ],
    //                 Effect: (isAllow ? 'Allow' : 'Deny'),
    //                 Resource: resource,
    //             },
    //         ],
    //     });
    // }
}

setWorldConstructor(Zenko);