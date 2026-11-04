import { Given, Then, When } from '@cucumber/cucumber';
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BackbeatRoutesClient, GetMetadataCommand, PutMetadataCommand } from '@scality/cloudserverclient';
import { Identity } from 'cli-testing';
import assert from 'assert';
import Zenko from 'world/Zenko';
import constants from 'common/constants';
import { DEFAULT_ROLE, pollReplicationOutcome, runCrrExistingObjectsJob } from './replication';

// Steps for the s3utils crrExistingObjects.js scenarios: run the job for one
// site or on a cascade location, check that a requeue leaves the other
// backends of the object untouched, and that the script writes what
// cloudserver writes (ZENKO-5391, S3UTILS-256, S3UTILS-257).

const JOB_STEP_TIMEOUT_MS = 600_000;
const REPLICATION_STEP_TIMEOUT_MS = 600_000;

type Backend = {
    site: string;
    status: string;
    dataStoreVersionId?: string;
    destination?: string;
    role?: string;
};

type ReplicationInfo = {
    status?: string;
    backends?: Backend[];
    content?: string[];
    role?: string;
    destination?: string;
    storageClass?: string;
    storageType?: string;
    dataStoreVersionId?: string;
    isNFS?: boolean | null;
    isReplica?: boolean;
};

type ObjectMD = {
    'content-length'?: number;
    replicationInfo?: ReplicationInfo;
    [key: string]: unknown;
};

function createBackbeatRoutesClient(world: Zenko): BackbeatRoutesClient {
    const credentials = Identity.getCurrentCredentials();
    const protocol = world.parameters.ssl === false ? 'http' : 'https';
    const subdomain = world.parameters.subdomain || constants.DEFAULT_SUBDOMAIN;
    return new BackbeatRoutesClient({
        region: 'us-east-1',
        endpoint: `${protocol}://s3.${subdomain}`,
        credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
        },
    });
}

async function getLatestVersionId(world: Zenko, bucket: string, key: string): Promise<string | undefined> {
    const res = await world.createS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return res.VersionId;
}

/**
 * Raw object metadata of the latest version, through the backbeat route
 * crrExistingObjects itself uses. Runs as the current identity.
 */
async function getObjectMD(world: Zenko, bucket: string, key: string): Promise<{ md: ObjectMD; versionId?: string }> {
    const versionId = await getLatestVersionId(world, bucket, key);
    const res = await createBackbeatRoutesClient(world).send(new GetMetadataCommand({
        Bucket: bucket,
        Key: key,
        VersionId: versionId,
    }));
    assert(res.Body, `empty metadata for '${bucket}/${key}'`);
    return { md: JSON.parse(res.Body) as ObjectMD, versionId };
}

async function putObjectMD(world: Zenko, bucket: string, key: string, versionId: string | undefined, md: ObjectMD) {
    await createBackbeatRoutesClient(world).send(new PutMetadataCommand({
        Bucket: bucket,
        Key: key,
        VersionId: versionId,
        Body: Buffer.from(JSON.stringify(md)),
    }));
}

function findBackend(info: ReplicationInfo | undefined, site: string): Backend | undefined {
    return info?.backends?.find(b => b.site === site);
}

/**
 * What a reader can see of the written format, without the values that
 * depend on the object or on when it was replicated (status,
 * dataStoreVersionId). Two objects of the same size, in the same bucket,
 * must give the same view.
 */
function writtenFormat(info: ReplicationInfo | undefined) {
    const legacyTopLevel = ['destination', 'storageClass', 'storageType', 'dataStoreVersionId'] as const;
    return {
        role: info?.role,
        isReplica: !!info?.isReplica,
        isNFS: !!info?.isNFS,
        // cloudserver writes ['DATA', 'METADATA'], s3utils ['METADATA', 'DATA']: same meaning
        content: (info?.content ?? []).filter(c => c === 'DATA' || c === 'METADATA').sort(),
        legacyTopLevelFields: legacyTopLevel.filter(field => info?.[field]),
        backends: (info?.backends ?? [])
            .map(b => ({ site: b.site, destination: b.destination, role: b.role }))
            .sort((a, b) => a.site.localeCompare(b.site)),
    };
}

function getCascadeBucket(world: Zenko, location: string): string {
    const bucket = world.getSaved<Record<string, string>>('cascadeBuckets')?.[location];
    assert(bucket, `no cascade bucket in location '${location}'`);
    return bucket;
}

