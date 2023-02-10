import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import {EntityType} from "../../world/Zenko";

When('the user tries to perform {string} {string} on the bucket {string} the object', async function (ifS3Standard: string, action: string, ifObject: string) {
    let userCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.saved.type)) {
        userCredentials = this.parameters.IAMSession;
    } else {
        userCredentials = this.parameters.AssumedSession;
    }
    console.log("userCredentialsuserCredentialsuserCredentials");
    console.log(userCredentials);
    console.log("thisthisthis");
    console.log(this);
    if (ifS3Standard === 'notS3Standard'){
        this.saved.ifS3Standard = false;
        this.result = await this.metadataSearchResponseCode(userCredentials, this.saved.bucketName);
    } else {
        this.resetCommand();
        this.saved.ifS3Standard = true;
        this.addCommandParameter({bucket: this.saved.bucketName});
        if (ifObject === 'with') {
            this.addCommandParameter({key: this.saved.objectName});
        }
        this.result = await this.restoreObjectResponseCode();
    }
});

Then('the user should be able to perform successfully', function () {
    this.endForType();
    if (this.saved.ifS3Standard) {
        assert.strictEqual(this.result?.err?.includes("AccessDenied"), false);
    } else {
        assert.strictEqual(this.result?.statusCode, 200);
    }
});