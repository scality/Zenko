import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { AccessKey } from '@aws-sdk/client-iam';
import { Credentials } from '@aws-sdk/client-sts';
import { aws4Interceptor } from 'aws4-axios';
import qs from 'qs';
import Werelogs from 'werelogs';
import {
    CacheHelper,
    ClientOptions,
    Command,
    Constants,
    IAM,
    Identity,
    IdentityEnum,
    STS,
    SuperAdmin,
    Utils,
    AWSCredentials,
    Logger,
} from 'cli-testing';

import { extractPropertyFromResults } from '../common/utils';
import ZenkoDrctl from 'steps/dr/drctl';
import assert from 'assert';


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
    KafkaHosts: string;
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
    InstanceID: string;
    BackbeatApiHost: string;
    BackbeatApiPort: string;
    KafkaCleanerInterval: string;
}

/**
 * Cucumber custom World implementation to support Zenko.
 * This World is responsible for AWS CLI calls.
 * Shared between all tests (S3, IAM, STS).
 */
export default class Zenko extends World<ZenkoWorldParameters> {
    private result: Command = {
        err: '',
        stdout: '',
        stderr: '',
    };

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

    static readonly PRIMARY_SITE_NAME = 'admin';
    static readonly SECONDARY_SITE_NAME = 'dradmin';

