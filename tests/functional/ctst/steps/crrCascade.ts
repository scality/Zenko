import { Given, Then, When } from '@cucumber/cucumber';
import {
    CreateBucketCommand,
    GetObjectTaggingCommand,
    HeadObjectCommand,
    PutBucketReplicationCommand,
    PutBucketVersioningCommand,
    PutObjectCommand,
    PutObjectTaggingCommand,
    StorageClass,
} from '@aws-sdk/client-s3';
import assert from 'assert';
import { Identity, IdentityEnum, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';

const STEP_TIMEOUT_MS = 300_000;

export interface CRRAccountInfo {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken?: string;
    AccountId: string;
}

Given('a versioned bucket exists in location {string}', async function (this: Zenko, location: string) {
    const bucket = `cascade-${Utils.randomString().toLowerCase()}`;
    Identity.useIdentity(IdentityEnum.ACCOUNT, location);
    // Persist the identity so the default After-hook cleanup targets the
    // same account that owns the buckets created here (and by later steps).
    this.addToSaved('accountName', location);
    const client = this.createS3Client();
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    await client.send(new PutBucketVersioningCommand({
        Bucket: bucket,
        VersioningConfiguration: { Status: 'Enabled' },
    }));
    const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');
    cascadeBuckets[location] = bucket;
});

Given(
    'replication is configured from location {string} to {string}',
    async function (this: Zenko, srcLocation: string, dstLocation: string) {
        const infoByLocation = this.getSaved<Record<string, CRRAccountInfo>>('cascadeInfoByLocation');
        const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');
        const roleName = this.getSaved<string>('cascadeRoleName');
        const role = [
            'arn:aws:iam::root:role/s3-replication-role',
            `arn:aws:iam::${infoByLocation[dstLocation].AccountId}:role/${roleName}`,
        ].join(',');

        Identity.useIdentity(IdentityEnum.ACCOUNT, srcLocation);
        await this.createS3Client().send(new PutBucketReplicationCommand({
            Bucket: cascadeBuckets[srcLocation],
            ReplicationConfiguration: {
                Role: role,
                Rules: [{
                    Status: 'Enabled',
                    Prefix: '',
                    Destination: {
                        Bucket: `arn:aws:s3:::${cascadeBuckets[dstLocation]}`,
                        StorageClass: dstLocation as StorageClass,
                    },
                }],
            },
        }));
    },
);

async function putCascadeObject(
    client: ReturnType<Zenko['createS3Client']>,
    bucket: string,
    key: string,
    bodySize = 0,
): Promise<string> {
    const marker = Utils.randomString().toLowerCase();
    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bodySize > 0 ? Buffer.alloc(bodySize) : new Uint8Array(0),
        Metadata: { marker },
    }));
    return marker;
}

When('an object {string} of {int} bytes is put in location {string}',
    async function (this: Zenko, objectName: string, bodySize: number, location: string) {
        const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');
        Identity.useIdentity(IdentityEnum.ACCOUNT, location);
        const marker = await putCascadeObject(this.createS3Client(), cascadeBuckets[location], objectName, bodySize);
        this.addToSaved('cascadeObjectName', objectName);
        this.addToSaved('cascadeSourceLocation', location);
        this.addToSaved('cascadeLastMarker', marker);
        this.addToSaved('cascadeExpectedContentLength', bodySize);
    });

When('tags are put on the object {string} in location {string}',
    async function (this: Zenko, objectName: string, location: string) {
        const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');
        const tagValue = Utils.randomString().toLowerCase();
        Identity.useIdentity(IdentityEnum.ACCOUNT, location);
        await this.createS3Client().send(new PutObjectTaggingCommand({
            Bucket: cascadeBuckets[location],
            Key: objectName,
            Tagging: { TagSet: [{ Key: 'cascade-test-tag', Value: tagValue }] },
        }));
        this.addToSaved('cascadeTagValue', tagValue);
    });

