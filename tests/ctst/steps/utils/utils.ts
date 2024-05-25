import { promises as fsp } from 'fs';
import { join } from 'path';
import { CacheHelper, Constants, S3, Utils } from 'cli-testing';
import { extractPropertyFromResults, s3FunctionExtraParams } from 'common/utils';
import Zenko, { EntityType, UserCredentials } from 'world/Zenko';

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

async function uploadSetup(context: Zenko, action: string) {
    if (action !== 'PutObject' && action !== 'UploadPart') {
        return;
    }
    const objectSize = context.getSaved<number>('objectSize') || 0;
    if (objectSize > 0) {
        const tempFileName = `${Utils.randomString()}_${context.getSaved<string>('objectName')}`;
        context.addToSaved('tempFileName', `/tmp/${tempFileName}`);
        const objectBody = 'a'.repeat(objectSize);
        await saveAsFile(tempFileName, objectBody);
        context.addCommandParameter({ body: context.getSaved<string>('tempFileName') });
    }
}
async function uploadTeardown(context: Zenko, action: string) {
    if (action !== 'PutObject' && action !== 'UploadPart') {
        return;
    }
    const objectSize = context.getSaved<number>('objectSize') || 0;
    if (objectSize > 0) {
        await deleteFile(context.getSaved<string>('tempFileName'));
    }
}

