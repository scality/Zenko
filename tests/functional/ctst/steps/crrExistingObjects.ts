import { Then, When } from '@cucumber/cucumber';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { BackbeatRoutesClient, GetMetadataCommand } from '@scality/cloudserverclient';
import { Identity } from 'cli-testing';
import assert from 'assert';
import Zenko from 'world/Zenko';
import constants from 'common/constants';
import { runCrrExistingObjectsJob } from './replication';

// Steps for the s3utils crrExistingObjects.js scenarios: run the job for one
// site or on a cascade location, and check that a requeue leaves the other
// backends of the object untouched (ZENKO-5391, S3UTILS-256).

const JOB_STEP_TIMEOUT_MS = 600_000;

type Backend = {
    site: string;
    status: string;
    dataStoreVersionId?: string;
};

type ReplicationInfo = {
    backends?: Backend[];
};

type ObjectMD = {
    replicationInfo?: ReplicationInfo;
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
async function getObjectMD(world: Zenko, bucket: string, key: string): Promise<ObjectMD> {
    const versionId = await getLatestVersionId(world, bucket, key);
    const res = await createBackbeatRoutesClient(world).send(new GetMetadataCommand({
        Bucket: bucket,
        Key: key,
        VersionId: versionId,
    }));
    assert(res.Body, `empty metadata for '${bucket}/${key}'`);
    return JSON.parse(res.Body) as ObjectMD;
}

function findBackend(info: ReplicationInfo | undefined, site: string): Backend | undefined {
    return info?.backends?.find(b => b.site === site);
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
    const md = await getObjectMD(this, this.getSaved<string>('bucketName'), this.getSaved<string>('objectName'));
    this.addToSaved('savedReplicationInfo', md.replicationInfo);
});

Then('the {string} backend of the object should be unchanged', async function (this: Zenko, site: string) {
    const saved = findBackend(this.getSaved<ReplicationInfo>('savedReplicationInfo'), site);
    assert(saved, `no '${site}' backend saved before the job`);
    const md = await getObjectMD(this, this.getSaved<string>('bucketName'), this.getSaved<string>('objectName'));
    const current = findBackend(md.replicationInfo, site);
    assert.deepStrictEqual(
        { status: current?.status, dataStoreVersionId: current?.dataStoreVersionId },
        { status: saved.status, dataStoreVersionId: saved.dataStoreVersionId },
        `'${site}' backend changed: before ${JSON.stringify(saved)}, after ${JSON.stringify(current)}`,
    );
});
