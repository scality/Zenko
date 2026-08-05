import { Then, When } from '@cucumber/cucumber';
import { S3, Utils } from 'cli-testing';
import { ListObjectVersionsOutput } from '@aws-sdk/client-s3';
import assert from 'assert';
import Zenko from 'world/Zenko';
import { safeJsonParse } from 'common/utils';
import { addExpirationWorkflow } from './utils/utils';

When('i set a lifecycle expiration of {int} days for the {string}',
    async function (this: Zenko, days: number, scope: string) {
        const includeNoncurrent: Record<string, boolean> = {
            'current version': false,
            'current and noncurrent versions': true,
        };
        assert(scope in includeNoncurrent, `Unknown expiration scope "${scope}"`);
        await addExpirationWorkflow.call(this, days, includeNoncurrent[scope]);
    });

Then('the bucket should contain {int} objects within {int} seconds', { timeout: 150 * 1000 },
    async function (this: Zenko, expectedCount: number, seconds: number) {
        const bucketName = this.getSaved<string>('bucketName');
        const deadline = Date.now() + seconds * 1000;
        let count = -1;
        do {
            const res = await S3.listObjectVersions({ bucket: bucketName, maxItems: '1000' });
            const parsed = safeJsonParse<ListObjectVersionsOutput>(res.stdout || '{}');
            assert.ok(parsed.ok, `Failed to list versions in bucket ${bucketName}: ${parsed.error}`);
            const versions = parsed.result?.Versions ?? [];
            const deleteMarkers = parsed.result?.DeleteMarkers ?? [];
            count = versions.length + deleteMarkers.length;
            if (count === expectedCount) {
                return;
            }
            await Utils.sleep(2000);
        } while (Date.now() < deadline);
        assert.fail(
            `Bucket ${bucketName} has ${count} versions/delete markers, ` +
            `expected ${expectedCount} after ${seconds}s`);
    });
