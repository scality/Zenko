import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko, { ApiResult, EntityType } from '../../world/Zenko';
import { CacheHelper, ClientOptions, VaultAuth } from 'cli-testing';
import { runActionAgainstBucket } from 'steps/utils/utils';

When('the user tries to perform {string} on the bucket', async function (this: Zenko, action: string) {
    await runActionAgainstBucket(this, action);
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