async function runActionAgainstBucket(context: Zenko, action: string) {
    let userCredentials: UserCredentials;
    switch (context.getSaved<EntityType>('type')) {
    case EntityType.IAM_USER:
        userCredentials = context.parameters.IAMSession;
        context.resumeIamUser();
        break;
    case EntityType.ASSUME_ROLE_USER:
    case EntityType.DATA_CONSUMER:
    case EntityType.ASSUME_ROLE_USER_CROSS_ACCOUNT:
    case EntityType.STORAGE_ACCOUNT_OWNER:
    case EntityType.STORAGE_MANAGER:
        userCredentials = context.parameters.AssumedSession!;
        context.resumeAssumedRole();
        break;
    default:
        userCredentials = {
            AccessKeyId: context.parameters.AccessKey!,
            SecretAccessKey: context.parameters.SecretKey!,
        };
        context.resetGlobalType();
        break;
    }
    if (!userCredentials) {
        throw new Error('User credentials not set. '
            + 'Make sure the `IAMSession` and `AssumedSession` world parameter are defined.');
    }
    switch (action) {
    case 'MetadataSearch': {
        context.setResult(await context.metadataSearchResponseCode(userCredentials,
            context.getSaved<string>('bucketName')));
        break;
    }
    case 'PutObjectVersion': {
        context.setResult(await context.putObjectVersionResponseCode(userCredentials,
            context.getSaved<string>('bucketName'), context.getSaved<string>('objectName')));
        break;
    }
    default: {
        context.resetCommand();
        context.addToSaved('ifS3Standard', true);
        context.addCommandParameter({ bucket: context.getSaved<string>('bucketName') });
        if (context.getSaved<string>('versionId')) {
            context.addCommandParameter({ versionId: context.getSaved<string>('versionId') });
        }
        // if copy object, set copy source as the saved object name, and the key as a new object name
        if (action === 'CopyObject') {
            context.addCommandParameter({
                copySource: `${context.getSaved<string>('bucketName')}/${context.getSaved<string>('objectName')}`,
            });
            context.addCommandParameter({ key: context.getSaved<string>('copyObject') || 'copyObject' });
        } else if (context.getSaved<string>('objectName')) {
            context.addCommandParameter({ key: context.getSaved<string>('objectName') });
        }
        if (action === 'PutBucketPolicy') {
            context.addCommandParameter({
                policy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: '*',
                        Action: 's3:*',
                        Resource: `arn:aws:s3:::${context.getSaved<string>('bucketName')}/*`,
                    }],
                }),
            });
        }
        await uploadSetup(context, action);
        if (action === 'UploadPart') {
            context.addCommandParameter({ uploadId: context.getSaved<string>('uploadId') || 'fakeId' });
            const partNumber = context.getSaved<number>('partNumber') + 1 || 1;
            context.addToSaved('partNumber', partNumber);
            context.addCommandParameter({ partNumber: `${partNumber}` });
        }
        if (action === 'UploadPartCopy') {
            context.addCommandParameter({ uploadId: context.getSaved<string>('uploadId') || 'fakeId' });
            const partNumber = context.getSaved<number>('partNumber') + 1 || 1;
            context.addToSaved('partNumber', partNumber);
            context.addCommandParameter({ partNumber: `${partNumber}` });
            context.addCommandParameter({
                copySource: `${context.getSaved<string>('bucketName')}/${context.getSaved<string>('objectName')}`,
            });
            context.addCommandParameter({ key: context.getSaved<string>('copyObject') || 'copyObject' });
        }
        if (action === 'PutBucketCors') {
            CacheHelper.forceMode = 'cli';
        }
        if (context.getSaved<string>('uploadId')) {
            context.addCommandParameter({ uploadId: context.getSaved<string>('uploadId') });
        }
        const usedAction = action.charAt(0).toLowerCase() + action.slice(1);
        const actionCall = S3[usedAction];
        if (actionCall) {
            if (usedAction in s3FunctionExtraParams) {
                s3FunctionExtraParams[usedAction].forEach(param => {
                    world.logger.debug('Adding parameter', { param });
                    // Keys that are set in the scenarios take precedence over the
                    // ones set in the extra params.
                    const key = Object.keys(param)[0];
                    if (!context.getSaved<string>(key)) {
                        context.addCommandParameter(param);
                    } else {
                        context.addCommandParameter({ [key]: context.getSaved<string>(key) });
                    }
                });
            }
            context.setResult(await actionCall(context.getCommandParameters()));
            await uploadTeardown(context, action);
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
    context: Zenko,
    bucketName: string,
    withVersioning?: string,
    withObjectLock?: string,
    retentionMode?: string) {
    context.resetCommand();
    const preName = context.getSaved<string>('accountName') ||
        context.parameters.AccountName || Constants.ACCOUNT_NAME;
    const usedBucketName = bucketName
        || `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    context.addToSaved('bucketName', usedBucketName);
    context.addCommandParameter({ bucket: usedBucketName });
    if (withObjectLock === 'with') {
        // Empty strings are used to pass parameters that are used as a flag and do not require a value
        context.addCommandParameter({ objectLockEnabledForBucket: ' ' });
    }
    world.logger.debug('Creating bucket',
        { bucket: usedBucketName, withObjectLock, retentionMode, withVersioning });
    await S3.createBucket(context.getCommandParameters());
    if (withVersioning === 'with') {
        context.addCommandParameter({ versioningConfiguration: 'Status=Enabled' });
        await S3.putBucketVersioning(context.getCommandParameters());
    }
    if (retentionMode === 'GOVERNANCE' || retentionMode === 'COMPLIANCE') {
        context.resetCommand();
        context.addCommandParameter({ bucket: usedBucketName });
        context.addCommandParameter({
            objectLockConfiguration: '{ ' +
                '"ObjectLockEnabled": "Enabled",' +
                '"Rule": {' +
                '"DefaultRetention":' +
                `{ "Mode": "${retentionMode}", "Days": 50 }}}`,
        });
        await S3.putObjectLockConfiguration(context.getCommandParameters());
    }
}

async function putObject(context: Zenko, objectName?: string) {
    context.addToSaved('objectName', objectName || Utils.randomString());
    const objectNameArray = context.getSaved<string[]>('objectNameArray') || [];
    objectNameArray.push(context.getSaved<string>('objectName'));
    context.addToSaved('objectNameArray', objectNameArray);
    await uploadSetup(context, 'PutObject');
    context.addCommandParameter({ key: context.getSaved<string>('objectName') });
    context.addCommandParameter({ bucket: context.getSaved<string>('bucketName') });
    const result = await S3.putObject(context.getCommandParameters());
    context.addToSaved('versionId', extractPropertyFromResults(
        result, 'VersionId'
    ));
    await uploadTeardown(context, 'PutObject');
    return result;
}

function getAuthorizationConfiguration(context: Zenko): AuthorizationConfiguration {
    return {
        Identity: context.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Identity
            || AuthorizationType.NO_RESOURCE,
        Resource: context.getSaved<AuthorizationConfiguration>('authzConfiguration')?.Resource
            || AuthorizationType.NO_RESOURCE,
    };
}

export {
    AuthorizationType,
    AuthorizationConfiguration,
    runActionAgainstBucket,
    createBucketWithConfiguration,
    getAuthorizationConfiguration,
    putObject,
};
