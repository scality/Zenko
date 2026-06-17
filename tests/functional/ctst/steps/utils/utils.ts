import { Buffer } from 'buffer';
import { promises as fsp } from 'fs';
import { join } from 'path';
import {
    Constants,
    Utils,
} from 'cli-testing';
import Zenko from 'world/Zenko';
import constants from 'common/constants';
import { getLocationConfigs } from './kubernetes';
import {
    S3Client,
    S3ServiceException,
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CopyObjectCommand,
    CreateBucketCommand,
    CreateMultipartUploadCommand,
    DeleteBucketCommand,
    DeleteBucketCorsCommand,
    DeleteBucketEncryptionCommand,
    DeleteBucketLifecycleCommand,
    DeleteBucketPolicyCommand,
    DeleteBucketReplicationCommand,
    DeleteBucketTaggingCommand,
    DeleteBucketWebsiteCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    DeleteObjectTaggingCommand,
    GetBucketAclCommand,
    GetBucketCorsCommand,
    GetBucketEncryptionCommand,
    GetBucketLifecycleConfigurationCommand,
    GetBucketLocationCommand,
    GetBucketNotificationConfigurationCommand,
    GetBucketPolicyCommand,
    GetBucketReplicationCommand,
    GetBucketTaggingCommand,
    GetBucketVersioningCommand,
    GetBucketWebsiteCommand,
    GetObjectAclCommand,
    GetObjectCommand,
    GetObjectLegalHoldCommand,
    GetObjectLockConfigurationCommand,
    GetObjectRetentionCommand,
    GetObjectTaggingCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    ListMultipartUploadsCommand,
    ListObjectsCommand,
    ListObjectVersionsCommand,
    ListObjectsV2Command,
    PutBucketAclCommand,
    PutBucketCorsCommand,
    PutBucketEncryptionCommand,
    PutBucketLifecycleConfigurationCommand,
    PutBucketNotificationConfigurationCommand,
    PutBucketPolicyCommand,
    PutBucketReplicationCommand,
    PutBucketTaggingCommand,
    PutBucketVersioningCommand,
    PutBucketWebsiteCommand,
    PutObjectAclCommand,
    PutObjectCommand,
    PutObjectLegalHoldCommand,
    PutObjectLockConfigurationCommand,
    PutObjectRetentionCommand,
    PutObjectTaggingCommand,
    RestoreObjectCommand,
    UploadPartCommand,
    UploadPartCopyCommand,
    type ObjectVersion,
    type DeleteMarkerEntry,
} from '@aws-sdk/client-s3';
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

export async function saveAsFile(name: string, content: string) {
    return fsp.writeFile(join('/tmp', name), content);
}

export async function deleteFile(path: string) {
    return fsp.unlink(path);
}

export async function uploadSetup(world: Zenko, action: string, body?: string, size?: number) {
    if (action !== 'PutObject' && action !== 'UploadPart') {
        return;
    }
    const objectSize = (size ?? world.getSaved<number>('objectSize')) || 0;
    if (body || objectSize > 0) {
        const tempFileName = `${Utils.randomString()}_${world.getSaved<string>('objectName')}`;
        world.addToSaved('tempFileName', `/tmp/${tempFileName}`);
        const objectBody = body || 'a'.repeat(objectSize);
        await saveAsFile(tempFileName, objectBody);
        world.addCommandParameter({ body: world.getSaved<string>('tempFileName') });
        const contentLength = body ? Buffer.byteLength(objectBody) : objectSize;
        world.addCommandParameter({ contentLength: `${contentLength}` });
    } else if (action === 'PutObject') {
        world.addCommandParameter({ body: '' });
        world.addCommandParameter({ contentLength: '0' });
    }
}

export async function uploadTeardown(world: Zenko, action: string) {
    if (action !== 'PutObject' && action !== 'UploadPart') {
        return;
    }
    const objectSize = world.getSaved<number>('objectSize') || 0;
    if (objectSize > 0) {
        await deleteFile(world.getSaved<string>('tempFileName'));
        world.deleteKeyFromCommand('body');
        world.deleteKeyFromCommand('contentLength');
    } else if (action === 'PutObject') {
        world.deleteKeyFromCommand('body');
        world.deleteKeyFromCommand('contentLength');
    }
}

