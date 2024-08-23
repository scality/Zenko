import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from '../../world/Zenko';
import { CacheHelper, ClientOptions, Command, Identity, IdentityEnum, VaultAuth } from 'cli-testing';
import { runActionAgainstBucket } from 'steps/utils/utils';

When('the user tries to perform {string} on the bucket', async function (this: Zenko, action: string) {
    await runActionAgainstBucket(this, action);
});

When('the user tries to perform vault auth {string}', async function (this: Zenko, action: string) {
    const userCredentials = Identity.getCredentialsForIdentity(
        this.getSaved<IdentityEnum>('identityTypeForScenario'),
        this.getSaved<string>('identityNameForScenario'),
        this.getSaved<string>('accountNameForScenario'),
    );

    if (!userCredentials) {
        throw new Error('User credentials not set. '
            + 'Make sure the `IAMSession` and `AssumedSession` world parameter are defined.');
    }

    if (!this.parameters.VaultAuthHost) {
        throw new Error('Vault auth endpoint is not set. Make sure the `VaultAuthHost` world parameter is defined.');
    }

    const vaultAuthClientOptions: ClientOptions = {
        AccessKey: userCredentials.accessKeyId,
        SecretKey: userCredentials.secretAccessKey,
        SessionToken: userCredentials.sessionToken,
        ip: this.parameters.VaultAuthHost,
        ssl: CacheHelper.parameters ? CacheHelper.parameters.ssl as boolean : undefined,
    };

    switch (action) {
    case 'GetAccountInfo':
        this.setResult(await VaultAuth.getAccounts(null, null, null, {}, vaultAuthClientOptions) as Command);
        break;
    default:
        throw new Error(`Action ${action} is not supported`);
    }
});

Then('the user should be able to perform successfully the {string} action', function (this: Zenko, action: string) {
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
    switch (action) {
    case 'GetAccountInfo': {
        assert.strictEqual(this.getResult().code === 'AccessDenied', true);
        break;
    }
    case 'PutObject': {
        assert.strictEqual(this.getResult().code === 'AccessDenied', true);
        break;
    }
    default: {
        assert.strictEqual(this.getResult().err, null);
    }
    }
});

Then('the user should receive {string} error', function (this: Zenko, error: string) {
    assert.strictEqual(this.getResult().err!.includes(error), true);
});
