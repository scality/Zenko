import { DataTable, Given, When, Then } from '@cucumber/cucumber';
import {
    CreateBucketCommand,
    DeleteBucketCommand,
    GetObjectCommand,
    PutBucketVersioningCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { IdentityEnum, Identity, S3, Utils } from 'cli-testing';
import assert from 'assert';
import Zenko from '../world/Zenko';
import { createAndRunPod, getLocationConfigs, getZenkoVersion } from 'steps/utils/kubernetes';
import { getObject, headObject, putBucketReplicationRaw } from 'steps/utils/utils';
import { safeJsonParse } from 'common/utils';
import { replicationLockTags } from 'common/hooks';
import { CRRAccountInfo } from './crrCascade';

type ReplicationOutcome = 'succeed' | 'fail' | 'never happen';

type SourceObjectReplicationMeta = {
    ReplicationStatus?: string;
    LastModified?: string;
    ETag?: string;
    ContentLength?: number;
    VersionId?: string;
    Metadata?: Record<string, string>;
};

async function getReplicationLocationConfig(world: Zenko, location: string): Promise<{
    destinationBucket: string;
    locationType: string;
    bucketMatch: boolean;
    awsS3Client: S3Client;
}> {
    const locationsConfigs = await getLocationConfigs(world);
    if (!locationsConfigs[location]) {
        throw new Error(`Unsupported replication location: '${location}'`);
    }
    return {
        destinationBucket: locationsConfigs[location].details.bucketName,
        locationType: locationsConfigs[location].type,
        bucketMatch: locationsConfigs[location].details.bucketMatch,
        awsS3Client: new S3Client({
            region: locationsConfigs[location].details.region,
            endpoint: `https://${locationsConfigs[location].details.awsEndpoint}`,
            credentials: {
                accessKeyId: locationsConfigs[location].details.credentials.accessKey,
                secretAccessKey: locationsConfigs[location].details.credentials.secretKey,
            },
            tls: false,
            maxAttempts: 1,
            forcePathStyle: true,
        }),
    };
}

async function getBucketReplicationConfig(
    this: Zenko,
    srcBucket: string,
): Promise<{ ok: true; config: Record<string, unknown> } | { ok: false; err: string }> {
    this.resetCommand();
    this.addCommandParameter({ bucket: srcBucket });
    const res = await S3.getBucketReplication(this.getCommandParameters());
    if (res.err) {
        return { ok: false, err: res.err };
    }
    const parsed = safeJsonParse<{ ReplicationConfiguration: Record<string, unknown> }>(res.stdout || '{}');
    if (!parsed.ok) {
        return { ok: false, err: 'unparseable getBucketReplication response' };
    }
    return { ok: true, config: parsed.result?.ReplicationConfiguration ?? {} };
}

function readPerBackendStatuses(
    md: Record<string, string>,
    locations: string[],
): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {};
    for (const loc of locations) {
        out[loc] = md[`${loc}-replication-status`];
    }
    return out;
}

/**
 * Poll the source object's HeadObject for replication outcome.
 *
 * - The top-level `ReplicationStatus` aggregates per-backend states (FAILED >
 *   PROCESSING/PENDING > COMPLETED in priority).
 * - When `locations` is non-empty, each backend's per-destination status (read
 *   from `Metadata['<location>-replication-status']`) must also match the
 *   expected outcome before the call returns successfully.
 */
