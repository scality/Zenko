import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko, { ApiResult, EntityType, UserCredentials } from '../../world/Zenko';
import { CacheHelper, ClientOptions, S3, VaultAuth } from 'cli-testing';
import { s3FunctionExtraParams } from '../../common/utils';

When('the user tries to perform {string} on the bucket', async function (this: Zenko, action: string) {
    let userCredentials: UserCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.getSaved<EntityType>('type'))) {
        userCredentials = this.parameters.IAMSession;
        this.resumeRootOrIamUser();
    } else {
        userCredentials = this.parameters.AssumedSession!;
        this.resumeAssumedRole();
    }
    switch (action) {
    case 'MetadataSearch': {
        this.setResult(await this.metadataSearchResponseCode(userCredentials, this.getSaved<string>('bucketName')));
        break;
    }
    case 'PutObjectVersion': {
        this.setResult(await this.putObjectVersionResponseCode(userCredentials,
            this.getSaved<string>('bucketName'), this.getSaved<string>('objectName')));
        break;
    }
    default: {
        this.resetCommand();
        this.addToSaved('ifS3Standard', true);
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        if (this.getSaved<string>('objectName')) {
            this.addCommandParameter({ key: this.getSaved<string>('objectName') });
        }
        if (this.getSaved<string>('versionId')) {
            this.addCommandParameter({ versionId: this.getSaved<string>('versionId') });
        }
        const usedAction = action.charAt(0).toLowerCase() + action.slice(1);
        const actionCall = S3[usedAction];
        if (actionCall) {
            if (usedAction in s3FunctionExtraParams) {
                this.addCommandParameter(s3FunctionExtraParams[usedAction]);
            }
            this.setResult(await actionCall(this.getCommandParameters()));
        } else {
            throw new Error(`Action ${usedAction} is not supported yet`);
        }
        break;
    }
    }
});

When('the user tries to perform vault auth {string}', async function (this: Zenko, action: string) {
    let userCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.getSaved<EntityType>('type'))) {
        userCredentials = this.parameters.IAMSession;
    } else {
        userCredentials = this.parameters.AssumedSession!;
    }

    if (!this.parameters.VaultAuthHost) {
        throw new Error('Vault auth endpoint is not set. Make sure the `VaultAuthHost` world parameter is defined.');
    }

    const vaultAuthClientOptions: ClientOptions = {
        AccessKey: userCredentials.AccessKeyId,
        SecretKey: userCredentials.SecretAccessKey,
        SessionToken: userCredentials.SessionToken,
        ip: this.parameters.VaultAuthHost,
        ssl: CacheHelper.parameters ? CacheHelper.parameters.ssl as boolean : undefined,
    };

    switch (action) {
    case 'GetAccountInfo':
        this.setResult(await VaultAuth.getAccounts(null, null, null, {}, vaultAuthClientOptions) as ApiResult);
        break;
    default:
        throw new Error(`Action ${action} is not supported`);
    }
});

Then('the user should be able to perform successfully the {string} action', function (this: Zenko, action: string) {
    this.cleanupEntity();
    switch (action) {
    case 'MetadataSearch': {
        assert.strictEqual(this.getResult().statusCode, 200);
        break;
    }
    case 'GetAccountInfo': {
        assert.strictEqual(this.getResult() instanceof Error, false);
        break;
    }
    default: {
        assert.strictEqual(this.getResult().err, null);
    }

    }
});

Then('the user should not be able to perform the {string} action', function (this: Zenko, action : string) {
    this.cleanupEntity();
    switch (action) {
    case 'GetAccountInfo': {
        assert.strictEqual(this.getResult() instanceof Error, true);
        break;
    }
    default: {
        assert.strictEqual(this.getResult().err, null);
    }
    }
});

Then('the user should receive {string} error', function (this: Zenko, error : string) {
    this.cleanupEntity();
    assert.strictEqual(this.getResult().err!.includes(error), true);
});
