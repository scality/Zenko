import * as s3 from '@aws-sdk/client-s3';
import {
    CompleteMultipartUploadCommand,
    CopyObjectCommand,
    CreateBucketCommand,
    CreateMultipartUploadCommand,
    DeleteMarkerEntry,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectVersionsCommand,
    ListObjectVersionsCommandOutput,
    ObjectVersion,
    PutBucketLifecycleConfigurationCommand,
    PutBucketReplicationCommand,
    PutBucketReplicationCommandInput,
    PutBucketVersioningCommand,
    PutObjectCommand,
    PutObjectLockConfigurationCommand,
    RestoreObjectCommand,
    S3ServiceException,
    StorageClass,
    TransitionStorageClass,
    UploadPartCommand,
    LifecycleRule,
    ObjectLockRetentionMode,
} from '@aws-sdk/client-s3';
import { Identity } from 'cli-testing';
import { sleep, randomString } from 'common/utils';
import Zenko from 'world/Zenko';
import { ApiResult, settle } from 'common/result';
import assert from 'assert';
import constants from 'common/constants';
import { pollDLQBuffer } from './kafka';

enum AuthorizationType {
    ALLOW = 'Allow',
    DENY = 'Deny',
    IMPLICIT_DENY = 'ImplicitDeny',
    NO_RESOURCE = 'NoResource'
}

type AuthorizationConfiguration = {
    Identity: AuthorizationType,
    Resource: AuthorizationType,
};

/**
 * Body of an uploaded object: the given content, or the saved object size worth of data
 */
function objectBody(world: Zenko, content?: string, size?: number): string {
    return content ?? 'a'.repeat((size ?? world.getSaved<number>('objectSize')) || 0);
}

// Inputs the policy matrix sends with an action, on top of its bucket, object, version and upload
const actionInputs: Record<string, Record<string, unknown>> = {
    RestoreObject: { RestoreRequest: { Days: 1 } },
    PutObjectAcl: { ACL: 'public-read-write' },
    PutBucketCors: { CORSConfiguration: { CORSRules: [{ AllowedMethods: ['GET'], AllowedOrigins: ['*'] }] } },
    PutBucketTagging: {
        Tagging: { TagSet: [{ Key: 'tag1', Value: 'value1' }, { Key: 'tag2', Value: 'value2' }] },
    },
    PutObjectTagging: { Tagging: { TagSet: [{ Key: 'string', Value: 'string' }] } },
    PutBucketVersioning: { VersioningConfiguration: { Status: 'Enabled' } },
    PutObjectLegalHold: { LegalHold: { Status: 'ON' } },
    PutObjectRetention: {
        Retention: { Mode: 'GOVERNANCE', RetainUntilDate: new Date('2080-01-01T00:00:00Z') },
        BypassGovernanceRetention: true,
    },
    PutObjectLockConfiguration: {
        ObjectLockConfiguration: {
            ObjectLockEnabled: 'Enabled',
            Rule: { DefaultRetention: { Mode: 'GOVERNANCE', Days: 50 } },
        },
    },
    DeleteObjects: { Delete: { Objects: [{ Key: 'x'.repeat(10) }] } },
    PutBucketLifecycleConfiguration: {
        LifecycleConfiguration: {
            Rules: [{
                ID: 'ExampleRule',
                Prefix: '',
                Status: 'Enabled',
                Transitions: [{ Days: 365, StorageClass: 'e2e-cold' }],
                Expiration: { Days: 3650 },
            }],
        },
    },
    PutBucketReplication: {
        ReplicationConfiguration: {
            Role: 'arn:aws:iam::123456789012:role/s3-replication-role',
            Rules: [{ Status: 'Enabled', Prefix: '', Destination: { Bucket: 'arn:aws:s3:::examplebucket' } }],
        },
    },
};

function nextPartNumber(world: Zenko): number {
    const partNumber = world.getSaved<number>('partNumber') + 1 || 1;
    world.addToSaved('partNumber', partNumber);
    return partNumber;
}

