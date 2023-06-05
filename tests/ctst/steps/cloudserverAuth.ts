import { Given, When, Then } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { Utils, S3, IAM, Constants } from 'cli-testing';
import { strict as assert } from 'assert';
import { extractPropertyFromResults } from '../common/utils';

interface DeleteObjectsResult {
    Deleted?: {
        Key: string;
        DeleteMarker?: boolean;
        DeleteMarkerVersionId?: string;
    }[];
    Errors?: {
        Key: string;
        VersionId?: string;
        Code: string;
        Message: string;
    }[];
}

// Given('an object with user given {string} delete policy', async function (this: Zenko, allow: string) {
//     this.resetCommand();
//     this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
//     this.addToSaved('objectName', Utils.randomString());
//     this.addCommandParameter({ key: this.getSaved<string>('objectName') });
//     let objectNameArray = this.getSaved<string[]>('objectNameArray');
//     if (!objectNameArray) {
//         objectNameArray = [];
//     }
//     objectNameArray.push(this.getSaved<string>('objectName'));
//     this.addToSaved('objectNameArray', objectNameArray);
//     await S3.putObject(this.getCommandParameters());
//     if (allow !== 'Allow') {
//         console.log("l53 cloudserverAuth.ts -- allow !== 'Allow' case");
//         this.resetCommand();

//         this.addCommandParameter({ policyName: `${Constants.POLICY_NAME_TEST}${Utils.randomString()}` });
//         this.addCommandParameter({
//             policyDocument: JSON.stringify({
//                 Version: '2012-10-17',
//                 Statement: [
//                     {
//                         Effect: 'Deny',
//                         Action: 's3:*',
//                         Resource: `arn:aws:s3:::${this.getSaved<string>('bucketName')}`
//                                              + `/${this.getSaved<string>('objectName')}`,
//                     },
//                 ],
//             }),
//         });
//         this.addToSaved('policyArn',
//             extractPropertyFromResults(await IAM.createPolicy(this.getCommandParameters()), 'Policy', 'Arn'));

//         // attach the IAM policy to the user
//         this.resetCommand();
//         this.addCommandParameter({ policyArn: this.getSaved<string>('policyArn') });
//         this.addCommandParameter({ userName: this.getSaved<string>('userName') });
//         let ret = await IAM.attachUserPolicy(this.getCommandParameters());
//         /* eslint-disable-next-line */
//         console.log('l60 cloudserverAuth.ts -- ret attach: ', ret);
        
//         // TODO delete this as it's for testing
//         this.resetCommand();
//         this.addCommandParameter({ userName: this.getSaved<string>('userName') });
//          ret = await IAM.listAttachedUserPolicies(this.getCommandParameters());
//         /* eslint-disable-next-line */
//         console.log('l84 cloudserverAuth.ts -- username, policy ARN, ret: ',
//         this.getSaved<string>('userName'),
//         this.getSaved<string>('policyArn'),
//         this.getSaved<string>('objectName'),
//         ret);

//         // TODO delete this as it's for testing
//         this.resetCommand();
//         this.addCommandParameter({ policyArn: this.getSaved<string>('policyArn') });
//         ret = await IAM.getPolicy(this.getCommandParameters());
//         /* eslint-disable-next-line */
//         console.log('l77 cloudserverAuth.ts -- policy: ',
//         ret);


//         // this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
//         // this.addCommandParameter({ key: this.getSaved<string>('objectName') });
//         // this.addCommandParameter({
//         //     policy: JSON.stringify({
//         //         Version: '2012-10-17',
//         //         Statement: [
//         //             {
//         //                 Effect: 'Deny',
//         //                 Principal: '*',
//         //                 Action: 's3:*',
//         //                 Resource: `arn:aws:s3:::${this.getSaved<string>('bucketName')}`
//         //                     + `/${this.getSaved<string>('objectName')}`,
//         //             },
//         //         ],
//         //     }),
//         // });
//         // await S3.putBucketPolicy(this.getCommandParameters());
//     }
// });

When('the user tries to perform DeleteObjects', async function (this: Zenko) {
    this.resetCommand();
    this.resumeRootOrIamUser();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    let keys = '';
    const objectNames = this.getSaved<string[]>('objectNameArray');
    objectNames.forEach((objectName, i) => {
        let key = `{Key=${objectName}}`;
        if (i < objectNames.length - 1) {
            key += ',';
        }
        keys += key;
    });
    this.addCommandParameter({ delete: `Objects=[${keys}]` });
    this.setResult(await S3.deleteObjects(this.getCommandParameters()));
});

Then('it {string} pass Vault authentication', function (this: Zenko, should: string) {
    this.cleanupEntity();

    // change to relevant errord


    /* eslint-disable-next-line */
    console.log('l63 cloudserverAuth.ts -- this.getResult(), action: ', this.getResult(), this.getSaved<string>('action'));
    console.log('l64 cloudserverAuth.ts -- this.getResult(), action stdout: ', this.getResult().stdout, this.getSaved<string>('action'));
    
    if (should === 'should') {
        assert.strictEqual(this.getResult().err, null);
        if (this.getResult().stdout) {
            let stdout = JSON.parse(this.getResult().stdout!);
            console.log('l66 cloudserverAuth.ts -- stdout: ', stdout);
            if (stdout.Error) {
                throw new Error(`Expected no error but got ${stdout.Errors}`);
            }
        }
    } else {
        if (this.getResult().stdout) {
            let stdout = JSON.parse(this.getResult().stdout!);
            console.log('l66 cloudserverAuth.ts -- stdout error case: ', stdout);
            if (!stdout.Errors) {
                throw new Error(`Expected error but got ${stdout.Errors}`);
            }
        }
    }
});

