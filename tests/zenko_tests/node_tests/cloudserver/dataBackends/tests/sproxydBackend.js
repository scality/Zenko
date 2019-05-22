const assert = require('assert');
// const async = require('async');
// const bucketclient = require('bucketclient');
// const crypto = require('crypto');
const uuidV4 = require('uuid/v4');

const mdWrapper = require('arsenal').storage.metadata.MetadataWrapper;

const s3 = require('../../../s3SDK').scalityS3Client;

const bucket = `sproxyd-bucket-${uuidV4()}`;
const key = `sproxyd-key-${uuidV4()}`;

const location = 'ringsproxydbackend';

function checkDataStored(cb) {
    mdWrapper.getObjectMD(bucket, key, {}, log, (err, storedMD) => {
        assert.ifError(err);
        console.log(`\n------stored metadata format: ${storedMD}`);
        return cb();
    });
}

describe.only('With Sproxyd as data backend', () => {
    beforeEach(() => {
        s3.createBucket({ Bucket: bucket, LocationConstraint: location});
    });

    afterEach(() => {
        s3.deleteBucket({ Bucket: bucket });
    })
    it('should put an object successfully', done => {
        s3.putObject({ Bucket: bucket, Key: key }, err => {
            assert.ifError(err);
            checkDataStored(done);
            // done();
        });
    });
});