async function runActionAgainstBucket(world: Zenko, action: string) {
    world.useSavedIdentity();

    const bucket = world.getSaved<string>('bucketName');
    const key = world.getSaved<string>('objectName') || '';
    const versionId = world.getSaved<string>('lastVersionId') || undefined;
    const uploadId = world.getSaved<string>('uploadId') || 'fakeId';

    if (action === 'MetadataSearch') {
        try { world.saveS3Result(await world.metadataSearchResponseCode(bucket)); }
        catch (err) { world.saveS3Error(err); }
        return;
    }
    if (action === 'PutObjectVersion') {
        try { world.saveS3Result(await world.putObjectVersionResponseCode(bucket, key)); }
        catch (err) { world.saveS3Error(err); }
        return;
    }

    try {
        let result: unknown;
        switch (action) {
        // --- Object operations ---
        case 'PutObject': {
            const sz = world.getSaved<number>('objectSize') || 0;
            const body = sz > 0 ? Buffer.alloc(sz, 'a') : Buffer.from('');
            result = await world.awsClients.s3.send(new PutObjectCommand({
                Bucket: bucket, Key: key, Body: body, ContentLength: body.length,
            }));
            break;
        }
        case 'GetObject':
            result = await world.awsClients.s3.send(new GetObjectCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'DeleteObject':
            result = await world.awsClients.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'HeadObject':
            result = await world.awsClients.s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'CopyObject':
            result = await world.awsClients.s3.send(new CopyObjectCommand({
                Bucket: bucket,
                Key: world.getSaved<string>('copyObject') || 'copyObject',
                CopySource: `${bucket}/${key}`,
            }));
            break;
        case 'GetObjectAcl':
            result = await world.awsClients.s3.send(new GetObjectAclCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'PutObjectAcl':
            result = await world.awsClients.s3.send(new PutObjectAclCommand({
                Bucket: bucket, Key: key, VersionId: versionId, ACL: 'public-read-write',
            }));
            break;
        case 'GetObjectTagging':
            result = await world.awsClients.s3.send(new GetObjectTaggingCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'PutObjectTagging':
            result = await world.awsClients.s3.send(new PutObjectTaggingCommand({
                Bucket: bucket, Key: key, VersionId: versionId,
                Tagging: { TagSet: [{ Key: 'string', Value: 'string' }] },
            }));
            break;
        case 'DeleteObjectTagging':
            result = await world.awsClients.s3.send(new DeleteObjectTaggingCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'GetObjectLegalHold':
            result = await world.awsClients.s3.send(new GetObjectLegalHoldCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'PutObjectLegalHold':
            result = await world.awsClients.s3.send(new PutObjectLegalHoldCommand({
                Bucket: bucket, Key: key, VersionId: versionId,
                LegalHold: { Status: 'ON' },
            }));
            break;
        case 'GetObjectRetention':
            result = await world.awsClients.s3.send(new GetObjectRetentionCommand({ Bucket: bucket, Key: key, VersionId: versionId }));
            break;
        case 'PutObjectRetention': {
            const bypassRetention = world.getCommandParameters().bypassGovernanceRetention === 'true';
            result = await world.awsClients.s3.send(new PutObjectRetentionCommand({
                Bucket: bucket, Key: key, VersionId: versionId,
                Retention: { Mode: 'GOVERNANCE', RetainUntilDate: new Date('2080-01-01T00:00:00Z') },
                BypassGovernanceRetention: bypassRetention,
            }));
            break;
        }
        case 'RestoreObject':
            result = await world.awsClients.s3.send(new RestoreObjectCommand({
                Bucket: bucket, Key: key, VersionId: versionId, RestoreRequest: { Days: 1 },
            }));
            break;
        case 'DeleteObjects':
            result = await world.awsClients.s3.send(new DeleteObjectsCommand({
                Bucket: bucket, Delete: { Objects: [{ Key: 'x'.repeat(10) }] },
            }));
            break;
        // --- Bucket operations ---
        case 'CreateBucket':
            result = await world.awsClients.s3.send(new CreateBucketCommand({ Bucket: bucket }));
            break;
        case 'HeadBucket':
            result = await world.awsClients.s3.send(new HeadBucketCommand({ Bucket: bucket }));
            break;
        case 'DeleteBucket':
            result = await world.awsClients.s3.send(new DeleteBucketCommand({ Bucket: bucket }));
            break;
        case 'GetBucketAcl':
            result = await world.awsClients.s3.send(new GetBucketAclCommand({ Bucket: bucket }));
            break;
        case 'PutBucketAcl':
            result = await world.awsClients.s3.send(new PutBucketAclCommand({ Bucket: bucket }));
            break;
        case 'GetBucketCors':
            result = await world.awsClients.s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
            break;
        case 'PutBucketCors':
            result = await world.awsClients.s3.send(new PutBucketCorsCommand({
                Bucket: bucket,
                CORSConfiguration: { CORSRules: [{ AllowedMethods: ['GET'], AllowedOrigins: ['*'] }] },
            }));
            break;
        case 'DeleteBucketCors':
            result = await world.awsClients.s3.send(new DeleteBucketCorsCommand({ Bucket: bucket }));
            break;
        case 'GetBucketVersioning':
            result = await world.awsClients.s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
            break;
        case 'PutBucketVersioning':
            result = await world.awsClients.s3.send(new PutBucketVersioningCommand({
                Bucket: bucket, VersioningConfiguration: { Status: 'Enabled' },
            }));
            break;
        case 'GetBucketTagging':
            result = await world.awsClients.s3.send(new GetBucketTaggingCommand({ Bucket: bucket }));
            break;
        case 'PutBucketTagging':
            result = await world.awsClients.s3.send(new PutBucketTaggingCommand({
                Bucket: bucket,
                Tagging: { TagSet: [{ Key: 'tag1', Value: 'value1' }, { Key: 'tag2', Value: 'value2' }] },
            }));
            break;
        case 'DeleteBucketTagging':
            result = await world.awsClients.s3.send(new DeleteBucketTaggingCommand({ Bucket: bucket }));
            break;
        case 'GetBucketWebsite':
            result = await world.awsClients.s3.send(new GetBucketWebsiteCommand({ Bucket: bucket }));
            break;
        case 'PutBucketWebsite':
            result = await world.awsClients.s3.send(new PutBucketWebsiteCommand({
                Bucket: bucket, WebsiteConfiguration: { IndexDocument: { Suffix: 'index.html' } },
            }));
            break;
        case 'DeleteBucketWebsite':
            result = await world.awsClients.s3.send(new DeleteBucketWebsiteCommand({ Bucket: bucket }));
            break;
        case 'GetBucketEncryption':
            result = await world.awsClients.s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
            break;
        case 'PutBucketEncryption':
            result = await world.awsClients.s3.send(new PutBucketEncryptionCommand({
                Bucket: bucket,
                ServerSideEncryptionConfiguration: {
                    Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }],
                },
            }));
            break;
        case 'DeleteBucketEncryption':
            result = await world.awsClients.s3.send(new DeleteBucketEncryptionCommand({ Bucket: bucket }));
            break;
        case 'GetBucketLifecycleConfiguration':
            result = await world.awsClients.s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
            break;
        case 'PutBucketLifecycleConfiguration':
            result = await world.awsClients.s3.send(new PutBucketLifecycleConfigurationCommand({
                Bucket: bucket,
                LifecycleConfiguration: {
                    Rules: [{
                        ID: 'ExampleRule', Status: 'Enabled', Filter: { Prefix: '' },
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        Transitions: [{ Days: 365, StorageClass: 'e2e-cold' as any }],
                        Expiration: { Days: 3650 },
                    }],
                },
            }));
            break;
        case 'DeleteBucketLifecycle':
        case 'DeleteBucketLifecycleConfiguration':
            result = await world.awsClients.s3.send(new DeleteBucketLifecycleCommand({ Bucket: bucket }));
            break;
        case 'GetBucketReplication':
            result = await world.awsClients.s3.send(new GetBucketReplicationCommand({ Bucket: bucket }));
            break;
        case 'PutBucketReplication':
            result = await world.awsClients.s3.send(new PutBucketReplicationCommand({
                Bucket: bucket,
                ReplicationConfiguration: {
                    Role: 'arn:aws:iam::123456789012:role/s3-replication-role',
                    Rules: [{ Status: 'Enabled', Prefix: '', Destination: { Bucket: 'arn:aws:s3:::examplebucket' } }],
                },
            }));
            break;
        case 'DeleteBucketReplication':
            result = await world.awsClients.s3.send(new DeleteBucketReplicationCommand({ Bucket: bucket }));
            break;
        case 'GetBucketPolicy':
            result = await world.awsClients.s3.send(new GetBucketPolicyCommand({ Bucket: bucket }));
            break;
        case 'PutBucketPolicy':
            result = await world.awsClients.s3.send(new PutBucketPolicyCommand({
                Bucket: bucket,
                Policy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:*', Resource: `arn:aws:s3:::${bucket}/*` }],
                }),
            }));
            break;
        case 'DeleteBucketPolicy':
            result = await world.awsClients.s3.send(new DeleteBucketPolicyCommand({ Bucket: bucket }));
            break;
        case 'GetBucketLocation':
            result = await world.awsClients.s3.send(new GetBucketLocationCommand({ Bucket: bucket }));
            break;
        case 'GetBucketNotificationConfiguration':
            result = await world.awsClients.s3.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucket }));
            break;
        case 'PutBucketNotificationConfiguration':
            result = await world.awsClients.s3.send(new PutBucketNotificationConfigurationCommand({
                Bucket: bucket, NotificationConfiguration: {},
            }));
            break;
        case 'GetObjectLockConfiguration':
            result = await world.awsClients.s3.send(new GetObjectLockConfigurationCommand({ Bucket: bucket }));
            break;
        case 'PutObjectLockConfiguration':
            result = await world.awsClients.s3.send(new PutObjectLockConfigurationCommand({
                Bucket: bucket,
                ObjectLockConfiguration: {
                    ObjectLockEnabled: 'Enabled',
                    Rule: { DefaultRetention: { Mode: 'GOVERNANCE', Days: 50 } },
                },
            }));
            break;
        // --- List operations ---
        case 'ListObjects':
            result = await world.awsClients.s3.send(new ListObjectsCommand({ Bucket: bucket }));
            break;
        case 'ListObjectsV2':
            result = await world.awsClients.s3.send(new ListObjectsV2Command({ Bucket: bucket }));
            break;
        case 'ListObjectVersions':
        case 'ListObjectsVersions':
        case 'GetObjectVersions':
        case 'GetObjects':
            result = await world.awsClients.s3.send(new ListObjectVersionsCommand({ Bucket: bucket }));
            break;
        case 'ListMultipartUploads':
            result = await world.awsClients.s3.send(new ListMultipartUploadsCommand({ Bucket: bucket }));
            break;
        // --- Multipart upload ---
        case 'CreateMultipartUpload': {
            const mpuKey = world.getSaved<string>('objectName') || `mpu-${Utils.randomString()}`;
            world.addToSaved('objectName', mpuKey);
            const mpuResult = await world.awsClients.s3.send(new CreateMultipartUploadCommand({
                Bucket: bucket, Key: mpuKey,
            }));
            world.addToSaved('uploadId', mpuResult.UploadId);
            result = mpuResult;
            break;
        }
        case 'UploadPart': {
            const sz = world.getSaved<number>('objectSize') || 0;
            const body = sz > 0 ? Buffer.alloc(sz, 'a') : Buffer.from('a');
            const partNumber = (world.getSaved<number>('partNumber') || 0) + 1;
            world.addToSaved('partNumber', partNumber);
            result = await world.awsClients.s3.send(new UploadPartCommand({
                Bucket: bucket, Key: key, UploadId: uploadId,
                PartNumber: partNumber, Body: body, ContentLength: body.length,
            }));
            break;
        }
        case 'UploadPartCopy': {
            const partNumberCopy = (world.getSaved<number>('partNumber') || 0) + 1;
            world.addToSaved('partNumber', partNumberCopy);
            result = await world.awsClients.s3.send(new UploadPartCopyCommand({
                Bucket: bucket,
                Key: world.getSaved<string>('copyObject') || 'copyObject',
                UploadId: uploadId,
                PartNumber: partNumberCopy,
                CopySource: `${bucket}/${key}`,
            }));
            break;
        }
        case 'AbortMultipartUpload':
            result = await world.awsClients.s3.send(new AbortMultipartUploadCommand({
                Bucket: bucket, Key: key, UploadId: uploadId,
            }));
            break;
        case 'CompleteMultipartUpload':
            result = await world.awsClients.s3.send(new CompleteMultipartUploadCommand({
                Bucket: bucket, Key: key, UploadId: uploadId, MultipartUpload: { Parts: [] },
            }));
            break;
        default:
            throw new Error(`Action ${action} is not supported yet`);
        }
        world.saveS3Result(result);
    } catch (err) {
        world.saveS3Error(err);
    }
}

