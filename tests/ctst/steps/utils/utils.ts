import { Constants, S3, Utils } from 'cli-testing';
import { extractPropertyFromResults, s3FunctionExtraParams } from 'common/utils';
import Zenko, { EntityType, UserCredentials } from 'world/Zenko';

async function runActionAgainstBucket(this: Zenko, action: string) {
    let userCredentials: UserCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.getSaved<EntityType>('type'))) {
        userCredentials = this.parameters.IAMSession;
        this.resumeRootOrIamUser();
    } else {
        userCredentials = this.parameters.AssumedSession!;
        this.resumeAssumedRole();
    }
    switch (action) {
        case 'MetadataSearch': {
            this.setResult(await this.metadataSearchResponseCode(userCredentials,
                this.getSaved<string>('bucketName')));
            break;
        }
        case 'PutObjectVersion': {
            this.setResult(await this.putObjectVersionResponseCode(userCredentials,
                this.getSaved<string>('bucketName'), this.getSaved<string>('objectName')));
            break;
        }
        default: {
            this.resetCommand();
            this.addToSaved('ifS3Standard', true);
            this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
            if (this.getSaved<string>('versionId')) {
                this.addCommandParameter({ versionId: this.getSaved<string>('versionId') });
            }
            // if copy object, set copy source as the saved object name, and the key as a new object name
            if (action === 'CopyObject') {
                this.addCommandParameter({
                    copySource: `${this.getSaved<string>('bucketName')}/${this.getSaved<string>('objectName')}`,
                });
                this.addCommandParameter({ key: 'copyObject' });
            } else if (this.getSaved<string>('objectName')) {
                this.addCommandParameter({ key: this.getSaved<string>('objectName') });
            }
            const usedAction = action.charAt(0).toLowerCase() + action.slice(1);
            const actionCall = S3[usedAction];
            if (actionCall) {
                if (usedAction in s3FunctionExtraParams) {
                    this.addCommandParameter(s3FunctionExtraParams[usedAction]);
                }
                this.setResult(await actionCall(this.getCommandParameters()));
            } else {
                throw new Error(`Action ${usedAction} is not supported yet`);
            }
            break;
        }
    }
}

async function createBucketWithConfiguration(
    this: Zenko,
    bucketName: string,
    withVersioning: string,
    withObjectLock: string,
    retentionMode: string) {
    this.resetCommand();
    const preName = (this.parameters.AccountName || Constants.ACCOUNT_NAME);
    const usedBucketName = bucketName
        || `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.addToSaved('bucketName', usedBucketName);
    this.addCommandParameter({ bucket: usedBucketName });
    if (withObjectLock === 'with') {
        // Empty strings are used to pass parameters that are used as a flag and do not require a value
        this.addCommandParameter({ objectLockEnabledForBucket: ' ' });
    }
    await S3.createBucket(this.getCommandParameters());
    if (withVersioning === 'with') {
        this.addCommandParameter({ versioningConfiguration: 'Status=Enabled' });
        await S3.putBucketVersioning(this.getCommandParameters());
    }
    if (retentionMode === 'GOVERNANCE' || retentionMode === 'COMPLIANCE') {
        this.resetCommand();
        this.addCommandParameter({ bucket: usedBucketName });
        this.addCommandParameter({
            objectLockConfiguration: '{ ' +
                '"ObjectLockEnabled": "Enabled",' +
                '"Rule": {' +
                '"DefaultRetention":' +
                `{ "Mode": "${retentionMode}", "Days": 50 }}}`,
        });
        await S3.putObjectLockConfiguration(this.getCommandParameters());
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
