import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { EntityType } from "../../world/Zenko";
import { CacheHelper, ClientOptions, S3, VaultAuth } from 'cli-testing';
import { s3FunctionExtraParams } from '../../common/utils';

When('the user tries to perform {string} on the bucket', async function (action: string) {
    
    let userCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.saved.type)) {
        userCredentials = this.parameters.IAMSession;
        this.resumeRootOrIamUser();
    } else {
        userCredentials = this.parameters.AssumedSession;
        this.resumeAssumedRole();
    }
    switch (action) {
        case 'MetadataSearch': {
            this.result = await this.metadataSearchResponseCode(userCredentials, this.saved.bucketName);
            break;
        }
        case 'PutObjectVersion': {
            this.result = await this.putObjectVersionResponseCode(userCredentials, this.saved.bucketName, this.saved.objectName);
            break;
        }
        default: {
            this.resetCommand();
            this.saved.ifS3Standard = true;
            this.addCommandParameter({bucket: this.saved.bucketName});
            if (this.saved.objectName) {
                this.addCommandParameter({key: this.saved.objectName});
            }
            if (this.saved.versionId) {
                this.addCommandParameter({versionId: this.saved.versionId});
            }
            action = action.charAt(0).toLowerCase() + action.slice(1);
            const actionCall = (S3 as {[key: string]: Function})[action];
            if (actionCall) {
                if (action in s3FunctionExtraParams) {
                    this.addCommandParameter(s3FunctionExtraParams[action]);
                }
                this.result = await actionCall(this.getCommandParameters());
            } else {
                throw new Error(`Action ${action} is not supported yet`);
            }
            break;
        }
    }
});

When('the user tries to perform vault auth {string}', async function (action: string) {
    let userCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.saved.type)) {
        userCredentials = this.parameters.IAMSession;
    } else {
        userCredentials = this.parameters.AssumedSession;
    }

    if (!this.parameters.VaultAuthHost) {
        throw new Error('Vault auth endpoint is not set. Make sure the `VaultAuthHost` world parameter is defined.');
    }

    const vaultAuthClientOptions: ClientOptions = {
        AccessKey: userCredentials.AccessKeyId,
        SecretKey: userCredentials.SecretAccessKey,
        SessionToken: userCredentials.SessionToken,
        ip: this.parameters.VaultAuthHost,
        ssl: CacheHelper.parameters.ssl,
    }

    switch (action) {
        case 'GetAccountInfo':
            this.result = await VaultAuth.getAccounts(null, null, null, {}, vaultAuthClientOptions);
            break;
        default:
            throw new Error(`Action ${action} is not supported`);
    }
});

Then('the user should be able to perform successfully the {string} action', function (action : string) {
    this.cleanupEntity();
    switch (action) {
        case 'MetadataSearch': {
            assert.strictEqual(this.result?.statusCode, 200);
            break;
        }
        case 'GetAccountInfo': {
            assert.strictEqual(this.result instanceof Error, false);
            break;
        }
        default: {
            assert.strictEqual(this.result?.err, null);
        }

    }
});

Then('the user should not be able to perform the {string} action', function (action : string) {
    this.cleanupEntity();
    switch (action) {
        case 'GetAccountInfo': {
            assert.strictEqual(this.result instanceof Error, true);
            break;
        }
        default: {
            assert.strictEqual(this.result?.err, null);
        }
    }
});

Then('the user should receive {string} error', function (error : string) {
    this.cleanupEntity();
    assert.strictEqual(this.result.err.includes(error), true);
});