async function createBucketWithConfiguration(
    world: Zenko,
    bucketName: string,
    withVersioning?: string,
    withObjectLock?: string,
    retentionMode?: string) {
    const preName = world.getSaved<string>('accountName') ||
        world.parameters.AccountName || Constants.ACCOUNT_NAME;
    const usedBucketName = bucketName
        || `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    world.addToSaved('bucketName', usedBucketName);
    world.logger.debug('Creating bucket',
        { bucket: usedBucketName, withObjectLock, retentionMode, withVersioning });
    await world.awsClients.s3.send(new CreateBucketCommand({
        Bucket: usedBucketName,
        ...(withObjectLock === 'with' ? { ObjectLockEnabledForBucket: true } : {}),
    }));
    // Object Lock auto-enables versioning; skip to avoid InvalidBucketState
    if (withVersioning === 'with' && withObjectLock !== 'with') {
        await world.awsClients.s3.send(new PutBucketVersioningCommand({
            Bucket: usedBucketName,
            VersioningConfiguration: { Status: 'Enabled' },
        }));
    }
    if (retentionMode === constants.governanceRetention || retentionMode === constants.complianceRetention) {
        world.addToSaved('objectLockMode', retentionMode);
        await world.awsClients.s3.send(new PutObjectLockConfigurationCommand({
            Bucket: usedBucketName,
            ObjectLockConfiguration: {
                ObjectLockEnabled: 'Enabled',
                Rule: {
                    DefaultRetention: { Mode: retentionMode as 'GOVERNANCE' | 'COMPLIANCE', Days: 50 },
                },
            },
        }));
    }
}

async function putMpuObject(world: Zenko, parts: number = 2, objectName: string, content?: string) {
    const key = objectName || `${Utils.randomString()}`;
    const bucket = world.getSaved<string>('bucketName');
    world.addToSaved('objectName', objectName);
    world.logger.debug('Adding mpu object', { objectName });

    const userMetadata = world.getSaved<Record<string, string>>('userMetadata');
    const mpuResult = await world.awsClients.s3.send(new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ...(userMetadata ? { Metadata: userMetadata } : {}),
    }));
    const uploadId = mpuResult.UploadId;
    if (!uploadId) {
        throw new Error('CreateMultipartUpload did not return an UploadId');
    }

    const size = world.getSaved<number>('objectSize') ?? 0;
    const partBody = content
        ? Buffer.from(content)
        : (size > 0 ? Buffer.alloc(size, 'a') : Buffer.from('a'));

    const uploadedParts: { ETag: string; PartNumber: number }[] = [];
    for (let i = 0; i < parts; i++) {
        const partResult = await world.awsClients.s3.send(new UploadPartCommand({
            Bucket: bucket,
            Key: key,
            PartNumber: i + 1,
            UploadId: uploadId,
            Body: partBody,
            ContentLength: partBody.length,
        }));
        uploadedParts.push({ ETag: partResult.ETag!, PartNumber: i + 1 });
    }

    const result = await world.awsClients.s3.send(new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: uploadedParts },
    }));
    world.saveCreatedObject(objectName, result.VersionId || '');
    world.saveS3Result(result);
}

async function copyObject(world: Zenko, srcObjectName?: string, dstObjectName?: string) {
    const bucket = world.getSaved<string>('bucketName');
    const key = dstObjectName || world.getSaved<string>('objectName');
    const copySource = `${bucket}/${srcObjectName || world.getSaved<string>('objectName')}`;
    const userMetadata = world.getSaved<Record<string, string>>('userMetadata');

    const result = await world.awsClients.s3.send(new CopyObjectCommand({
        Bucket: bucket,
        Key: key,
        CopySource: copySource,
        ...(userMetadata ? { Metadata: userMetadata } : {}),
    }));
    world.saveCreatedObject(key, result.VersionId || '');
    world.saveS3Result(result);
}

async function putObject(world: Zenko, objectName?: string, content?: string, objectSize?: number) {
    const finalObjectName = objectName || `${Utils.randomString()}`;
    world.addToSaved('objectName', finalObjectName);
    world.logger.debug('Adding object', { objectName: finalObjectName });

    const size = objectSize ?? world.getSaved<number>('objectSize') ?? 0;
    const bodyStr = content || (size > 0 ? 'a'.repeat(size) : '');
    const body = bodyStr ? Buffer.from(bodyStr) : undefined;
    const userMetadata = world.getSaved<Record<string, string>>('userMetadata');

    const result = await world.awsClients.s3.send(new PutObjectCommand({
        Bucket: world.getSaved<string>('bucketName'),
        Key: finalObjectName,
        Body: body,
        ContentLength: body ? body.length : 0,
        ...(userMetadata ? { Metadata: userMetadata } : {}),
    }));
    world.saveCreatedObject(finalObjectName, result.VersionId || '');
    if (result.ETag) {
        world.addToSaved('objectETag', result.ETag);
    }
    world.saveS3Result(result);
}

async function getObject(world: Zenko, objectKey: string, bucketName: string) {
    return world.awsClients.s3.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));
}

async function headObject(world: Zenko, objectKey: string, bucketName: string) {
    return world.awsClients.s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }));
}

function getAuthorizationConfiguration(world: Zenko): AuthorizationConfiguration {
    return {
        Identity: world.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity
            || AuthorizationType.NO_RESOURCE,
        Resource: world.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource
            || AuthorizationType.NO_RESOURCE,
    };
}


async function emptyNonVersionedBucket(world: Zenko) {
    const bucket = world.getSaved<string>('bucketName');
    const results = await world.awsClients.s3.send(new ListObjectsCommand({ Bucket: bucket }));
    await Promise.all((results.Contents || []).map(obj =>
        world.awsClients.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key! })),
    ));
}

async function emptyVersionedBucket(world: Zenko) {
    const bucket = world.getSaved<string>('bucketName');
    const results = await world.awsClients.s3.send(new ListObjectVersionsCommand({ Bucket: bucket }));
    const versions = results.Versions as ObjectVersion[] || [];
    const deleteMarkers = results.DeleteMarkers as DeleteMarkerEntry[] || [];
    await Promise.all([
        ...deleteMarkers.map(obj =>
            world.awsClients.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key!, VersionId: obj.VersionId })),
        ),
        ...versions.map(obj =>
            world.awsClients.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key!, VersionId: obj.VersionId })),
        ),
    ]);
}

async function addTransitionWorkflow(this: Zenko, location: string, enabled = true) {
    const bucket = this.getSaved<string>('bucketName');
    const command = new PutBucketLifecycleConfigurationCommand({
        Bucket: bucket,
        LifecycleConfiguration: {
            Rules: [{
                Status: enabled ? 'Enabled' : 'Disabled',
                Filter: { Prefix: '' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Transitions: [{ Days: 0, StorageClass: location as any }],
                ID: `transition-to-${location}`,
            }],
        },
    });
    let conditionOk = false;
    while (!conditionOk) {
        try {
            await this.awsClients.s3.send(command);
            conditionOk = true;
        } catch {
            // Wait for the transition to be accepted because the deployment of the location's pods can take some time
        }
        await Utils.sleep(5000);
    }
}

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

async function putBucketReplication(
    this: Zenko,
    srcBucket: string,
    replicationLocation: string
) {
    // https://documentation.scality.com/Artesca/4.0.1/data_management/bucket_operations/replication_workflow/create_a_replication_workflow.html
    await this.awsClients.s3.send(new PutBucketReplicationCommand({
        Bucket: srcBucket,
        ReplicationConfiguration: {
            Role: 'arn:aws:iam::root:role/s3-replication-role',
            Rules: [{
                Status: 'Enabled',
                Filter: { Prefix: '' },
                Destination: {
                    Bucket: `arn:aws:s3:::${srcBucket}`,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    StorageClass: replicationLocation as any,
                },
            }],
        },
    })).catch(err => {
        this.logger.error('Failed to put bucket replication', {
            srcBucket,
            replicationLocation,
            error: (err as Error).message,
        });
        throw new Error(`Failed to put bucket replication, err : ${(err as Error).message}`);
    });
}

// Polls for transition status and checks the DLQ buffer on every iteration for early failure.
// Relies on bucket names being randomized so a DLQ entry from a previous run cannot match.
async function verifyObjectLocation(this: Zenko, objectName: string,
    objectTransitionStatus: string, storageClass: string) {
    const objName =
        getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
    const bucketName = this.getSaved<string>('bucketName');
    const versionId = this.getLatestObjectVersion(objName) || undefined;

    const op = objectTransitionStatus === 'restored' ? 'restore' : 'archive';
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

        let head: { StorageClass?: string; Restore?: string } | undefined;
        try {
            head = await this.awsClients.s3.send(new HeadObjectCommand({
                Bucket: bucketName,
                Key: objName,
                VersionId: versionId,
            }));
        } catch (err) {
            if (err instanceof S3ServiceException && err.name === 'NotFound') {
                await Utils.sleep(1000);
                continue;
            }
            throw new Error(`HeadObject error for "${objName}": ${(err as Error).message}`);
        }

        const expectedClass = storageClass !== '' ? storageClass : undefined;
        let conditionOk = head.StorageClass === expectedClass;
        if (objectTransitionStatus === 'restored') {
            conditionOk = conditionOk && !!head.Restore &&
                head.Restore.includes('ongoing-request="false", expiry-date=');
        } else if (objectTransitionStatus === 'cold') {
            conditionOk = conditionOk && !head.Restore;
        }
        if (conditionOk) {
            return;
        }

        await Utils.sleep(1000);
    }

    throw new Error(
        `verifyObjectLocation timed out after ${timeoutMs / 1000}s ` +
        `waiting for object "${objName}" to reach "${objectTransitionStatus}" ` +
        `with storage class "${storageClass}"`,
    );
}

async function restoreObject(this: Zenko, objectName: string, days: number) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
    const versionId = this.getLatestObjectVersion(objName) || undefined;
    const result = await this.awsClients.s3.send(new RestoreObjectCommand({
        Bucket: this.getSaved<string>('bucketName'),
        Key: objName,
        VersionId: versionId,
        RestoreRequest: { Days: days },
    }));
    this.saveS3Result(result);
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
    AuthorizationConfiguration,
    runActionAgainstBucket,
    createBucketWithConfiguration,
    getAuthorizationConfiguration,
    putMpuObject,
    copyObject,
    putObject,
    getObject,
    headObject,
    emptyNonVersionedBucket,
    emptyVersionedBucket,
    verifyObjectLocation,
    getObjectNameWithBackendFlakiness,
    restoreObject,
    addTransitionWorkflow,
    getReplicationLocationConfig,
    putBucketReplication,
};
