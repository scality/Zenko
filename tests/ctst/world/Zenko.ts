import { setWorldConstructor, World } from '@cucumber/cucumber';
import { 
    CacheHelper,
    cliModeObject,
} from 'cli-testing';

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

    private saved: object = {};

    private forceFailed = false;

    private cliMode : cliModeObject = CacheHelper.createCliModeObject();

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
                AccessKeyId:  this.parameters.AccountAccessKey,
                SecretAccessKey: this.parameters.AccountSecretKey,
                SessionToken: this.parameters.AccountSessionToken,
            }
            this.cliMode.parameters.AssumedSession = CacheHelper.ARWWI[CacheHelper.AccountName];
            this.cliMode.assumed = true;
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
     * Utility function to prepare Zenko
     * @param {object} parameters - the client-provided parameters
     * @returns {undefined}
     */
    static async init(parameters: any) {}

    /**
     * Cleanup function for the Zenko world
     * @returns {undefined}
     */
    static async teardown() {}
}

setWorldConstructor(Zenko);
