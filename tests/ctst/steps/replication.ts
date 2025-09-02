import { Given, When, Then } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { createAndRunPod, getZenkoVersion } from 'steps/utils/kubernetes';
import assert from 'assert';
import { IdentityEnum, Identity, Utils } from 'cli-testing';
import { 
    GetObjectCommand,
    DeleteBucketCommand,
    CreateBucketCommand,
    PutBucketVersioningCommand
} from '@aws-sdk/client-s3';
import { getObject, headObject, getReplicationLocationConfig } from 'steps/utils/utils';
import { safeJsonParse } from 'common/utils';
import { replicationLockTags } from 'common/hooks';

When('the job to replicate existing objects with status {string} is executed',
    { timeout: 600000 },
    async function (
        this: Zenko,
        sourceObjectStatus: string,
    ) {
        const sourceBucket = this.getSaved<string>('bucketName');
        const replicationLocation = this.getSaved<string>('replicationLocation');
        const { locationType } = await getReplicationLocationConfig(this, replicationLocation);
        const zenkoVersion = await getZenkoVersion(this);
        const s3utilsVersion = zenkoVersion.spec.versions.s3utils;
        const credentials = Identity.getCredentialsForIdentity(
            IdentityEnum.ACCOUNT,
            this.parameters.AccountName
        );
        const podManifest = {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
                name: `s3utils-crr-existing-${Utils.randomString().toLowerCase()}`,
                namespace: 'default',
                labels: {
                    app: 's3utils',
                    script: 'crrExistingObjects.js'
                }
            },
            spec: {
                restartPolicy: 'Never',
                containers: [
                    {
                        name: 's3utils',
                        image: `${s3utilsVersion.image}:${s3utilsVersion.tag}`,
                        command: ['node'],
                        args: ['crrExistingObjects.js', sourceBucket],
                        env: [
                            { name: 'ACCESS_KEY', value: credentials?.accessKeyId },
                            { name: 'SECRET_KEY', value: credentials?.secretAccessKey },
                            { name: 'ENDPOINT', value: `http://s3.${credentials?.subDomain}` },
                            { name: 'STORAGE_TYPE', value: locationType },
                            { name: 'TARGET_REPLICATION_STATUS', value: sourceObjectStatus },
                            { name: 'SITE_NAME', value: replicationLocation },
                        ]
                    }
                ]
            }
        };
        
        await createAndRunPod(this, podManifest);
    });

Then('the object should eventually {string} replicated', { timeout: 360_000 },
    async function (this: Zenko, replicate: 'be' | 'fail to be') {
        const objectName = this.getSaved<string>('objectName');
        const bucketSource = this.getSaved<string>('bucketName');
        const startTime = Date.now();
        const replicationTimeoutMs = 300_000;
        while (Date.now() - startTime < replicationTimeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const response = await headObject(this, objectName, bucketSource);
            assert(response.stdout);
            assert.strictEqual(response.statusCode, 200, `failed to headobject, ${response.statusCode}`);
            const parsed = safeJsonParse<{
                ReplicationStatus?: string;
                LastModified?: string;
                ETag?: string;
                ContentLength?: number;
                VersionId?: string;
                Metadata?: Record<string, string>;
            }>(response.stdout || '{}');
            assert(parsed.ok);
            const replicationStatus = parsed.result?.ReplicationStatus;
            
            if (replicate === 'be') {
                assert.notStrictEqual(replicationStatus, 'FAILED', `replication failed for object ${objectName}`);
                if (replicationStatus === 'COMPLETED') {
                    return;
                }
            } else if (replicate === 'fail to be') {
                assert.notStrictEqual(
                    replicationStatus,
                    'COMPLETED',
                    `expected replication to fail for object ${objectName}`
                );
                if (replicationStatus === 'FAILED') {
                    return;
                }
            }
            if (replicationStatus === 'PENDING' || replicationStatus === 'PROCESSING') {
                continue;
            }
        }
        assert.fail(`Timeout: Object '${objectName}' is still pending/processing after timeout`);
    });

Then(
    'the replicated object should be the same as the source object',
    async function (
        this: Zenko,
    ) {
        const objectName = this.getSaved<string>('objectName');
        const bucketSource = this.getSaved<string>('bucketName');
        const replicationLocation = this.getSaved<string>('replicationLocation');
        const { destinationBucket, bucketMatch, awsS3Client } = 
            await getReplicationLocationConfig(this, replicationLocation);
        
        // When bucketMatch is disabled on the destination bucket,
        // replicated objects are named sourceBucket/objectName
        let key = `${bucketSource}/${objectName}`;
        if (bucketMatch) {
            key = objectName;
        }
        
        const command = new GetObjectCommand({
            Bucket: destinationBucket,
            Key: key, 
        });
        const replicaObj = await awsS3Client.send(command);
        const sourceResponse = await getObject(this, objectName, bucketSource);
        assert.strictEqual(sourceResponse.statusCode, 200, `failed to getObject, ${sourceResponse.statusCode}`);
        const sourceObj = safeJsonParse<{
            ReplicationStatus?: string;
            LastModified?: string;
            ETag?: string;
            ContentLength?: number;
            VersionId?: string;
            Metadata?: Record<string, string>;
        }>(sourceResponse.stdout || '{}');
        assert(sourceObj.ok);

        assert.strictEqual(sourceObj.result?.ReplicationStatus, 'COMPLETED');
        assert.strictEqual(
            sourceObj.result?.ContentLength,
            replicaObj.ContentLength
        );
        assert.strictEqual(
            sourceObj.result?.Metadata?.[`${replicationLocation}-version-id`],
            replicaObj.VersionId
        );
        assert.strictEqual(
            sourceObj.result?.Metadata?.[`${replicationLocation}-replication-status`],
            'COMPLETED'
        );
        assert.strictEqual(
            sourceObj.result?.VersionId,
            replicaObj.Metadata?.['scal-version-id']
        );
        assert.strictEqual(
            replicaObj.Metadata?.['scal-replication-status'],
            'REPLICA'
        );
    });

Given('a deleted destination bucket on that location', async function (this: Zenko) {
    const replicationLocation = this.getSaved<string>('replicationLocation');
    const scenarioTags = this.getSaved<string[]>('scenarioTags') || [];
    const lockTag = `@Lock${replicationLocation}`;
    const hasTestLock = scenarioTags.includes(lockTag);
    assert.strictEqual(
        hasTestLock, true,
        'This step can only be run when the tag @Lock$replicationLocation is configured'
    );
    assert.strictEqual(
        true, replicationLockTags.includes(lockTag),
        `The tag ${lockTag} must be added to the replicationLockTags array in common/hooks.ts`
    );

    const { destinationBucket, awsS3Client } =
        await getReplicationLocationConfig(this, replicationLocation);
    const command = new DeleteBucketCommand({
        Bucket: destinationBucket,
    });
    await awsS3Client.send(command);
});

When('the destination bucket on the location is created again', async function (this: Zenko) {
    const { destinationBucket, awsS3Client } = 
        await getReplicationLocationConfig(this, this.getSaved<string>('replicationLocation'));
    const command = new CreateBucketCommand({
        Bucket: destinationBucket,
    });
    await awsS3Client.send(command);
    const versioningCommand = new PutBucketVersioningCommand({
        Bucket: destinationBucket,
        VersioningConfiguration: {
            Status: 'Enabled',
        },
    });
    await awsS3Client.send(versioningCommand);
});
