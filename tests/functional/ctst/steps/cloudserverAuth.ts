import { Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from 'world/Zenko';

Then('it {string} pass Vault authentication', function (this: Zenko, should: string) {
    const outcome = this.getS3Outcome<{ Errors?: unknown[] }>();
    if (should === 'should') {
        assert.ok(outcome.ok, outcome.ok ? '' : outcome.error.message);
        if (outcome.ok) {
            assert.ok(!outcome.data.Errors?.length, 'Expected no S3 errors in response');
        }
    } else {
        if (!outcome.ok) return;
        assert.ok(outcome.data.Errors?.length, 'Expected S3-level errors or auth failure');
    }
});
