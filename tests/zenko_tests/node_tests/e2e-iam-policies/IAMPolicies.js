const assert = require('assert');
const { scalityS3Client, awsS3Client } = require('../s3SDK');
const async = require('async');

const VaultClient = require('../smoke_tests/vault_admin_and_IAM_API_tests/VaultClient');
const clientAdmin = VaultClient.getAdminClient();
const accountName = 'iam-api-test-account';
const accountInfo = {
    email: `${accountName}@test.com`,
    password: 'test',
};
const externalAccessKey = 'DZMMJUPWIUK8IWXRP0HQ';
const externalSecretKey = 'iTuJdlidzrLipymvAGrLP66Yxghl4NQxLZR3cLlu';
const userName = 'iam-api-test-user'
const randomPath = '/random/path/';

const policiesToTest = [
    {
        PolicyName: "s3:CreateBucket",
        function: scalityS3Client.createBucket,
        params: {
            Bucket: "Bucket-testkillian"
        }
    },
    {
        PolicyName: "s3:DeleteBucket",
        function: scalityS3Client.deleteBucket,
        params: {
            Bucket: "Bucket-testkillian"
        }
    }
]

describe('Test policies', function() {

    let iamAccountClient = null;

    for (const policyToTest of policiesToTest) {
        it(`Should not be granted right with policy: ${policyToTest.PolicyName}`, done => {
            policyToTest.function(...Object.values(policyToTest.params), (err, res) => {
                console.log(err);
                //should not work
            })
        })

        it(`Should be granted right with policy: ${policyToTest.PolicyName}`, done => {
            async.series([
                next => {
                    //create policy with policyToTest and attach to user
                    console.log('test')
                },
                next => {
                    policyToTest.function(...Object.values(policyToTest.params), (err, res) => {
                        //should work
                    })
                }
            ])
        })
    }
});
