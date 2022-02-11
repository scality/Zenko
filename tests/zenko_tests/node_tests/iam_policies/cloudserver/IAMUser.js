process.env.ZENKO_ACCESS_KEY = "TDWHZ9OWYCJZLGCAKBTT"
process.env.ZENKO_SECRET_KEY = "+Q2G7yLapU8ApDKbPfS0gQrEzmEnmd5m9wn8lqeR"
process.env.VAULT_ENDPOINT = "iam.zenko.local"
process.env.CLOUDSERVER_HOST = "s3.zenko.local"


const assert = require('assert');
const async = require('async');
const uuidV4 = require('uuid/v4');
const {makeGETRequest} = require("../../utils/request");

const iam = require('../../s3SDK').scalityIAMClient;

const userName = "username-policy-test-metadatasearch";

function metadataSearch(cb) {
    makeGETRequest(`http://${process.env.CLOUDSERVER_HOST}/s3/bucketname`, (err, res) => {
        let str = '';
        res.on('data', (chunk) => {
            str += chunk;
        });
        res.on('end', function () {
            console.log(str);
        });
    })
    return cb();
}

describe('IAM Policies MetadataSearch', () => {
    before(done => {
        async.series([
            next => iam.createUser({UserName: userName}, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    after(done => {
        async.series([
            next => iam.deleteUser({UserName: userName}, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    })

    it('should list objects in V2 format', done => {
        metadataSearch(done);
    });
});