Then(
    'the object at location {string} should have the expected tags within {int} seconds',
    { timeout: STEP_TIMEOUT_MS },
    async function (this: Zenko, location: string, timeoutSeconds: number) {
        assert.ok(
            timeoutSeconds * 1000 < STEP_TIMEOUT_MS,
            `budget of ${timeoutSeconds}s exceeds the step timeout of ${STEP_TIMEOUT_MS / 1000}s`,
        );
        const bucket = this.getSaved<Record<string, string>>('cascadeBuckets')[location];
        const objectName = this.getSaved<string>('cascadeObjectName');
        const tagValue = this.getSaved<string>('cascadeTagValue');
        const deadline = Date.now() + timeoutSeconds * 1000;
        Identity.useIdentity(IdentityEnum.ACCOUNT, location);
        const client = this.createS3Client();
        while (Date.now() < deadline) {
            const res = await client.send(
                new GetObjectTaggingCommand({ Bucket: bucket, Key: objectName }),
            );
            const found = res.TagSet?.some(
                tag => tag.Key === 'cascade-test-tag' && tag.Value === tagValue,
            );
            if (found) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        assert.fail(
            `Timeout: tag 'cascade-test-tag=${tagValue}' not found at '${location}' after ${timeoutSeconds}s`,
        );
    },
);

Then(
    'the object should replicate to location {string} within {int} seconds',
    { timeout: STEP_TIMEOUT_MS },
    async function (this: Zenko, location: string, timeoutSeconds: number) {
        assert.ok(
            timeoutSeconds * 1000 < STEP_TIMEOUT_MS,
            `budget of ${timeoutSeconds}s exceeds the step timeout of ${STEP_TIMEOUT_MS / 1000}s`,
        );
        const bucket = this.getSaved<Record<string, string>>('cascadeBuckets')[location];
        const objectName = this.getSaved<string>('cascadeObjectName');
        const deadline = Date.now() + timeoutSeconds * 1000;
        Identity.useIdentity(IdentityEnum.ACCOUNT, location);
        const client = this.createS3Client();
        const expectedContentLength = this.getSaved<number>('cascadeExpectedContentLength');
        while (Date.now() < deadline) {
            try {
                const res = await client.send(
                    new HeadObjectCommand({ Bucket: bucket, Key: objectName }),
                );
                if (res.ReplicationStatus === 'PENDING') {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                assert.strictEqual(
                    res.ReplicationStatus, 'REPLICA',
                    `Expected ReplicationStatus to be REPLICA at '${location}', got '${res.ReplicationStatus}'`,
                );
                assert.strictEqual(
                    res.ContentLength, expectedContentLength,
                    `Expected ContentLength ${expectedContentLength} at '${location}', got ${res.ContentLength}`,
                );
                return;
            } catch (err: unknown) {
                const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
                if (status !== 404) {
                    throw err;
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        assert.fail(`Timeout: object '${objectName}' not found in bucket '${bucket}' after ${timeoutSeconds}s`);
    },
);

Then(
    'the object at location {string} should never have replication status PENDING within {int} seconds',
    { timeout: 120_000 },
    async function (this: Zenko, location: string, waitSeconds: number) {
        const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');
        const objectName = this.getSaved<string>('cascadeObjectName');
        const bucket = cascadeBuckets[location];
        const deadline = Date.now() + waitSeconds * 1000;
        Identity.useIdentity(IdentityEnum.ACCOUNT, location);
        const client = this.createS3Client();
        while (Date.now() < deadline) {
            const result = await client.send(
                new HeadObjectCommand({ Bucket: bucket, Key: objectName }),
            );
            assert.notStrictEqual(
                result.ReplicationStatus,
                'PENDING',
                `Object at '${location}' was found with ReplicationStatus=PENDING, ` +
                'indicating the cascade loop wrote back to the source.',
            );
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    },
);

Then(
    'the cascade replication states should be settled',
    { timeout: 30_000 },
    async function (this: Zenko) {
        const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');
        const objectName = this.getSaved<string>('cascadeObjectName');
        const sourceLocation = this.getSaved<string>('cascadeSourceLocation');

        for (const [location, bucket] of Object.entries(cascadeBuckets)) {
            Identity.useIdentity(IdentityEnum.ACCOUNT, location);
            const res = await this.createS3Client().send(
                new HeadObjectCommand({ Bucket: bucket, Key: objectName }),
            );

            const expectedStatus = location === sourceLocation ? 'COMPLETED' : 'REPLICA';
            assert.strictEqual(
                res.ReplicationStatus,
                expectedStatus,
                `Expected ReplicationStatus '${expectedStatus}' at '${location}', got '${res.ReplicationStatus}'`,
            );

            const pendingBackends = Object.entries(res.Metadata ?? {})
                .filter(([key, value]) => key.endsWith('-replication-status') && value === 'PENDING');
            assert.strictEqual(
                pendingBackends.length, 0,
                `Location '${location}' still has PENDING backends after settling: ${
                    pendingBackends.map(([k, v]) => `${k}=${v}`).join(', ')
                }`,
            );
        }
    },
);

When('the object {string} is concurrently written {int} times to every cascade location',
    async function (this: Zenko, objectName: string, writesPerLocation: number) {
        const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');

        const clientByLocation = Object.fromEntries(
            Object.keys(cascadeBuckets).map(location => {
                Identity.useIdentity(IdentityEnum.ACCOUNT, location);
                return [location, this.createS3Client()];
            }),
        );

        const writtenMarkers = new Set<string>();
        await Promise.all(
            Object.entries(cascadeBuckets).flatMap(([location, bucket]) =>
                Array.from({ length: writesPerLocation }, async () => {
                    const marker = await putCascadeObject(clientByLocation[location], bucket, objectName);
                    writtenMarkers.add(marker);
                }),
            ),
        );

        this.addToSaved('cascadeObjectName', objectName);
        this.addToSaved('cascadeWrittenMarkers', [...writtenMarkers]);
    });

Then(
    'all cascade locations should converge to the same metadata marker within {int} seconds',
    { timeout: 600_000 },
    async function (this: Zenko, timeoutSeconds: number) {
        const cascadeBuckets = this.getSaved<Record<string, string>>('cascadeBuckets');
        const objectName = this.getSaved<string>('cascadeObjectName');
        const writtenMarkers = new Set(this.getSaved<string[]>('cascadeWrittenMarkers') ?? []);
        const deadline = Date.now() + timeoutSeconds * 1000;
        const clientByLocation = Object.fromEntries(
            Object.keys(cascadeBuckets).map(location => {
                Identity.useIdentity(IdentityEnum.ACCOUNT, location);
                return [location, this.createS3Client()];
            }),
        );

        while (Date.now() < deadline) {
            const markers: string[] = [];
            for (const [location, bucket] of Object.entries(cascadeBuckets)) {
                try {
                    const res = await clientByLocation[location].send(
                        new HeadObjectCommand({ Bucket: bucket, Key: objectName }),
                    );
                    if (res.Metadata?.marker) {
                        markers.push(res.Metadata.marker);
                    }
                } catch (err: unknown) {
                    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
                    if (status !== 404) {
                        throw err;
                    }
                }
            }
            const uniqueMarkers = new Set(markers);
            if (markers.length === Object.keys(cascadeBuckets).length && uniqueMarkers.size === 1) {
                const convergedMarker = [...uniqueMarkers][0];
                assert(
                    writtenMarkers.has(convergedMarker),
                    `Converged marker '${convergedMarker}' was not written by this test`,
                );
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        assert.fail(`Cascade locations did not converge to the same marker within ${timeoutSeconds}s`);
    },
);