async function pollReplicationOutcome(
    world: Zenko,
    objectName: string,
    bucketName: string,
    expected: ReplicationOutcome,
    timeoutMs: number,
    locations: string[] = [],
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 3000));
        const res = await headObject(world, objectName, bucketName);
        assert(res.stdout);
        assert.strictEqual(res.statusCode, 200, `failed to headObject, ${res.statusCode}`);
        const parsed = safeJsonParse<SourceObjectReplicationMeta>(res.stdout || '{}');
        assert(parsed.ok);
        const top = parsed.result?.ReplicationStatus;
        const perBackend = readPerBackendStatuses(parsed.result?.Metadata || {}, locations);
        const perBackendValues = Object.values(perBackend);

        switch (top) {
        case 'PENDING':
        case 'PROCESSING':
            assert.notStrictEqual(
                expected, 'never happen',
                `replication status is ${top}, but expected to never happen`,
            );
            continue;
        case 'COMPLETED':
            assert.strictEqual(
                expected, 'succeed',
                `replication is completed, but expected outcome was '${expected}'`,
            );
            if (locations.length > 0) {
                assert(
                    perBackendValues.every(s => s === 'COMPLETED'),
                    `top-level COMPLETED but per-backend statuses are ${JSON.stringify(perBackend)}`,
                );
            }
            return;
        case 'FAILED':
            assert.strictEqual(
                expected, 'fail',
                `replication is failed, but expected outcome was '${expected}'`,
            );
            return;
        case undefined:
            assert.strictEqual(
                expected, 'never happen',
                `got undefined replication status for expected outcome '${expected}'`,
            );
            return;
        default:
            throw new Error(`Unexpected replication status: ${top}`);
        }
    }
    assert.fail(`Timeout: object '${objectName}' did not reach outcome '${expected}' in time`);
}

/**
 * For CRR cascade destinations the destination bucket lives on the cascade
 * account and the S3 endpoint is the source Zenko itself. Build a
 * destination-account-aware S3 client + look up the cascade-created bucket
 * name from world state.
 */
function getCRRReplicaContext(
    world: Zenko,
    location: string,
): { destinationBucket: string; awsS3Client: S3Client } | undefined {
    const cascadeInfo = world.getSaved<Record<string, CRRAccountInfo>>('cascadeInfoByLocation');
    const cascadeBuckets = world.getSaved<Record<string, string>>('cascadeBuckets');
    if (!cascadeInfo?.[location] || !cascadeBuckets?.[location]) {
        return undefined;
    }
    const info = cascadeInfo[location];
    return {
        destinationBucket: cascadeBuckets[location],
        awsS3Client: new S3Client({
            region: 'us-east-1',
            endpoint: 'http://s3.zenko.local',
            credentials: {
                accessKeyId: info.AccessKeyId,
                secretAccessKey: info.SecretAccessKey,
                sessionToken: info.SessionToken,
            },
            tls: false,
            maxAttempts: 1,
            forcePathStyle: true,
        }),
    };
}

async function assertReplicaMatchesSource(world: Zenko, location: string): Promise<void> {
    const objectName = world.getSaved<string>('objectName');
    const bucketSource = world.getSaved<string>('bucketName');
    const crrCtx = getCRRReplicaContext(world, location);
    // CRR loopback: the cascade-created destination bucket receives the
    // object under the same key as the source — no source-bucket prefix.
    const { destinationBucket, bucketMatch, awsS3Client } = crrCtx
        ? { ...crrCtx, bucketMatch: true }
        : await getReplicationLocationConfig(world, location);

    const key = bucketMatch ? objectName : `${bucketSource}/${objectName}`;
    const replicaObj = await awsS3Client.send(new GetObjectCommand({
        Bucket: destinationBucket,
        Key: key,
    }));

    const sourceResponse = await getObject(world, objectName, bucketSource);
    assert.strictEqual(
        sourceResponse.statusCode, 200,
        `failed to getObject, ${sourceResponse.statusCode}`,
    );
    const sourceObj = safeJsonParse<SourceObjectReplicationMeta>(sourceResponse.stdout || '{}');
    assert(sourceObj.ok);
    assert.strictEqual(sourceObj.result?.ContentLength, replicaObj.ContentLength);
    const sourceETag = sourceObj.result?.ETag?.replace(/^"|"$/g, '');
    const replicaETag = replicaObj.ETag?.replace(/^"|"$/g, '');
    assert.ok(sourceETag, 'source object has no ETag');
    assert.strictEqual(sourceETag, replicaETag);
    // CRR loopback only writes the per-destination status; cloud backends
    // also stamp version-id / scal-version-id.
    if (!crrCtx) {
        // replication is at-least-once, so the stamped version id may name an
        // earlier replica than the one currently at the destination
        assert.ok(
            sourceObj.result?.Metadata?.[`${location}-version-id`],
            `source metadata has no ${location}-version-id stamp`,
        );
        assert.strictEqual(
            sourceObj.result?.VersionId,
            replicaObj.Metadata?.['scal-version-id'],
        );
        assert.strictEqual(replicaObj.Metadata?.['scal-replication-status'], 'REPLICA');
    }
    assert.strictEqual(
        sourceObj.result?.Metadata?.[`${location}-replication-status`],
        'COMPLETED',
    );
}