    /**
     * @constructor
     * @param {Object} options - parameters provided as a CLI parameter when running the tests
     */
    constructor(options: IWorldOptions<ZenkoWorldParameters>) {
        super(options);
        Logger.createLogger(this);
        // store service users credentials from world parameters
        if (this.parameters.ServiceUsersCredentials) {
            const serviceUserCredentials =
                JSON.parse(this.parameters.ServiceUsersCredentials) as Record<string, ServiceUsersCredentials>;
            for (const serviceUserName in serviceUserCredentials) {
                if (!Identity.hasIdentity(IdentityEnum.SERVICE_USER, serviceUserName, this.parameters.AccountName)) {
                    Identity.addIdentity(IdentityEnum.SERVICE_USER, serviceUserName, {
                        accessKeyId: serviceUserCredentials[serviceUserName].accessKey,
                        secretAccessKey: serviceUserCredentials[serviceUserName].secretKey,
                    }, this.parameters.AccountName);
                }
            }
        }

        // Workaround to be able to access global parameters in BeforeAll/AfterAll hooks
        CacheHelper.cacheParameters({
            ...this.parameters,
        });

        if (this.parameters.AccountName && !Identity.hasIdentity(IdentityEnum.ACCOUNT, this.parameters.AccountName)) {
            Identity.addIdentity(IdentityEnum.ACCOUNT, this.parameters.AccountName, {
                accessKeyId: this.parameters.AccountAccessKey,
                secretAccessKey: this.parameters.AccountSecretKey,
            });
        }

        if (this.parameters.AccountName) {
            Identity.useIdentity(IdentityEnum.ACCOUNT, this.parameters.AccountName);
            Identity.defaultAccountName = this.parameters.AccountName;
        }

        if (this.parameters.AdminAccessKey && this.parameters.AdminSecretKey &&
            !Identity.hasIdentity(IdentityEnum.ADMIN, Zenko.PRIMARY_SITE_NAME)) {
            Identity.addIdentity(IdentityEnum.ADMIN, Zenko.PRIMARY_SITE_NAME, {
                accessKeyId: this.parameters.AdminAccessKey,
                secretAccessKey: this.parameters.AdminSecretKey,
            }, undefined, undefined, undefined, this.parameters.subdomain);

            Zenko.sites['source'] = {
                accountName: this.parameters.AccountName.concat(Utils.randomString()),
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
                accountName: `dr${this.parameters.AccountName}`.concat(Utils.randomString()),
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

    /**
     * This function will dynamically determine if the result from the AWS command
     * is a success or a failure. Based on the fact that AWS either return an empty string
     * or a JSON-parsable string.
     * @param {Array} result - array with result objects containing both stderr and stdout from the CLI command.
     * @returns {boolean} - if the result is a success or a failure
     */
    checkResults(result: Command[]): boolean {
        const usedResult: Command[] = Array.isArray(result) ? result : [result];
        let decision = true;
        usedResult.forEach(res => {
            if (!res || res.err) {
                decision = false;
            }
            try {
                // Accept empty responses (in case of success)
                if (res.stdout && res.stdout !== '') {
                    JSON.parse(res.stdout) as Command;
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
        const accountName = this.getSaved<string>('accountName') || Identity.getCurrentAccountName();
        const key = `${accountName}_${ARWWIName}`;
        this.logger.debug('preparing ARWWI', {
            accountName,
            key,
        });

        if (!Identity.hasIdentity(IdentityEnum.ASSUMED_ROLE, key, accountName)) {
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
            const ARWWI = await STS.assumeRoleWithWebIdentity({
                roleArn,
                webIdentityToken,
            });
            this.logger.debug('Assumed role with web identity', ARWWI);
            this.addToSaved('identityArn', extractPropertyFromResults(ARWWI, 'AssumedRoleUser', 'Arn'));

            const extractedCredentials = extractPropertyFromResults<Credentials>(ARWWI, 'Credentials');

            if (!extractedCredentials) {
                throw new Error('Error when trying to assume role with web identity: no credential');
            }

            Identity.addIdentity(IdentityEnum.ASSUMED_ROLE, key, {
                accessKeyId: extractedCredentials.AccessKeyId!,
                secretAccessKey: extractedCredentials.SecretAccessKey!,
                sessionToken: extractedCredentials.SessionToken,
            }, accountName, true);
        } else {
            Identity.useIdentity(IdentityEnum.ASSUMED_ROLE, key, accountName);
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

    async createAccount(name?: string, force?: boolean, adminClientName?: string) {
        Identity.resetIdentity();
        const accountName = name || this.getSaved<string>('accountName') ||
            `${Constants.ACCOUNT_NAME}${Utils.randomString()}`;
        if (Identity.hasIdentity(IdentityEnum.ACCOUNT, accountName) && !force) {
            Identity.useIdentity(IdentityEnum.ACCOUNT, accountName);
            return;
        }

        if (adminClientName && Identity.hasIdentity(IdentityEnum.ADMIN, adminClientName)) {
            Identity.useIdentity(IdentityEnum.ADMIN, adminClientName);
        }

        await SuperAdmin.createAccount({ accountName });
        const credentials = await SuperAdmin.generateAccountAccessKey({ accountName });
        Identity.addIdentity(IdentityEnum.ACCOUNT, accountName, credentials, undefined, true, true);

        // Save the identity
        this.saveIdentityInformation(accountName, IdentityEnum.ACCOUNT, accountName);
    }

    /**
     * Creates an assumed role session with a duration of 12 hours.
     * @param {boolean} crossAccount - If true, the role will be assumed cross account.
     * @returns {undefined}
     */
    async prepareAssumeRole(crossAccount = false) {
        Identity.resetIdentity();

        // Getting default account ID
        const accountName = Identity.getCurrentAccountName();

        // Creating a role to assume
        const roleName = `${accountName}${Constants.ROLE_NAME_TEST}${Utils.randomString()}`;
        this.addToSaved('roleName', roleName);
        this.addCommandParameter({ roleName });
        this.addCommandParameter({ assumeRolePolicyDocument: Constants.assumeRoleTrustPolicy });
        const roleArnToAssume =
            extractPropertyFromResults(await IAM.createRole(
                this.getCommandParameters()), 'Role', 'Arn');

        let accountToBeAssumedFrom = accountName;

        if (crossAccount) {
            // Creating a second account if its Cross-Account AssumeRole
            const account2 = await SuperAdmin.createAccount({
                accountName: `${Constants.ACCOUNT_NAME}${Utils.randomString()}`,
            });

            // Creating credentials for the second account
            const account2Credentials = await SuperAdmin.generateAccountAccessKey({
                accountName: account2.account.name,
            });

            Identity.addIdentity(IdentityEnum.ACCOUNT, account2.account.name, account2Credentials, undefined, true);

            accountToBeAssumedFrom = account2.account.name;
        }

        // Creating a user in the account to be assumed from
        this.resetCommand();
        const userName = `${accountToBeAssumedFrom}${Constants.USER_NAME_TEST}${Utils.randomString()}`;
        this.addCommandParameter({ userName });
        await IAM.createUser(this.getCommandParameters());

        // Creating a policy to allow it to AssumeRole
        this.resetCommand();
        this.addCommandParameter({
            policyName: `${accountToBeAssumedFrom}` +
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
        const userCredentials = extractPropertyFromResults<AccessKey>(
            await IAM.createAccessKey(this.getCommandParameters()), 'AccessKey');
        if (!userCredentials) {
            throw new Error('Error when trying to create access key for user');
        }
        const extractedCredentials: AWSCredentials = {
            accessKeyId: userCredentials.AccessKeyId!,
            secretAccessKey: userCredentials.SecretAccessKey!,
        };
        Identity.addIdentity(IdentityEnum.IAM_USER, userName, extractedCredentials,
            Identity.getCurrentAccountName(), true);

        // Assuming the role
        this.resetCommand();
        this.addCommandParameter({ roleArn: roleArnToAssume });
        const res = extractPropertyFromResults<Credentials>(await STS.assumeRole(
            this.getCommandParameters()), 'Credentials');

        if (!res) {
            throw new Error('Error when trying to assume role');
        }

        Identity.addIdentity(IdentityEnum.ASSUMED_ROLE, roleName, {
            accessKeyId: res.AccessKeyId!,
            secretAccessKey: res.SecretAccessKey!,
            sessionToken: res.SessionToken,
        }, Identity.getCurrentAccountName(), true);

        // Save the identity
        this.addToSaved('identityArn', roleArnToAssume);
        this.saveIdentityInformation(roleName, IdentityEnum.ASSUMED_ROLE, Identity.getCurrentAccountName());
    }

    /**
     * Creates an assumed role session as service user with a duration of 12 hours.
     * @Param {string} serviceUserName - The name of the service user to be used,
     * @Param {string} roleName - the role name to assume.
     * @Param {string} internal - if true, target role is attached to an internal account
     * @returns {undefined}
     */
    async prepareServiceUser(serviceUserName: string, roleName: string, internal = false) {
        Identity.resetIdentity();

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

        // Assign the credentials of the service user to the IAM session.
        Identity.useIdentity(IdentityEnum.SERVICE_USER, serviceUserName, Identity.defaultAccountName);

        // Assuming the role as the service user
        this.resetCommand();
        this.addCommandParameter({ roleArn: roleArnToAssume });
        const assumeRoleRes = await STS.assumeRole(this.getCommandParameters());
        if (assumeRoleRes.err) {
            throw new Error(`Error when trying to assume role ${roleArnToAssume} as service user ${serviceUserName}.
            ${assumeRoleRes.err}`);
        }

        // Assign the assumed session credentials to the Assumed session.
        const res = extractPropertyFromResults<Credentials>(assumeRoleRes, 'Credentials');

        if (!res) {
            throw new Error(`Error when trying to assume role ${roleArnToAssume} as service user ${serviceUserName}`);
        }

        Identity.addIdentity(IdentityEnum.ASSUMED_ROLE, roleName, {
            accessKeyId: res.AccessKeyId!,
            secretAccessKey: res.SecretAccessKey!,
            sessionToken: res.SessionToken,
        }, Identity.getCurrentAccountName(), true);

        // Save the identity
        this.saveIdentityInformation(roleName, IdentityEnum.ASSUMED_ROLE, Identity.getCurrentAccountName());
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

            if (!Identity.hasIdentity(IdentityEnum.ACCOUNT, accountName)) {
                Identity.useIdentity(IdentityEnum.ADMIN, site.adminIdentityName);

                let account = null;
                CacheHelper.logger.debug('Creating account', {
                    accountName,
                    adminIdentityName: site.adminIdentityName,
                    credentials: Identity.getCurrentCredentials(),
                });
                // Create the account if already exist will not throw any error
                try {
                    await SuperAdmin.createAccount({ accountName });
                /* eslint-disable */
                } catch (err: any) {
                    CacheHelper.logger.debug('Error while creating account', {
                        accountName,
                        err,
                    });
                    if (!err.EntityAlreadyExists && err.code !== 'EntityAlreadyExists') {
                        throw err;
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
                const accountAccessKeys = Identity.getCredentialsForIdentity(
                    IdentityEnum.ACCOUNT, accountName) || {
                    accessKeyId: '',
                    secretAccessKey: '',
                };

                if (!accountAccessKeys.accessKeyId || !accountAccessKeys.secretAccessKey) {
                    const accessKeys = await SuperAdmin.generateAccountAccessKey({ accountName });
                    if (!Utils.isAccessKeys(accessKeys)) {
                        throw new Error('Failed to generate account access keys for site ${siteKey}');
                    }
                    accountAccessKeys.accessKeyId = accessKeys.accessKeyId;
                    accountAccessKeys.secretAccessKey = accessKeys.secretAccessKey;
                }

                CacheHelper.logger.debug('Adding account identity', {
                    accountName,
                    accountAccessKeys,
                });
                Identity.addIdentity(IdentityEnum.ACCOUNT, accountName, accountAccessKeys, undefined, true, true);
            }
        }
        // Fallback to the primary site's account at the end of the init by default
        Identity.useIdentity(IdentityEnum.ACCOUNT, this.sites['source']?.accountName
            || CacheHelper.parameters.AccountName!);
    }

    /**
     * Creates an IAM user with policy and access keys to be used in the tests.
     * The IAM user is cached for future tests to reduce the overall test suite
     * duration.
     * @returns {undefined}
     */
    async prepareIamUser() {
        const userName = `iamusertest${Utils.randomString()}`;
        Identity.resetIdentity();
        this.addToSaved('userName', userName);
        // Create IAM user
        this.addCommandParameter({ userName });
        const userInfos = await IAM.createUser(this.getCommandParameters());
        this.resetCommand();
        // Create credentials for the user
        this.addCommandParameter({ userName });
        const result = await IAM.createAccessKey(this.getCommandParameters());
        const credentials = extractPropertyFromResults<AccessKey>(result, 'AccessKey');

        if (!credentials) {
            throw new Error('Error when trying to create access key for user');
        }

        Identity.addIdentity(IdentityEnum.IAM_USER, userName, {
            accessKeyId: credentials.AccessKeyId!,
            secretAccessKey: credentials.SecretAccessKey!,
        }, Identity.getCurrentAccountName(), true);

        this.resetCommand();
        this.addToSaved('identityArn', extractPropertyFromResults(userInfos, 'User', 'Arn'));
        this.saveIdentityInformation(userName, IdentityEnum.IAM_USER, Identity.getCurrentAccountName());
    }

    saveIdentityInformation(name: string, identity: IdentityEnum, accountName: string) {
        this.addToSaved('identityNameForScenario', name);
        this.addToSaved('identityTypeForScenario', identity);
        this.addToSaved('accountNameForScenario', accountName);
    }

    useSavedIdentity() {
        Identity.useIdentity(
            this.getSaved<IdentityEnum>('identityTypeForScenario'),
            this.getSaved<string>('identityNameForScenario'),
            this.getSaved<string>('accountNameForScenario'),
        );
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

    /**
     * Get all saved result object
     * @returns {Command} - an object with saved API call results
     */
    public getResult(): Command {
        return this.result;
    }

    /**
     * Get all saved result object
     * @param {Command} result - an object with API call results
     * @returns {undefined}
     */
    public setResult(result: Command): void {
        this.result = result;
    }

    /**
     * Cleanup function for the Zenko world
     * @returns {undefined}
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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
        userCredentials: AWSCredentials, headers: object = {}, payload: object = {}) : Promise<Command> {
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
            return {
                stdout: '',
                statusCode: response.status,
                data: response.data as unknown,
            };
        /* eslint-disable */
        } catch (err: any) {
            return {
                stdout: '',
                statusCode: err.response.status,
                err: err.response.data,
            };
            /* eslint-enable */
        }
    }

    /**
     * 
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
        payload: object = {}
    ): Promise<{ statusCode: number; data: object } | { statusCode: number; err: unknown }> {
        const token = await this.getWebIdentityToken(
            this.parameters.KeycloakUsername || 'zenko-end2end',
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
            return { statusCode: response.status, data: response.data as object };
            /* eslint-disable */
        } catch (err: any) {
            return {
                statusCode: err.response.status,
                err: err.response.data,
            };
            /* eslint-enable */
        }
    }

    async deleteLocation(this: Zenko, locationName: string) :
        Promise<{ statusCode: number; data: object } | { statusCode: number; err: unknown }> {
        return await this.managementAPIRequest('DELETE',
            `/config/${this.parameters.InstanceID}/location/${locationName}`);
    }
}

setWorldConstructor(Zenko);
