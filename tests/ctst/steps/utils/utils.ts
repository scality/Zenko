import { promises as fsp } from 'fs';
import { join } from 'path';
import {
    CacheHelper,
    Constants,
    Identity,
    S3,
    Utils,
    AWSCredentials,
    AWSVersionObject,
    Command,
} from 'cli-testing';
import { extractPropertyFromResults, s3FunctionExtraParams } from 'common/utils';
import Zenko from 'world/Zenko';

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

async function uploadSetup(world: Zenko, action: string) {
    if (action !== 'PutObject' && action !== 'UploadPart') {
        return;
    }
    const objectSize = world.getSaved<number>('objectSize') || 0;
    if (objectSize > 0) {
        const tempFileName = `${Utils.randomString()}_${world.getSaved<string>('objectName')}`;
        world.addToSaved('tempFileName', `/tmp/${tempFileName}`);
        const objectBody = 'a'.repeat(objectSize);
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
    }
}

async function runActionAgainstBucket(world: Zenko, action: string) {
    world.useSavedIdentity();
    const userCredentials: AWSCredentials = Identity.getCurrentCredentials();
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
        if (world.getSaved<string>('versionId')) {
            world.addCommandParameter({ versionId: world.getSaved<string>('versionId') });
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
    if (retentionMode === 'GOVERNANCE' || retentionMode === 'COMPLIANCE') {
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

async function putObject(world: Zenko, objectName?: string) {
    world.addToSaved('objectName', objectName || Utils.randomString());
    const objectNameArray = world.getSaved<string[]>('objectNameArray') || [];
    objectNameArray.push(world.getSaved<string>('objectName'));
    world.addToSaved('objectNameArray', objectNameArray);
    await uploadSetup(world, 'PutObject');
    world.addCommandParameter({ key: world.getSaved<string>('objectName') });
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    const result = await S3.putObject(world.getCommandParameters());
    world.addToSaved('versionId', extractPropertyFromResults(
        result, 'VersionId'
    ));
    await uploadTeardown(world, 'PutObject');
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

export {
    AuthorizationType,
    AuthorizationConfiguration,
    runActionAgainstBucket,
    createBucketWithConfiguration,
    getAuthorizationConfiguration,
    putObject,
    emptyNonVersionedBucket,
    emptyVersionedBucket,
};