When('the job to replicate existing objects with status {string} is executed for site {string}',
    { timeout: JOB_STEP_TIMEOUT_MS },
    async function (this: Zenko, targetStatus: string, siteName: string) {
        await runCrrExistingObjectsJob(this, {
            bucket: this.getSaved<string>('bucketName'),
            accountName: this.getSaved<string>('accountName') || this.parameters.AccountName,
            targetStatus,
            siteName,
        });
    });

When('the job to replicate existing objects with status {string} is executed on location {string} for site {string}',
    { timeout: JOB_STEP_TIMEOUT_MS },
    async function (this: Zenko, targetStatus: string, location: string, siteName: string) {
        await runCrrExistingObjectsJob(this, {
            bucket: getCascadeBucket(this, location),
            accountName: location,
            targetStatus,
            siteName,
        });
    });

When('the replication info of the object is saved', async function (this: Zenko) {
    const { md } = await getObjectMD(this, this.getSaved<string>('bucketName'), this.getSaved<string>('objectName'));
    this.addToSaved('savedReplicationInfo', md.replicationInfo);
});

// Rewrites the object metadata the way cloudserver/backbeat wrote it before
// Zenko 2.16 (S3C 9.5 format): top-level destination/role/storageClass/
// storageType, backends with site/status/dataStoreVersionId only.
Given('the object replication info is rewritten in the pre-2.16 format with status {string}',
    async function (this: Zenko, status: string) {
        const bucket = this.getSaved<string>('bucketName');
        const objectName = this.getSaved<string>('objectName');
        const locations = this.getSaved<string[]>('replicationLocations');
        assert.strictEqual(locations?.length, 1, 'the pre-2.16 format has one destination bucket');
        const site = locations[0];

        const { md, versionId } = await getObjectMD(this, bucket, objectName);
        const current = md.replicationInfo;
        md.replicationInfo = {
            status,
            backends: [{
                site,
                status,
                dataStoreVersionId: status === 'COMPLETED'
                    ? (findBackend(current, site)?.dataStoreVersionId ?? '') : '',
            }],
            content: current?.content ?? ['DATA', 'METADATA'],
            destination: `arn:aws:s3:::${bucket}`,
            storageClass: site,
            role: DEFAULT_ROLE,
            // type of the AWS test locations, as cloudserver wrote it
            storageType: 'aws_s3',
            dataStoreVersionId: '',
            isNFS: null,
        };
        await putObjectMD(this, bucket, objectName, versionId, md);
    });

Then('the object replication info should match what cloudserver writes for a new object',
    { timeout: REPLICATION_STEP_TIMEOUT_MS },
    async function (this: Zenko) {
        const bucket = this.getSaved<string>('bucketName');
        const objectName = this.getSaved<string>('objectName');
        const locations = this.getSaved<string[]>('replicationLocations');
        const { md } = await getObjectMD(this, bucket, objectName);

        // Same bucket, same rules, same size: only the writer differs.
        const referenceName = `${objectName}-reference`;
        await this.createS3Client().send(new PutObjectCommand({
            Bucket: bucket,
            Key: referenceName,
            Body: Buffer.alloc(md['content-length'] ?? 0),
        }));
        await pollReplicationOutcome(this, referenceName, bucket, 'succeed', 300_000, locations);
        const { md: referenceMD } = await getObjectMD(this, bucket, referenceName);

        assert.deepStrictEqual(
            writtenFormat(md.replicationInfo),
            writtenFormat(referenceMD.replicationInfo),
            'replicationInfo written by crrExistingObjects differs from the one cloudserver writes on a PUT.\n'
            + `crrExistingObjects: ${JSON.stringify(md.replicationInfo)}\n`
            + `cloudserver: ${JSON.stringify(referenceMD.replicationInfo)}`,
        );
    });

Then('the {string} backend of the object should be unchanged', async function (this: Zenko, site: string) {
    const saved = findBackend(this.getSaved<ReplicationInfo>('savedReplicationInfo'), site);
    assert(saved, `no '${site}' backend saved before the job`);
    const { md } = await getObjectMD(this, this.getSaved<string>('bucketName'), this.getSaved<string>('objectName'));
    const current = findBackend(md.replicationInfo, site);
    assert.deepStrictEqual(
        { status: current?.status, dataStoreVersionId: current?.dataStoreVersionId },
        { status: saved.status, dataStoreVersionId: saved.dataStoreVersionId },
        `'${site}' backend changed: before ${JSON.stringify(saved)}, after ${JSON.stringify(current)}`,
    );
});
