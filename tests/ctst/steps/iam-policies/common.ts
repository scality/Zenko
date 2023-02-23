import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { EntityType } from "../../world/Zenko";
import { S3 } from 'cli-testing';
import { s3FunctionExtraParams } from '../../common/utils';

When('the user tries to perform {string} {string} on the bucket', async function (ifS3Standard: string, action: string) {
    
    let userCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.saved.type)) {
        userCredentials = this.parameters.IAMSession;
    } else {
        userCredentials = this.parameters.AssumedSession;
    }
    if (ifS3Standard === 'notS3Standard'){
        this.saved.ifS3Standard = false;
        // Handle Metadatasearch special case
        if (action === 'MetadataSearch') {
            this.result = await this.metadataSearchResponseCode(userCredentials, this.saved.bucketName);
        } else {
            throw new Error(`Action ${action} is not supported yet`);
        }
        // Handle other cases
    } else {
        this.resetCommand();
        this.saved.ifS3Standard = true;
        this.addCommandParameter({bucket: this.saved.bucketName});
        if (this.saved.objectName) {
            this.addCommandParameter({key: this.saved.objectName});
        }
        if (this.saved.versionId) {
            this.addCommandParameter({versionId: this.saved.versionId});
        }
        action = action.charAt(0).toLowerCase() + action.slice(1);
        const actionCall = (S3 as {[key: string]: Function})[action];
        if (actionCall) {
            if (action in s3FunctionExtraParams) {
                this.addCommandParameter(s3FunctionExtraParams[action]);
            }
            this.result = await actionCall(this.getCommandParameters());
        } else {
            throw new Error(`Action ${action} is not supported yet`);
        }
    }
});

Then('the user should be able to perform successfully the {string} action', function (action : string) {
    this.endForType();
    if (this.saved.ifS3Standard) {
        assert.strictEqual(this.result?.err, null);
    } else {
        assert.strictEqual(this.result?.statusCode, 200);
    }
});

Then('the user should receive {string} error', function (error : string) {
    this.endForType();
    assert.strictEqual(this.result.err.includes(error), true);
});