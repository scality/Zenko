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

    before(done => {
        async.series([
            next => clientAdmin.createAccount(accountName, accountInfo, next),
            next => clientAdmin.generateAccountAccessKey(accountName, next, { externalAccessKey, externalSecretKey }),
        ], function(err, results) {
            if (err) {
                return done(err);
            }
            iamAccountClient = VaultClient.getIamClient(externalAccessKey, externalSecretKey);
            return done();
        });
    })

    for (const policyToTest of policiesToTest) {
        it(`Should not be granted right with policy: ${policyToTest.PolicyName}`, done => {
            policyToTest.function(...Object.values(policyToTest.params), (err, res) => {
                console.log(err, res);
            })
        })

        it(`Should be granted right with policy: ${policyToTest.PolicyName}`, done => {
            async.series([
                next => {
                    console.log('create policy and attach to user')
                },
                next => {
                    policyToTest.function(...Object.values(policyToTest.params), (err, res) => {
                    })
                }
            ], function(err, result) {
                return done();
            })
        })
    }
});