function actionInput(world: Zenko, action: string): Record<string, unknown> {
    const bucket = world.getSaved<string>('bucketName');
    const objectName = world.getSaved<string>('objectName');
    // The SDK only sends the members of each operation, the others are ignored
    const input: Record<string, unknown> = {
        Bucket: bucket,
        Key: objectName || undefined,
        VersionId: world.getSaved<string>('lastVersionId') || undefined,
        UploadId: world.getSaved<string>('uploadId') || undefined,
        ...actionInputs[action],
    };
    switch (action) {
    case 'CopyObject':
        input.CopySource = `${bucket}/${objectName}`;
        input.Key = world.getSaved<string>('copyObject') || 'copyObject';
        break;
    case 'UploadPartCopy':
        input.CopySource = `${bucket}/${objectName}`;
        input.Key = world.getSaved<string>('copyObject') || 'copyObject';
        input.UploadId ??= 'fakeId';
        input.PartNumber = nextPartNumber(world);
        break;
    case 'UploadPart':
        input.UploadId ??= 'fakeId';
        input.PartNumber = nextPartNumber(world);
        input.Body = objectBody(world);
        break;
    case 'PutObject':
        input.Body = objectBody(world);
        break;
    case 'PutBucketPolicy':
        input.Policy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:*',
                Resource: `arn:aws:s3:::${bucket}/*`,
            }],
        });
        break;
    case 'PutObjectRetention':
        input.Retention = world.getSaved('retention') ?? input.Retention;
        break;
    default:
        break;
    }
    return input;
}

type S3Command = Parameters<s3.S3Client['send']>[0];

async function runActionAgainstBucket(world: Zenko, action: string) {
    world.useSavedIdentity();
    const userCredentials = Identity.getCurrentCredentials();
    if (!userCredentials) {
        throw new Error('User credentials not set. '
            + 'Make sure the `IAMSession` and `AssumedSession` world parameter are defined.');
    }
    switch (action) {
    case 'MetadataSearch': {
        world.setResult(await world.metadataSearchResponseCode(userCredentials,
            world.getSaved<string>('bucketName')));
        break;
    }
    case 'PutObjectVersion': {
        world.setResult(await world.putObjectVersionResponseCode(userCredentials,
            world.getSaved<string>('bucketName'), world.getSaved<string>('objectName')));
        break;
    }
    default: {
        const ActionCommand = (s3 as unknown as Record<string, (new (input: object) => S3Command) | undefined>)[
            `${action}Command`];
        if (!ActionCommand) {
            throw new Error(`Action ${action} is not supported yet`);
        }
        const result = await settle(world.s3.send(new ActionCommand(actionInput(world, action))));
        // Release the connection of the object bodies, which are not read
        (result.data as { Body?: { destroy?: () => void } } | undefined)?.Body?.destroy?.();
        world.setResult(result);
        break;
    }
    }
}

async function createBucketWithConfiguration(
    world: Zenko,
    bucketName: string,
    withVersioning?: string,
    withObjectLock?: string,
    retentionMode?: string) {
    const preName = world.getSaved<string>('accountName') ||
        world.parameters.AccountName || constants.ACCOUNT_NAME;
    const usedBucketName = bucketName
        || `${preName}${constants.BUCKET_NAME_TEST}${randomString()}`.toLocaleLowerCase();
    world.addToSaved('bucketName', usedBucketName);
    world.logger.debug('Creating bucket',
        { bucket: usedBucketName, withObjectLock, retentionMode, withVersioning });
    try {
        await world.s3.send(new CreateBucketCommand({
            Bucket: usedBucketName,
            ObjectLockEnabledForBucket: withObjectLock === 'with' || undefined,
        }));
    } catch (err) {
        // Buckets with a fixed name are kept by the scenarios that ran before
        if ((err as S3ServiceException).name !== 'BucketAlreadyOwnedByYou') {
            throw err;
        }
    }
    if (withVersioning === 'with') {
        await world.s3.send(new PutBucketVersioningCommand({
            Bucket: usedBucketName,
            VersioningConfiguration: { Status: 'Enabled' },
        }));
    }
    if (retentionMode === constants.governanceRetention || retentionMode === constants.complianceRetention) {
        world.addToSaved('objectLockMode', retentionMode);
        await world.s3.send(new PutObjectLockConfigurationCommand({
            Bucket: usedBucketName,
            ObjectLockConfiguration: {
                ObjectLockEnabled: 'Enabled',
                Rule: { DefaultRetention: { Mode: retentionMode as ObjectLockRetentionMode, Days: 50 } },
            },
        }));
    }
}

