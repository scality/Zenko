import { Then, When } from '@cucumber/cucumber';
import assert from 'assert';
import Zenko from 'world/Zenko';
import { sleep } from 'common/utils';
import { addExpirationWorkflow, listAllObjectVersions } from './utils/utils';

When('i set a lifecycle expiration of {int} days for the {string}',
    async function (this: Zenko, days: number, scope: string) {
        const includeNoncurrent: Record<string, boolean> = {
            'current version': false,
            'current and noncurrent versions': true,
        };
        assert(scope in includeNoncurrent, `Unknown expiration scope "${scope}"`);
        await addExpirationWorkflow.call(this, days, includeNoncurrent[scope]);
    });

Then('the bucket should contain {int} objects within {int} seconds', { timeout: 6 * 60 * 1000 },
    async function (this: Zenko, expectedCount: number, seconds: number) {
        const bucketName = this.getSaved<string>('bucketName');
        const deadline = Date.now() + seconds * 1000;
        let count = -1;
        do {
            const { versions, deleteMarkers } = await listAllObjectVersions(this, bucketName);
            count = versions.length + deleteMarkers.length;
            if (count === expectedCount) {
                return;
            }
            await sleep(2000);
        } while (Date.now() < deadline);
        assert.fail(
            `Bucket ${bucketName} has ${count} versions/delete markers, ` +
            `expected ${expectedCount} after ${seconds}s`);
    });
