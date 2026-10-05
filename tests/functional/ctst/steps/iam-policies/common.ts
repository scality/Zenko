import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko, { Command } from '../../world/Zenko';
import { CacheHelper, Identity } from 'cli-testing';
import { VaultAuthClient } from 'clients/vault';
import { runActionAgainstBucket } from 'steps/utils/utils';

When('the user tries to perform {string} on the bucket', async function (this: Zenko, action: string) {
    await runActionAgainstBucket(this, action);
});

When('the user tries to perform vault auth {string}', async function (this: Zenko, action: string) {
    const lastIdentity = this.getSavedIdentity();
    const userCredentials = Identity.getCredentialsForIdentity(
        lastIdentity.identityType,
        lastIdentity.identityName,
        lastIdentity.accountName,
    );

    if (!userCredentials) {
        throw new Error('User credentials not set. '
            + 'Make sure the `IAMSession` and `AssumedSession` world parameter are defined.');
    }

    if (!this.parameters.VaultAuthHost) {
        throw new Error('Vault auth endpoint is not set. Make sure the `VaultAuthHost` world parameter is defined.');
    }

    // Follows the HTTPS switch of the current scenario, set on cli-testing's parameters
    const https = Boolean(CacheHelper.parameters?.ssl);
    const vaultAuthClient = new VaultAuthClient({
        host: this.parameters.VaultAuthHost,
        port: https ? 443 : 80,
        https,
        credentials: userCredentials,
    });

    switch (action) {
    case 'GetAccountInfo':
        try {
            this.setResult(await vaultAuthClient.getAccountsByName([
                lastIdentity.accountName || this.parameters.AccountName,
            ]) as Command);
        } catch (err) {
            this.setResult(err as Command);
        }
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
    default: {
        assert.strictEqual(this.getResult().err, null);
    }
    }
});

Then('the user should receive {string} error', function (this: Zenko, error : string) {
    assert.strictEqual(this.getResult().err!.includes(error), true);
});