/**
 * Parses user metadata written as "key1=value1,key2=value2"
 */
function parseMetadata(metadata: string): Record<string, string> {
    return Object.fromEntries(metadata.split(',').map(pair => {
        const [key, ...value] = pair.split('=');
        return [key, value.join('=')];
    }));
}

function userMetadata(world: Zenko): Record<string, string> | undefined {
    const metadata = world.getSaved<string>('userMetadata');
    return metadata ? parseMetadata(metadata) : undefined;
}

async function putMpuObject(world: Zenko, parts: number = 2, objectName: string, content?: string) {
    const key = objectName || `${randomString()}`;
    const bucket = world.getSaved<string>('bucketName');

    world.addToSaved('objectName', objectName);
    world.logger.debug('Adding mpu object', { objectName });

    const { UploadId } = await world.s3.send(new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        Metadata: userMetadata(world),
    }));

    const body = objectBody(world, content);
    const uploadedParts = [];
    for (let i = 0; i < parts; i++) {
        const { ETag } = await world.s3.send(new UploadPartCommand({
            Bucket: bucket,
            Key: key,
            PartNumber: i + 1,
            UploadId,
            Body: body,
        }));
        uploadedParts.push({ ETag, PartNumber: i + 1 });
    }

    const result = await settle(world.s3.send(new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId,
        MultipartUpload: { Parts: uploadedParts },
    })));
    world.saveCreatedObject(objectName, result.data?.VersionId || '');
    world.setResult(result);
    return result;
}

async function copyObject(world: Zenko, srcObjectName?: string, dstObjectName?: string) {
    const bucket = world.getSaved<string>('bucketName');
    const key = dstObjectName || world.getSaved<string>('objectName');

    const result = await settle(world.s3.send(new CopyObjectCommand({
        Bucket: bucket,
        Key: key,
        CopySource: `${bucket}/${srcObjectName || world.getSaved<string>('objectName')}`,
        Metadata: userMetadata(world),
    })));
    world.saveCreatedObject(key, result.data?.VersionId || '');
    world.setResult(result);
    return result;
}

async function putObject(world: Zenko, objectName?: string, content?: string, objectSize?: number) {
    const finalObjectName = objectName || `${randomString()}`;
    world.addToSaved('objectName', finalObjectName);
    world.logger.debug('Adding object', { objectName: finalObjectName });
    const result = await settle(world.s3.send(new PutObjectCommand({
        Bucket: world.getSaved<string>('bucketName'),
        Key: finalObjectName,
        Body: objectBody(world, content, objectSize),
        Metadata: userMetadata(world),
    })));
    if (result.data?.ETag) {
        world.addToSaved('objectETag', result.data.ETag);
    }
    world.saveCreatedObject(finalObjectName, result.data?.VersionId || '');
    world.setResult(result);
    return result;
}

/**
 * Lists every version and delete marker of a bucket, over as many pages as needed
 */
async function listAllObjectVersions(world: Zenko, bucket: string, prefix?: string) {
    const versions: ObjectVersion[] = [];
    const deleteMarkers: DeleteMarkerEntry[] = [];
    let page: ListObjectVersionsCommandOutput | undefined;
    do {
        page = await world.s3.send(new ListObjectVersionsCommand({
            Bucket: bucket,
            Prefix: prefix,
            KeyMarker: page?.NextKeyMarker,
            VersionIdMarker: page?.NextVersionIdMarker,
        }));
        versions.push(...page.Versions || []);
        deleteMarkers.push(...page.DeleteMarkers || []);
    } while (page.IsTruncated);
    return { versions, deleteMarkers };
}

