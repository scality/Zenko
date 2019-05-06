const assert = require('assert');
const crypto = require('crypto');
const async = require('async');

const s3 = require('../../../s3SDK').scalityS3Client;

const bucket = `sproxyd-bucket-${Date.now()}`;

describe('Sproxyd data backend', () => {
    before(() => {
        s3.createBucket({ Bucket: bucket, LocationConstraint: })
    })
    it('should put an object successfully', () => {

    });
});