type RuleRow = {
    id?: string;
    prefix?: string;
    priority?: string;
    status?: string;
    location: string;
    bucket?: string;
    account?: string;
    deleteMarkerReplication?: string;
};

const DEFAULT_ROLE = 'arn:aws:iam::root:role/s3-replication-role';

function buildConfigFromRows(world: Zenko, srcBucket: string, rows: RuleRow[]): object {
    // Optional cascade state, populated by the cascade-tests' "cascade
    // replication accounts are registered" + per-location bucket steps.
    // Absent for cloud-only scenarios — in which case the function emits
    // the standard single-role config unchanged.
    const cascadeInfoByLocation = world.getSaved<Record<string, CRRAccountInfo>>('cascadeInfoByLocation');
    const cascadeRoleName = world.getSaved<string>('cascadeRoleName');
    const cascadeBuckets = world.getSaved<Record<string, string>>('cascadeBuckets');

    // V2 format whenever any rule carries a Priority; V1 otherwise.
    const isV2 = rows.some(r => r.priority !== undefined && r.priority !== '');
    // When any rule targets a CRR cascade location, emit the comma-separated
    // source,destination role — each rule's Destination.Account substitutes
    // the account-id portion of the destination role at runtime (ARSN-571).
    const hasCRR = rows.some(r => cascadeInfoByLocation?.[r.location]);
    const role = hasCRR && cascadeRoleName
        ? `${DEFAULT_ROLE},arn:aws:iam::000000000000:role/${cascadeRoleName}`
        : DEFAULT_ROLE;
    const Rules = rows.map((row, i) => {
        const crrInfo = cascadeInfoByLocation?.[row.location];
        // For CRR cascade destinations, the destination bucket was
        // pre-created on the cascade account's side; use that bucket name.
        const destBucket = crrInfo && cascadeBuckets?.[row.location]
            ? cascadeBuckets[row.location]
            : (row.bucket ?? srcBucket);
        const Destination: Record<string, unknown> = {
            Bucket: `arn:aws:s3:::${destBucket}`,
            StorageClass: row.location,
        };
        if (row.account) {
            Destination.Account = row.account;
        } else if (crrInfo) {
            Destination.Account = crrInfo.AccountId;
        }
        const rule: Record<string, unknown> = {
            ID: row.id || `rule-${i}`,
            Status: row.status || 'Enabled',
            Destination,
        };
        if (isV2) {
            rule.Filter = { Prefix: row.prefix ?? '' };
            if (row.priority !== undefined && row.priority !== '') {
                rule.Priority = Number(row.priority);
            }
        } else {
            rule.Prefix = row.prefix ?? '';
        }
        if (row.deleteMarkerReplication) {
            rule.DeleteMarkerReplication = { Status: row.deleteMarkerReplication };
        }
        return rule;
    });
    return { Role: role, Rules };
}

