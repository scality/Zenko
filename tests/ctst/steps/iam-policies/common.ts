import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';

When('the user tries to perform {string} {string} on the bucket {string} the object', async function (ifS3Standard: string, action: string, ifObject: string) {
    if (ifS3Standard === 'notS3Standard'){
        this.saved.ifS3Standard = false;
        this.result = await this.metadataSearchResponseCode(this.parameters.IAMSession, this.saved.bucketName);
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
    console.log("SUCCESS RESPONSE: ", this.result);
    assert.strictEqual(this.result.statusCode, 200);
});