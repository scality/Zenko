import { Given, Then, When } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { Constants, Utils, S3 } from 'cli-testing';
import { extractPropertyFromResults } from '../common/utils';
import { strict as assert } from 'assert';

// Given('a bucket {string} object lock mode', async function (this: Zenko, withObjectLock: string) {

// });



Given('a bucket {string} versioning, {string} retention mode, {string} ACL set via canonical ID',
    async function (this: Zenko, withVersioning: string, withRetention: string, withBucketAclViaCanonicalId: string) {
        this.resetCommand();
        const preName = (this.parameters.AccountName || Constants.ACCOUNT_NAME);
        const usedBucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
        this.addToSaved('bucketName', usedBucketName);
        /* eslint-disable-next-line */
        console.log('LOG NAME: l14 -- cloudserverAuth.ts -- usedBucketName', usedBucketName);
        this.addCommandParameter({ bucket: usedBucketName });
        if (withVersioning === 'with') {
            this.addCommandParameter({ versioningConfiguration: 'Status=Enabled' });
            await S3.putBucketVersioning(this.getCommandParameters());
        }
        if (withRetention === 'with') {
            this.resetCommand();
            this.addCommandParameter({ bucket: usedBucketName });
            this.addCommandParameter({
                objectLockEnabledForBucket: ' ',
            });
        }
        const ret = await S3.createBucket(this.getCommandParameters());
        /* eslint-disable-next-line */
        console.log('l23 -- cloudserverAuth.ts -- createdBucket', ret);

        /* eslint-disable-next-line */
        console.log('l23 -- cloudserverAuth.ts -- createdBucket', ret);
        if (withBucketAclViaCanonicalId === 'with') {
            this.resetCommand();
            this.addCommandParameter({ bucket: usedBucketName });
            this.addCommandParameter({ grantFullControl: 'emailaddress=user1@example.com' });
            await S3.putBucketAcl(this.getCommandParameters());
        }

    });

Given('an object that {string} {string} ACL set via canonical ID',
    async function (this: Zenko, objectExists: string, withObjectAclViaCanonicalId: string) {
        this.resetCommand();
        if (objectExists === 'exists') {
            this.addToSaved('objectName', Utils.randomString());
            this.addCommandParameter({ key: this.getSaved<string>('objectName') });
            this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
            this.addToSaved('versionId', extractPropertyFromResults(
                await S3.putObject(this.getCommandParameters()), 'VersionId'
            ));
        }
        if (withObjectAclViaCanonicalId === 'with') {
            this.resetCommand();
            this.addCommandParameter({ key: this.getSaved<string>('objectName') });
            this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
            this.addCommandParameter({
                accessControlList: {
                    Grants: [
                        {
                            Grantee: {
                                Type: 'CanonicalUser',
                                ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                DisplayName: 'Example User',
                            },
                            Permission: 'FULL_CONTROL',
                        },
                    ],
                },
            });
            await S3.putObjectAcl(this.getCommandParameters());
        }
    });


When('I create a bucket with an ACL where users are identified by email address', async function (this: Zenko) {
    this.resetCommand();
    const preName = (this.parameters.AccountName || Constants.ACCOUNT_NAME);
    const usedBucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.addToSaved('bucketName', usedBucketName);
    this.addCommandParameter({ bucket: usedBucketName });
    this.addCommandParameter({
        accessControlList: '{ ' +
            '"Owner": {' +
            '"ID": "Your-Owner-ID",' +
            '"DisplayName": "Your-Owner-Name"' +
            '},' +
            '"Grants": [' +
            '{' +
            '"Grantee": {' +
            '"xsi:type": "AmazonCustomerByEmail",' +
            '"EmailAddress": "example@example.com' +
            '"},' +
            '"Permission": "FULL_CONTROL"}]}',
    });
    this.setResult(await S3.createBucket(this.getCommandParameters()));
});

When('I perform {string} on a bucket {string} expectedBucketOwner parameter',
    async function (this: Zenko, action: string, withExpectedBucketOwner: string) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        /* eslint-disable-next-line */
        console.log('LOG NAME: l14 -- cloudserverAuth.ts -- action + saved bucket name', action, this.getSaved<string>('bucketName'))

        if (action === 'PutObjectRetention') {
            this.addCommandParameter({ retention: 'mode=COMPLIANCE, retain-until-date=2021-01-01T00:00:00.000Z' });
        }
        if (withExpectedBucketOwner === 'with') {
            this.addCommandParameter({
                expectedBucketOwner: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            });
        }

        /* for logging, remove after */
        this.addToSaved('action', action)
        /* eslint-disable-next-line */

        const usedAction = action.charAt(0).toLowerCase() + action.slice(1);

        const actionCall = S3[usedAction];
        if (actionCall) {
            console.log('LOG : l123 -- cloudserverAuth.ts -- actionCall', usedAction)
            this.setResult(await actionCall(this.getCommandParameters()));
            console.log('LOG : l123 -- cloudserverAuth.ts -- AFTER actionCall', usedAction)
        }
        else {
            throw new Error(`Action ${usedAction} is not supported yet`);
        }
    });


When('I perform {string} on an object {string} ACL set via header',
    async function (this: Zenko, action: string, withAclViaHeader: string) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        /* eslint-disable-next-line */
            console.log('LOG NAME: l14 -- cloudserverAuth.ts -- action + saved bucket name', action, this.getSaved<string>('bucketName'));

        this.addCommandParameter({ key: this.getSaved<string>('objectName') });
        if (action === 'PutObjectRetention') {
            this.addCommandParameter({ retention: 'mode=COMPLIANCE, retain-until-date=2021-01-01T00:00:00.000Z' });
        }
        if (withAclViaHeader === 'with') {
            this.addCommandParameter({
                accessControlPolicy: '{ ' +
                    '"Owner": {' +
                    '"ID": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",' +
                    '"DisplayName": "Your-Owner-Name"' +
                    '},' +
                    '"Grants": [' +
                    '{' +
                    '"Grantee": {' +
                    '"xsi:type": "AmazonCustomerByEmail",' +
                    '"EmailAddress": "example@example.com' +
                    '"},' +
                    '"Permission": "FULL_CONTROL"}]}',
            }
            );
        }
        const usedAction = action.charAt(0).toLowerCase() + action.slice(1);
        const actionCall = S3[usedAction];
        if (actionCall) {
            this.setResult(await actionCall(this.getCommandParameters()));
        }
        else {
            throw new Error(`Action ${usedAction} is not supported yet`);
        }
    });


// Then('I {string} pass Vault authentication', function (this: Zenko, should: string) {
//     this.cleanupEntity();

//     // change to relevant errord


//     /* eslint-disable-next-line */
//     console.log('l137 cloudserverAuth.ts -- this.getResult(), action: ', this.getResult(), this.getSaved<string>('action'));
//     if (should === 'should') {
//         assert.strictEqual(this.getResult().err, null);
//     } else {
//         assert.notStrictEqual(this.getResult().err, null);
//     }
// });