async function getObject(world: Zenko, objectKey: string, bucketName: string) {
    const response = await world.s3.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));
    // Only the metadata is used, release the connection of the body
    response.Body?.transformToWebStream().cancel().catch(() => {});
    return response;
}

async function headObject(world: Zenko, objectKey: string, bucketName: string) {
    return world.s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }));
}

function getAuthorizationConfiguration(world: Zenko): AuthorizationConfiguration {
    return {
        Identity: world.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity
            || AuthorizationType.NO_RESOURCE,
        Resource: world.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource
            || AuthorizationType.NO_RESOURCE,
    };
}

async function putBucketLifecycleConfigurationWithRetry(world: Zenko, rules: LifecycleRule[]) {
    let accepted = false;
    while (!accepted) {
        try {
            await world.s3.send(new PutBucketLifecycleConfigurationCommand({
                Bucket: world.getSaved<string>('bucketName'),
                LifecycleConfiguration: { Rules: rules },
            }));
            accepted = true;
        } catch (err) {
            world.logger.debug('Lifecycle configuration not accepted yet', { err });
        }
        // Wait for the configuration to be accepted because the deployment of the location's pods can take some time
        await sleep(5000);
    }
}

async function addTransitionWorkflow(this: Zenko, location: string, enabled = true) {
    const enabledStr = enabled ? 'Enabled' : 'Disabled';
    await putBucketLifecycleConfigurationWithRetry(this, [
        {
            Status: enabledStr,
            Prefix: '',
            Transitions: [
                {
                    Days: 0,
                    // Zenko storage classes are location names
                    StorageClass: location as TransitionStorageClass,
                },
            ],
        },
    ]);
}

async function addExpirationWorkflow(this: Zenko, days: number, includeNoncurrentVersions = false) {
    const rule: LifecycleRule = {
        Status: 'Enabled',
        Prefix: '',
        Expiration: {
            Days: days,
        },
    };
    if (includeNoncurrentVersions) {
        rule.NoncurrentVersionExpiration = {
            NoncurrentDays: days,
        };
    }
    await putBucketLifecycleConfigurationWithRetry(this, [rule]);
}

// Polls for transition status and checks the DLQ buffer on every iteration for early failure.
// Relies on bucket names being randomized so a DLQ entry from a previous run cannot match.
async function verifyObjectLocation(this: Zenko, objectName: string,
    objectTransitionStatus: string, storageClass: string) {
    const objName =
        getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
    const versionId = this.getLatestObjectVersion(objName) || undefined;

    const op = objectTransitionStatus === 'restored' ? 'restore' : 'archive';
    const bucketName = this.getSaved<string>('bucketName');
    const seenDLQ = this.getSaved<Set<string>>('seenDLQMessages') ?? new Set<string>();
    this.addToSaved('seenDLQMessages', seenDLQ);

    const timeoutMs = 5 * 60 * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const dlqMsg = pollDLQBuffer(Zenko.dlqBuffer, op, objName, bucketName, seenDLQ);
        if (dlqMsg) {
            seenDLQ.add(dlqMsg.requestId);
            this.logger.error('Found failure in dead letter queue', { dlqMsg });
            throw new Error(
                `Transition failed for object "${objName}" in bucket "${bucketName}":` +
                ` found in dead letter queue (op: ${dlqMsg.op}, reason: ${dlqMsg.reason})`,
            );
        }

        const { data: head, error } = await settle(this.s3.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: objName,
            VersionId: versionId,
        })));
        if (error?.name === 'NotFound') {
            await sleep(1000);
            continue;
        } else if (error) {
            throw new Error(`HeadObject error for "${objName}": ${error.name}: ${error.message}`);
        }
        assert(head);
        const expectedClass = storageClass !== '' ? storageClass : undefined;
        let conditionOk = head.StorageClass === expectedClass;
        if (objectTransitionStatus === 'restored') {
            conditionOk = conditionOk && !!head.Restore &&
                head.Restore.includes('ongoing-request="false", expiry-date=');
        } else if (objectTransitionStatus === 'cold') {
            conditionOk = conditionOk && !head.Restore;
        }
        if (conditionOk) return;

        await sleep(1000);
    }

    throw new Error(
        `verifyObjectLocation timed out after ${timeoutMs / 1000}s ` +
        `waiting for object "${objName}" to reach "${objectTransitionStatus}" ` +
        `with storage class "${storageClass}"`,
    );
}

