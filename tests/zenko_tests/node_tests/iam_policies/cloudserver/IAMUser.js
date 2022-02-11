const assert = require('assert');
const async = require('async');
const {makeGETRequest, getResponseBodyXML} = require("../../utils/request");
const s3 = require("../../s3SDK").scalityS3Client;
const iam = require('../../s3SDK').scalityIAMClient;

const userName = "username-policy-test-metadatasearch";
const bucketName = "bucket-test";

function metadataSearch(cb) {
    return makeGETRequest(`/${bucketName}`, (err, res) => {
        return getResponseBodyXML(res, (err, res) => {
            return cb();
        })
    })
}

describe('IAM Policies MetadataSearch', () => {
    before(done => {
        async.series([
            next => iam.createUser({UserName: userName}, next),
            next => s3.createBucket({Bucket: bucketName}, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    after(done => {
        async.series([
            next => iam.deleteUser({UserName: userName}, next),
            next => s3.deleteBucket({Bucket: bucketName}, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    })

    it('should list objects in V2 format', done => {
        metadataSearch(done);
    });
});
