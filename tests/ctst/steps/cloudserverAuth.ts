import { Given, Then } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { Utils, S3 } from 'cli-testing';
import { strict as assert } from 'assert';

Given('an object with {string} delete policy', async function (this: Zenko, allow: string) {
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addToSaved('objectName', Utils.randomString());
    this.addCommandParameter({ key: this.getSaved<string>('objectName') });
    let objectNameArray = this.getSaved<string[]>('objectNameArray');
    if (!objectNameArray) {
        objectNameArray = [];
    }
    objectNameArray.push(this.getSaved<string>('objectName'));
    this.addToSaved('objectNameArray', objectNameArray);
    await S3.putObject(this.getCommandParameters());
    if (allow !== 'allow') {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: this.getSaved<string>('objectName') });
        this.addCommandParameter({
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Deny',
                        Principal: '*',
                        Action: 's3:*',
                        Resource: `arn:aws:s3:::${this.getSaved<string>('bucketName')}`
                            + `/${this.getSaved<string>('objectName')}`,
                    },
                ],
            }),
        });
        await S3.putBucketPolicy(this.getCommandParameters());
    }
});

Then('it {string} pass Vault authentication', function (this: Zenko, should: string) {
    this.cleanupEntity();

    // change to relevant errord


    /* eslint-disable-next-line */
    console.log('l137 cloudserverAuth.ts -- this.getResult(), action: ', this.getResult(), this.getSaved<string>('action'));
    if (should === 'should') {
        assert.strictEqual(this.getResult().err, null);
    } else {
        assert.notStrictEqual(this.getResult().err, null);
    }
});