When('the job to replicate existing objects with status {string} is executed',
    { timeout: 600000 },
    async function (
        this: Zenko,
        sourceObjectStatus: string,
    ) {
        const sourceBucket = this.getSaved<string>('bucketName');
        const replicationLocation = this.getSaved<string[]>('replicationLocations')[0];
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

Given('a deleted destination bucket on that location', async function (this: Zenko) {
    const replicationLocation = this.getSaved<string[]>('replicationLocations')[0];
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
        await getReplicationLocationConfig(this, this.getSaved<string[]>('replicationLocations')[0]);
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

Given('CRR replication accounts are registered', function (this: Zenko) {
    const roleName = process.env.CRR_ROLE_NAME;
    assert.ok(roleName, 'CRR_ROLE_NAME must be set');

    const locationNames = [
        process.env.CRR_LOCATION_A_NAME,
        process.env.CRR_LOCATION_B_NAME,
        process.env.CRR_LOCATION_C_NAME,
    ];
    assert.ok(locationNames.every(Boolean), 'CRR_LOCATION_A/B/C_NAME must be set');

    const infoByLocation: Record<string, CRRAccountInfo> = {};
    for (const [i, loc] of locationNames.entries()) {
        const varName = `CRR_INFO_${['A', 'B', 'C'][i]}`;
        const raw = process.env[varName];
        assert.ok(raw, `${varName} must be set`);
        const info = JSON.parse(raw) as CRRAccountInfo;
        Identity.addIdentity(IdentityEnum.ACCOUNT, loc!, {
            accessKeyId: info.AccessKeyId,
            secretAccessKey: info.SecretAccessKey,
            sessionToken: info.SessionToken,
        });
        infoByLocation[loc!] = info;
    }

    this.addToSaved('cascadeInfoByLocation', infoByLocation);
    this.addToSaved('cascadeRoleName', roleName);
    this.addToSaved('cascadeBuckets', {} as Record<string, string>);
});

Given(/^an? (valid|invalid) multi-destination replication configuration with rules:$/,
    async function (this: Zenko, validity: 'valid' | 'invalid', dataTable: DataTable) {
        const rows = dataTable.hashes() as RuleRow[];
        const srcBucket = this.getSaved<string>('bucketName');
        const config = buildConfigFromRows(this, srcBucket, rows);
        this.addToSaved('lastReplicationConfig', config);
        const res = await putBucketReplicationRaw.call(this, srcBucket, config);
        if (validity === 'valid') {
            assert(!res.err, `expected putBucketReplication to succeed, got: ${res.err}`);
            const enabled = new Set<string>();
            for (const r of rows) {
                if ((r.status || 'Enabled') !== 'Enabled') continue;
                for (const loc of r.location.split(',').map(s => s.trim())) {
                    enabled.add(loc);
                }
            }
            this.addToSaved('replicationLocations', Array.from(enabled));
        } else {
            this.addToSaved('lastPutReplicationError', res.err || '');
        }
    });

Given('a legacy comma-StorageClass replication configuration to locations {string}',
    async function (this: Zenko, locationsCsv: string) {
        const srcBucket = this.getSaved<string>('bucketName');
        const locations = locationsCsv.split(',').map(s => s.trim());
        this.addToSaved('replicationLocations', locations);
        const config = {
            Role: DEFAULT_ROLE,
            Rules: [{
                ID: 'legacy-multi',
                Prefix: '',
                Status: 'Enabled',
                Destination: {
                    Bucket: `arn:aws:s3:::${srcBucket}`,
                    StorageClass: locationsCsv,
                },
            }],
        };
        this.addToSaved('lastReplicationConfig', config);
        const res = await putBucketReplicationRaw.call(this, srcBucket, config);
        assert(!res.err, `expected putBucketReplication to succeed, got: ${res.err}`);
    });

Then('the replication configuration request should be rejected with {string}',
    function (this: Zenko, errorCode: string) {
        const err = this.getSaved<string>('lastPutReplicationError') ?? '';
        assert(
            err.includes(errorCode),
            `expected putBucketReplication error to contain '${errorCode}', got: ${err}`,
        );
    });

Then('the object replication should {string} within {int} seconds',
    { timeout: 600_000 },
    async function (this: Zenko, expectedOutcome: 'succeed' | 'fail' | 'never happen', timeoutSec: number) {
        const objectName = this.getSaved<string>('objectName');
        const srcBucket = this.getSaved<string>('bucketName');
        const locations = this.getSaved<string[]>('replicationLocations') || [];
        assert(locations.length > 0, 'no replicationLocations saved on the scenario world');
        await pollReplicationOutcome(
            this,
            objectName,
            srcBucket,
            expectedOutcome,
            timeoutSec * 1000,
            locations,
        );
    });

Then('the replicated object on {string} should match the source',
    async function (this: Zenko, location: string) {
        await assertReplicaMatchesSource(this, location);
    });

Then('the replicated object should match the source on every configured destination',
    async function (this: Zenko) {
        const locations = this.getSaved<string[]>('replicationLocations') || [];
        assert(locations.length > 0, 'no replicationLocations saved on the scenario world');
        for (const location of locations) {
            await assertReplicaMatchesSource(this, location);
        }
    });

Then('the object should not be replicated to {string}',
    async function (this: Zenko, location: string) {
        // Caller is expected to have first waited for the enabled destinations
        // to complete, so backbeat has had its chance. We then assert that the
        // disabled destination has no per-backend metadata stamp at all.
        const objectName = this.getSaved<string>('objectName');
        const srcBucket = this.getSaved<string>('bucketName');
        const res = await headObject(this, objectName, srcBucket);
        assert.strictEqual(res.statusCode, 200, `failed to headObject, ${res.statusCode}`);
        const parsed = safeJsonParse<SourceObjectReplicationMeta>(res.stdout || '{}');
        assert(parsed.ok);
        const status = parsed.result?.Metadata?.[`${location}-replication-status`];
        assert.strictEqual(
            status, undefined,
            `object was unexpectedly replicated to '${location}', status=${status}`,
        );
    });

Then('getBucketReplication should return a {string} configuration with {int} rules',
    async function (this: Zenko, format: string, expectedCount: number) {
        const srcBucket = this.getSaved<string>('bucketName');
        const result = await getBucketReplicationConfig.call(this, srcBucket);
        assert(result.ok, 'getBucketReplication failed');
        if (!result.ok) return;
        const rules = (result.config.Rules as Array<Record<string, unknown>>) ?? [];
        assert.strictEqual(
            rules.length, expectedCount,
            `expected ${expectedCount} rule(s), got ${rules.length}`,
        );
        for (const rule of rules) {
            if (format === 'V2') {
                assert(
                    rule.Filter !== undefined,
                    `expected V2 rule to have Filter: ${JSON.stringify(rule)}`,
                );
                assert(
                    rule.Prefix === undefined,
                    `V2 rule should not carry top-level Prefix: ${JSON.stringify(rule)}`,
                );
            } else if (format === 'V1') {
                assert(
                    rule.Prefix !== undefined,
                    `expected V1 rule to have top-level Prefix: ${JSON.stringify(rule)}`,
                );
                assert(
                    rule.Filter === undefined,
                    `V1 rule should not have Filter: ${JSON.stringify(rule)}`,
                );
            } else {
                assert.fail(`unsupported format '${format}', expected 'V1' or 'V2'`);
            }
        }
    });

Then('getBucketReplication rule {int} should have StorageClass {string}',
    async function (this: Zenko, ruleIndex: number, expectedStorageClass: string) {
        const srcBucket = this.getSaved<string>('bucketName');
        const result = await getBucketReplicationConfig.call(this, srcBucket);
        assert(result.ok, 'getBucketReplication failed');
        if (!result.ok) return;
        const rules = (result.config.Rules as Array<{ Destination?: { StorageClass?: string } }>) ?? [];
        assert.strictEqual(rules[ruleIndex]?.Destination?.StorageClass, expectedStorageClass);
    });