async function restoreObject(this: Zenko, objectName: string, days: number) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) ||  this.getSaved<string>('objectName');
    this.setResult(await settle(this.s3.send(new RestoreObjectCommand({
        Bucket: this.getSaved<string>('bucketName'),
        Key: objName,
        VersionId: this.getLatestObjectVersion(objName) || undefined,
        RestoreRequest: { Days: days },
    }))));
}

async function putBucketReplicationRaw(
    this: Zenko,
    srcBucket: string,
    replicationConfiguration: PutBucketReplicationCommandInput['ReplicationConfiguration'],
): Promise<ApiResult> {
    return settle(this.s3.send(new PutBucketReplicationCommand({
        Bucket: srcBucket,
        ReplicationConfiguration: replicationConfiguration,
    })));
}

async function putBucketReplication(
    this: Zenko,
    srcBucket: string,
    replicationLocation: string,
    format: 'V1' | 'V2' = 'V1',
) {
    const keyFilter = format === 'V2'
        ? {
            Filter: { Prefix: '' },
            Priority: 1,
        }
        : {
            Prefix: '',
        };
    const res = await putBucketReplicationRaw.call(this, srcBucket, {
        Role: 'arn:aws:iam::root:role/s3-replication-role',
        Rules: [
            {
                ...keyFilter,
                Destination: {
                    Bucket: `arn:aws:s3:::${srcBucket}`,
                    StorageClass: replicationLocation as StorageClass,
                },
                Status: 'Enabled',
            },
        ],
    });
    if (res.error) {
        this.logger.error('Failed to put bucket replication', {
            srcBucket,
            replicationLocation,
            error: res.error,
        });
        throw new Error(`Failed to put bucket replication, err : ${res.error}`);
    }
}

/**
 * @param {Zenko} this world object
 * @param {string} objectName object name
 * @returns {string} the object name based on the backend flakyness
 */
function getObjectNameWithBackendFlakiness(this: Zenko, objectName: string) {
    let objectNameFinal;
    const backendFlakinessRetryNumber = this.getSaved<string>('backendFlakinessRetryNumber');
    const backendFlakiness = this.getSaved<string>('backendFlakiness');

    if (!backendFlakiness || !backendFlakinessRetryNumber || !objectName) {
        return objectName;
    }

    switch (backendFlakiness) {
    case 'command':
        objectNameFinal = `${objectName}.scal-retry-command-${backendFlakinessRetryNumber}`;
        break;
    case 'archive':
    case 'restore':
        objectNameFinal = `${objectName}.scal-retry-${backendFlakiness}-job-${backendFlakinessRetryNumber}`;
        break;
    default:
        this.logger.debug('Unknown backend flakyness', { backendFlakiness });
        return objectName;
    }
    return objectNameFinal;
}

export {
    AuthorizationType,
    parseMetadata,
    AuthorizationConfiguration,
    runActionAgainstBucket,
    createBucketWithConfiguration,
    getAuthorizationConfiguration,
    putMpuObject,
    copyObject,
    putObject,
    getObject,
    headObject,
    listAllObjectVersions,
    verifyObjectLocation,
    getObjectNameWithBackendFlakiness,
    restoreObject,
    addTransitionWorkflow,
    addExpirationWorkflow,
    putBucketReplication,
    putBucketReplicationRaw,
};
