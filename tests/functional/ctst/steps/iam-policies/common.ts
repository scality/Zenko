import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from '../../world/Zenko';
import { ApiError, failedWith, settle } from 'common/result';
import { Identity } from 'cli-testing';
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

    const { https } = this;
    const vaultAuthClient = new VaultAuthClient({
        host: this.parameters.VaultAuthHost,
        port: https ? 443 : 80,
        https,
        credentials: userCredentials,
    });

    switch (action) {
    case 'GetAccountInfo':
        this.setResult(await settle(vaultAuthClient.getAccountsByName([
            lastIdentity.accountName || this.parameters.AccountName,
        ])));
        break;
    default:
        throw new Error(`Action ${action} is not supported`);
    }
});

Then('the user should be able to perform successfully the {string} action', function (this: Zenko, action: string) {
    const { error } = this.getResult();
    assert(!error, `${action} failed: ${error}`);
});

Then('the user should not be able to perform the {string} action', function (this: Zenko, action : string) {
    const { error } = this.getResult();
    switch (action) {
    case 'GetAccountInfo': {
        // Vault errors carry their name in `code`
        assert.strictEqual((error as ApiError & { code?: string } | undefined)?.code, 'AccessDenied');
        break;
    }
    default: {
        assert.ifError(error);
    }
    }
});

Then('the user should receive {string} error', function (this: Zenko, error : string) {
    assert.strictEqual(failedWith(this.getResult(), error), true);
});
