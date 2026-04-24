import { Buffer } from 'buffer';
import { promises as fsp } from 'fs';
import { join } from 'path';
import {
    CacheHelper,
    Constants,
    Identity,
    S3,
    Utils,
    AWSVersionObject,
    Command,
} from 'cli-testing';
import { extractPropertyFromResults, s3FunctionExtraParams, safeJsonParse } from 'common/utils';
import Zenko from 'world/Zenko';
import { ZENKO_ACCOUNT_NAME } from 'tests_common/configuration';
import assert from 'assert';
import constants from 'common/constants';
import { getLocationConfigs } from './kubernetes';
import { S3Client } from '@aws-sdk/client-s3';

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
        world.resetCommand();
        world.addToSaved('ifS3Standard', true);
        world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
        if (world.getSaved<string>('lastVersionId')) {
            world.addCommandParameter({ versionId: world.getSaved<string>('lastVersionId') });
        }
        // if copy object, set copy source as the saved object name, and the key as a new object name
        if (action === 'CopyObject') {
            world.addCommandParameter({
                copySource: `${world.getSaved<string>('bucketName')}/${world.getSaved<string>('objectName')}`,
            });
            world.addCommandParameter({ key: world.getSaved<string>('copyObject') || 'copyObject' });
        } else if (world.getSaved<string>('objectName')) {
            world.addCommandParameter({ key: world.getSaved<string>('objectName') });
        }
        if (action === 'PutBucketPolicy') {
            world.addCommandParameter({
                policy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: '*',
                        Action: 's3:*',
                        Resource: `arn:aws:s3:::${world.getSaved<string>('bucketName')}/*`,
                    }],
                }),
            });
        }
        await uploadSetup(world, action);
        if (action === 'UploadPart') {
            world.addCommandParameter({ uploadId: world.getSaved<string>('uploadId') || 'fakeId' });
            const partNumber = world.getSaved<number>('partNumber') + 1 || 1;
            world.addToSaved('partNumber', partNumber);
            world.addCommandParameter({ partNumber: `${partNumber}` });
        }
        if (action === 'UploadPartCopy') {
            world.addCommandParameter({ uploadId: world.getSaved<string>('uploadId') || 'fakeId' });
            const partNumber = world.getSaved<number>('partNumber') + 1 || 1;
            world.addToSaved('partNumber', partNumber);
            world.addCommandParameter({ partNumber: `${partNumber}` });
            world.addCommandParameter({
                copySource: `${world.getSaved<string>('bucketName')}/${world.getSaved<string>('objectName')}`,
            });
            world.addCommandParameter({ key: world.getSaved<string>('copyObject') || 'copyObject' });
        }
        if (action === 'PutBucketCors') {
            CacheHelper.forceMode = 'cli';
        }
        if (world.getSaved<string>('uploadId')) {
            world.addCommandParameter({ uploadId: world.getSaved<string>('uploadId') });
        }
        const usedAction = action.charAt(0).toLowerCase() + action.slice(1);
        const actionCall: (params: unknown) => Promise<Command> =
        // @ts-expect-error the function is dynamically called
            S3[usedAction] as (params: unknown) => Promise<Command>;

        if (actionCall) {
            if (usedAction in s3FunctionExtraParams) {
                s3FunctionExtraParams[usedAction].forEach(param => {
                    world.logger.debug('Adding parameter', { param });
                    // Keys that are set in the scenarios take precedence over the
                    // ones set in the extra params.
                    const key = Object.keys(param)[0];
                    if (!world.getSaved<string>(key)) {
                        world.addCommandParameter(param);
                    } else {
                        world.addCommandParameter({ [key]: world.getSaved<string>(key) });
                    }
                });
            }
            world.setResult(await actionCall(world.getCommandParameters()));
            await uploadTeardown(world, action);
            CacheHelper.forceMode = null;
        } else {
            CacheHelper.forceMode = null;
            throw new Error(`Action ${usedAction} is not supported yet`);
        }
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
    world.resetCommand();
    const preName = world.getSaved<string>('accountName') ||
        ZENKO_ACCOUNT_NAME;
    const usedBucketName = bucketName
        || `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    world.addToSaved('bucketName', usedBucketName);
    world.addCommandParameter({ bucket: usedBucketName });
    if (withObjectLock === 'with') {
        // Empty strings are used to pass parameters that are used as a flag and do not require a value
        world.addCommandParameter({ objectLockEnabledForBucket: ' ' });
    }
    world.logger.debug('Creating bucket',
        { bucket: usedBucketName, withObjectLock, retentionMode, withVersioning });
    await S3.createBucket(world.getCommandParameters());
    if (withVersioning === 'with') {
        world.addCommandParameter({ versioningConfiguration: 'Status=Enabled' });
        await S3.putBucketVersioning(world.getCommandParameters());
    }
    if (retentionMode === constants.governanceRetention || retentionMode === constants.complianceRetention) {
        world.addToSaved('objectLockMode', retentionMode);
        world.resetCommand();
        world.addCommandParameter({ bucket: usedBucketName });
        world.addCommandParameter({
            objectLockConfiguration: '{ ' +
                '"ObjectLockEnabled": "Enabled",' +
                '"Rule": {' +
                '"DefaultRetention":' +
                `{ "Mode": "${retentionMode}", "Days": 50 }}}`,
        });
        await S3.putObjectLockConfiguration(world.getCommandParameters());
    }
}

async function putMpuObject(world: Zenko, parts: number = 2, objectName: string, content?: string) {
    const key = objectName || `${Utils.randomString()}`;
    const bucket = world.getSaved<string>('bucketName');

    world.resetCommand();
    world.addToSaved('objectName', objectName);
    world.logger.debug('Adding mpu object', { objectName });
    world.addCommandParameter({ key });
    world.addCommandParameter({ bucket });
    const userMetadata = world.getSaved<string>('userMetadata');
    if (userMetadata) {
        world.addCommandParameter({ metadata: JSON.stringify(userMetadata) });
    }

    const initiateMPUResult = await S3.createMultipartUpload(world.getCommandParameters());
    assert.ifError(initiateMPUResult.stderr || initiateMPUResult.err);
    const uploadId = extractPropertyFromResults<string>(initiateMPUResult, 'UploadId');

    await uploadSetup(world, 'UploadPart', content);
    const body = world.getSaved<string>('tempFileName');

    const uploadedParts = [];
    for (let i = 0; i < parts; i++) {
        world.resetCommand();
        world.addCommandParameter({ key });
        world.addCommandParameter({ bucket });
        world.addCommandParameter({ partNumber: (i+1).toString() });
        world.addCommandParameter({ uploadId });
        if (body) {
            world.addCommandParameter({ body });
        }

        const uploadPartResult = await S3.uploadPart(world.getCommandParameters());
        assert.ifError(uploadPartResult.stderr || uploadPartResult.err);

        uploadedParts.push({
            ETag: extractPropertyFromResults<string>(uploadPartResult, 'ETag'),
            PartNumber: (i+1).toString(),
        });
    }

    await uploadTeardown(world, 'UploadPart');

    world.resetCommand();
    world.addCommandParameter({ key });
    world.addCommandParameter({ bucket });
    world.addCommandParameter({ uploadId });
    world.addCommandParameter({ multipartUpload: JSON.stringify({ Parts: uploadedParts }) });

    const result = await S3.completeMultipartUpload(world.getCommandParameters());
    const versionId = extractPropertyFromResults<string>(result, 'VersionId');
    world.saveCreatedObject(objectName, versionId || '');
    world.setResult(result);
    return result;
}

async function copyObject(world: Zenko, srcObjectName?: string, dstObjectName?: string) {
    const bucket = world.getSaved<string>('bucketName');
    const key = dstObjectName || world.getSaved<string>('objectName');
    const copySource = `${bucket}/${srcObjectName || world.getSaved<string>('objectName')}`;

    world.resetCommand();
    world.addCommandParameter({ copySource });
    world.addCommandParameter({ bucket });
    world.addCommandParameter({ key });

    const userMetadata = world.getSaved<string>('userMetadata');
    if (userMetadata) {
        world.addCommandParameter({ metadata: JSON.stringify(userMetadata) });
    }

    const result = await S3.copyObject(world.getCommandParameters());
    const versionId = extractPropertyFromResults<string>(result, 'VersionId');
    world.saveCreatedObject(key, versionId || '');
    world.setResult(result);
    return result;
}

async function putObject(world: Zenko, objectName?: string, content?: string, objectSize?: number) {
    world.resetCommand();
    let finalObjectName = objectName;
    if (!finalObjectName) {
        finalObjectName = `${Utils.randomString()}`;
    }
    world.addToSaved('objectName', finalObjectName);
    world.logger.debug('Adding object', { objectName: finalObjectName });
    await uploadSetup(world, 'PutObject', content, objectSize);
    world.addCommandParameter({ key: finalObjectName });
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    const userMetadata = world.getSaved<string>('userMetadata');
    if (userMetadata) {
        world.addCommandParameter({ metadata: JSON.stringify(userMetadata) });
    }
    const result = await S3.putObject(world.getCommandParameters());
    const versionId = extractPropertyFromResults<string>(result, 'VersionId');
    const etag = extractPropertyFromResults<string>(result, 'ETag');
    if (etag) {
        world.addToSaved('objectETag', etag);
    }
    world.saveCreatedObject(finalObjectName, versionId || '');
    await uploadTeardown(world, 'PutObject');
    world.setResult(result);
    return result;
}

async function getObject(world: Zenko, objectKey: string, bucketName: string): Promise<Utils.Command> {
    const result = await S3.getObject({
        key: objectKey,
        bucket: bucketName,
    });

    return result;
}

async function headObject(world: Zenko, objectKey: string, bucketName: string): Promise<Utils.Command> {
    const result = await S3.headObject({
        key: objectKey,
        bucket: bucketName,
    });

    return result;
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
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    const results = await S3.listObjects(world.getCommandParameters());
    const objects = (JSON.parse(results.stdout || '{}') as { Contents?: AWSVersionObject[] })?.Contents || [];
    await Promise.all(objects.map(obj => {
        world.deleteKeyFromCommand('key');
        world.addCommandParameter({ key: obj.Key });
        return S3.deleteObject(world.getCommandParameters());
    }));
}

async function emptyVersionedBucket(world: Zenko) {
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    const results = await S3.listObjectVersions(world.getCommandParameters());
    const parsedResults = JSON.parse(results.stdout || '{}') as Record<string, unknown>;
    const versions = parsedResults.Versions as AWSVersionObject[] || [];
    const deleteMarkers = parsedResults.DeleteMarkers as AWSVersionObject[] || [];
    await Promise.all(deleteMarkers.map(obj => {
        world.deleteKeyFromCommand('key');
        world.addCommandParameter({ key: obj.Key });
        world.addCommandParameter({ versionId: obj.VersionId });
        return S3.deleteObject(world.getCommandParameters());
    }));
    await Promise.all(versions.map(obj => {
        world.deleteKeyFromCommand('key');
        world.addCommandParameter({ key: obj.Key });
        world.addCommandParameter({ versionId: obj.VersionId });
        return S3.deleteObject(world.getCommandParameters());
    }));
}

async function addTransitionWorkflow(this: Zenko, location: string, enabled = true) {
    let conditionOk = false;
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    const enabledStr = enabled ? 'Enabled' : 'Disabled';
    const lifecycleConfiguration = JSON.stringify({
        Rules: [
            {
                Status: enabledStr,
                Prefix: '',
                Transitions: [
                    {
                        Days: 0,
                        StorageClass: location,
                    },
                ],
            },
        ],
    });
    this.addCommandParameter({
        lifecycleConfiguration,
    });
    const commandParameters = this.getCommandParameters();
    while (!conditionOk) {
        const res = await S3.putBucketLifecycleConfiguration(commandParameters);
        conditionOk = res.err === null;
        // Wait for the transition to be accepted because the deployment of the location's pods can take some time
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
    this.resetCommand();
    this.addCommandParameter({ bucket: srcBucket });
    this.addCommandParameter({
        replicationConfiguration: JSON.stringify({
            Role: 'arn:aws:iam::root:role/s3-replication-role',
            Rules: [
                {
                    Prefix: '',
                    Destination: {
                        // eslint-disable-next-line max-len
                        // https://documentation.scality.com/Artesca/4.0.1/data_management/bucket_operations/replication_workflow/create_a_replication_workflow.html
                        Bucket: `arn:aws:s3:::${srcBucket}`,
                        StorageClass: replicationLocation,
                    },
                    Status: 'Enabled',
                },
            ],
        }),
    });
    
    const commandParameters = this.getCommandParameters();
    const res = await S3.putBucketReplication(commandParameters);
    if (res.err) {
        this.logger.error('Failed to put bucket replication', {
            srcBucket,
            replicationLocation,
            error: res.err,
        });
        throw new Error(`Failed to put bucket replication, err : ${res.err}`);
    }
}

async function verifyObjectLocation(this: Zenko, objectName: string,
    objectTransitionStatus: string, storageClass: string) {
    const objName =
        getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getLatestObjectVersion(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    let conditionOk = false;

    const startTime = Date.now();
    const timeoutMs = 5 * 60 * 1000;
    while (!conditionOk) {
        if (Date.now() - startTime > timeoutMs) {
            throw new Error(
                `verifyObjectLocation timed out after ${timeoutMs / 1000}s ` +
                `waiting for object "${objName}" to reach status "${objectTransitionStatus}" ` +
                `with storage class "${storageClass}"`
            );
        }
        const res = await S3.headObject(this.getCommandParameters());
        if (res.err?.includes('NotFound')) {
            await Utils.sleep(1000);
            continue;
        } else if (res.err) {
            break;
        }
        assert(res.stdout);
        const parsed = safeJsonParse<{
            StorageClass: string | undefined,
            Restore: string | undefined,
        }>(res.stdout);
        assert(parsed.ok);
        const expectedClass = storageClass !== '' ? storageClass : undefined;
        if (parsed.result?.StorageClass === expectedClass) {
            conditionOk = true;
        }
        if (objectTransitionStatus == 'restored') {
            const isRestored = !!parsed.result?.Restore &&
                parsed.result.Restore.includes('ongoing-request="false", expiry-date=');
            conditionOk = conditionOk && isRestored;
        } else if (objectTransitionStatus == 'cold') {
            conditionOk = conditionOk && !parsed.result?.Restore;
        }
        await Utils.sleep(1000);
    }
    assert(conditionOk);
}

async function restoreObject(this: Zenko, objectName: string, days: number) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) ||  this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getLatestObjectVersion(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    this.addCommandParameter({ restoreRequest: `Days=${days}` });
    const result = await S3.restoreObject(this.getCommandParameters());
    this.setResult(result);
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
