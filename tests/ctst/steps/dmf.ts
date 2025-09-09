import { Then, Given, After } from '@cucumber/cucumber';
import assert from 'assert';
import Zenko from 'world/Zenko';
import { execInCluster } from './utils/kubernetes';
import { Utils } from 'cli-testing';

/**
 * Clean up S3 alias files for this specific bucket
 * @param world - The Zenko world object
 * @param bucketName - The name of the bucket to clean up
 * @returns void
 */
async function cleanDmfVolumeForBucket(world: Zenko, bucketName: string) {
    if (!bucketName) {
        return;
    }

    const commands = [
        `find /cold-data/data/s3-aliases -name "${bucketName}-*" -type f -delete 2>/dev/null || true`,
        `find /cold-data/data/s3-aliases -name "${bucketName}-*" -type d -empty -delete 2>/dev/null || true`
    ];

    for (const command of commands) {
        await execInCluster(world, command);
    }
}

/**
 * Check if the DMF volume contains the expected number of objects.
 * This requires sorbet mock backend with UseS3Naming=true.
 * Files are stored as: /cold-data/data/s3-aliases/{bucket}-{key}-{versionId}/content
 * This enables parallel test execution by providing bucket-level isolation
 * @param this - The Zenko world object
 * @param objectCount - The expected number of objects
 * @returns void
 */
Then('dmf volume should contain {int} objects',
    { timeout: 2 * 60 * 1000 }, async function (this: Zenko, objectCount: number) {
        const bucketName = this.getSaved<string>('bucketName');
        if (!bucketName) {
            throw new Error('bucketName not found in test context. Ensure bucket is created before this step.');
        }

        let conditionOk = false;
        let attempts = 0;
        const maxAttempts = 60;

        while (!conditionOk && attempts < maxAttempts) {
            try {
                const outStr = await execInCluster(
                    this,
                    `find /cold-data/data/s3-aliases -name "${bucketName}-*" -type f | wc -l`
                );
                const fileCount = Number(outStr.trim());

                // We expect 2 files per object (content + manifest.json)
                const expectedFileCount = objectCount * 2;
                conditionOk = fileCount === expectedFileCount;

                if (!conditionOk) {
                    this.logger.debug(`DMF volume check for bucket ${bucketName}`, {
                        expected: expectedFileCount,
                        found: fileCount,
                        attempt: attempts + 1,
                        maxAttempts
                    });

                    if (attempts % 10 === 0) {
                        const filesFound = await execInCluster(
                            this,
                            `find /cold-data/data/s3-aliases -name "${bucketName}-*" -type f 2>/dev/null`
                        );
                        this.logger.debug(`Files found for bucket ${bucketName}:`, { files: filesFound });
                    }

                    await Utils.sleep(2000);
                    attempts++;
                }
            } catch (error) {
                this.logger.error('Error checking DMF volume', { error, bucket: bucketName });
                throw error;
            }
        }

        if (!conditionOk) {
            const finalCount = await execInCluster(
                this,
                `find /cold-data/data/s3-aliases -name "${bucketName}-*" -type f | wc -l`
            );
            const actualFiles = await execInCluster(
                this,
                `find /cold-data/data/s3-aliases -name "${bucketName}-*" -type f 2>/dev/null`
            );

            assert.fail(
                `DMF volume should contain ${objectCount * 2} files for bucket ${bucketName}, ` +
                `but found ${finalCount.trim()} after ${attempts} attempts. ` +
                `Files found: ${actualFiles}`
            );
        }

        this.logger.debug(`DMF volume check passed for bucket ${bucketName}`, {
            expectedObjects: objectCount,
            foundFiles: objectCount * 2,
            attempts,
            maxAttempts,
        });
    });

Given('a flaky backend that will require {int} retries for {string}',
    function (this: Zenko, retryNumber: number, op: string) {
        assert(['restore', 'archive', 'command'].includes(op), `Invalid operation ${op}`);
        assert(retryNumber > 0, `Invalid retry number ${retryNumber}`);

        this.addToSaved('backendFlakinessRetryNumber', retryNumber);
        this.addToSaved('backendFlakiness', op);
    });

After({ tags: '@Dmf' }, async function (this: Zenko, results) {
    const bucketName = this.getSaved<string>('bucketName');

    if (results.result?.status === 'FAILED') {
        this.logger.warn('DMF volume was not cleaned for failed test', {
            bucket: bucketName,
            reason: 'test failed - keeping files for debugging'
        });
        return;
    }

    await cleanDmfVolumeForBucket(this, bucketName);
    this.logger.debug(`Cleaned DMF volume for bucket: ${bucketName}`);
});
