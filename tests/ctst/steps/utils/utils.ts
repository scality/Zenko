import { Constants, S3, Utils } from 'cli-testing';
import { extractPropertyFromResults, s3FunctionExtraParams } from 'common/utils';
import Zenko, { EntityType, UserCredentials } from 'world/Zenko';

async function runActionAgainstBucket(context: Zenko, action: string) {
    let userCredentials: UserCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(context.getSaved<EntityType>('type'))) {
        userCredentials = context.parameters.IAMSession;
        context.resumeRootOrIamUser();
    } else {
        userCredentials = context.parameters.AssumedSession!;
        context.resumeAssumedRole();
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
            context.addCommandParameter({ key: 'copyObject' });
        } else if (context.getSaved<string>('objectName')) {
            context.addCommandParameter({ key: context.getSaved<string>('objectName') });
        }
        // iF PUT BUCKET POLICY, CREATETHE POLICY USING THE CURRENT BUCKET NAME IN THE RESOURCE
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
        if (action === 'UploadPart') {
            context.addCommandParameter({ uploadId: 'fakeId' });
            context.addCommandParameter({ partNumber: '1' });
        }
        if (action === 'UploadPartCopy') {
            context.addCommandParameter({ uploadId: 'fakeId' });
            context.addCommandParameter({ partNumber: '1' });
            context.addCommandParameter({
                copySource: `${context.getSaved<string>('bucketName')}/${context.getSaved<string>('objectName')}` });
        }
        const usedAction = action.charAt(0).toLowerCase() + action.slice(1);
        const actionCall = S3[usedAction];
        if (actionCall) {
            if (usedAction in s3FunctionExtraParams) {
                s3FunctionExtraParams[usedAction].forEach(param => context.addCommandParameter(param));
            }
            context.setResult(await actionCall(context.getCommandParameters()));
        } else {
            throw new Error(`Action ${usedAction} is not supported yet`);
        }
        break;
    }
    }
}

async function createBucketWithConfiguration(
    context: Zenko,
    bucketName: string,
    withVersioning: string,
    withObjectLock: string,
    retentionMode: string) {
    context.resetCommand();
    const preName = (context.parameters.AccountName || Constants.ACCOUNT_NAME);
    const usedBucketName = bucketName
        || `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    context.addToSaved('bucketName', usedBucketName);
    context.addCommandParameter({ bucket: usedBucketName });
    if (withObjectLock === 'with') {
        // Empty strings are used to pass parameters that are used as a flag and do not require a value
        context.addCommandParameter({ objectLockEnabledForBucket: ' ' });
    }
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
    context.addCommandParameter({ key: context.getSaved<string>('objectName') });
    context.addCommandParameter({ bucket: context.getSaved<string>('bucketName') });
    context.addToSaved('versionId', extractPropertyFromResults(
        await S3.putObject(context.getCommandParameters()), 'VersionId'
    ));
}

export {
    runActionAgainstBucket,
    createBucketWithConfiguration,
    putObject,
};
