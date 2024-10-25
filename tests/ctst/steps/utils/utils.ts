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
import assert from 'assert';
import constants from 'common/constants';

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

async function uploadSetup(world: Zenko, action: string, body?: string) {
    if (action !== 'PutObject' && action !== 'UploadPart') {
        return;
    }
    const objectSize = world.getSaved<number>('objectSize') || 0;
    if (body || objectSize > 0) {
        const tempFileName = `${Utils.randomString()}_${world.getSaved<string>('objectName')}`;
        world.addToSaved('tempFileName', `/tmp/${tempFileName}`);
        const objectBody = body || 'a'.repeat(objectSize);
        await saveAsFile(tempFileName, objectBody);
        world.addCommandParameter({ body: world.getSaved<string>('tempFileName') });
    }
}

async function uploadTeardown(world: Zenko, action: string) {
    if (action !== 'PutObject' && action !== 'UploadPart') {
        return;
    }
    const objectSize = world.getSaved<number>('objectSize') || 0;
    if (objectSize > 0) {
        await deleteFile(world.getSaved<string>('tempFileName'));
        world.deleteKeyFromCommand('body');
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
        world.parameters.AccountName || Constants.ACCOUNT_NAME;
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

async function putObject(world: Zenko, objectName?: string, content?: string) {
    world.resetCommand();
    let finalObjectName = objectName;
    if (!finalObjectName) {
        finalObjectName = `${Utils.randomString()}`;
    }
    world.addToSaved('objectName', finalObjectName);
    world.logger.debug('Adding object', { objectName: finalObjectName });
    await uploadSetup(world, 'PutObject', content);
    world.addCommandParameter({ key: finalObjectName });
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    const userMetadata = world.getSaved<string>('userMetadata');
    if (userMetadata) {
        world.addCommandParameter({ metadata: JSON.stringify(userMetadata) });
    }
    const result = await S3.putObject(world.getCommandParameters());
    const versionId = extractPropertyFromResults<string>(result, 'VersionId');
    world.saveCreatedObject(finalObjectName, versionId || '');
    await uploadTeardown(world, 'PutObject');
    world.setResult(result);
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

    while (!conditionOk) {
        const res = await S3.headObject(this.getCommandParameters());
        if (res.err?.includes('NotFound')) {
            if (Date.now() - startTime > 300000) {
                throw new Error('Object not found after 300 seconds');
            }
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
    putObject,
    emptyNonVersionedBucket,
    emptyVersionedBucket,
    verifyObjectLocation,
    getObjectNameWithBackendFlakiness,
    restoreObject,
    addTransitionWorkflow,
};
