import { Then } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import { S3 } from 'cli-testing';
import { ListObjectsV2Output, ListObjectVersionsOutput } from '@aws-sdk/client-s3';
import { safeJsonParse } from 'common/utils';

Then('no collision should occur on versionId', async function (this: Zenko) {
    const bucketName = this.getSaved<string>('bucketName');
    const results = await S3.listObjectsV2({
        bucket: bucketName,
        maxItems: '1000',
    });
    const res = safeJsonParse<ListObjectsV2Output>(results.stdout);

    if (!res.ok) {
        throw new Error(`Failed to list objects in bucket ${bucketName}: ${res.error}`);
    }
    
    const versionsProcessed = new Set<string>();
    
    for (const object of res.result?.Contents || []) {
        if (!object.Key) {
            throw new Error(`Object in bucket ${bucketName} has no Key: ${JSON.stringify(object)}`);
        }

        const versions = await S3.listObjectVersions({
            bucket: bucketName,
            prefix: object.Key,
        });
        const versionsRes = safeJsonParse<ListObjectVersionsOutput>(versions.stdout);

        if (!versionsRes.ok) {
            throw new Error(
                `Failed to list versions for object ${object.Key} in bucket ${bucketName}: ${versionsRes.error}`
            );
        }

        for (const version of versionsRes.result?.Versions || []) {
            if (!version.VersionId) {
                throw new Error(`Version in bucket ${bucketName} has no VersionId: ${JSON.stringify(version)}`);
            }

            if (versionsProcessed.has(version.VersionId)) {
                throw new Error(
                    `Duplicate versionId found: ${version.VersionId} for object ${object.Key} in bucket ${bucketName}`
                );
            }

            versionsProcessed.add(version.VersionId);
        }
    }
});
