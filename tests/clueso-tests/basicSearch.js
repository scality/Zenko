const assert = require('assert');
const s3Client = require('../utils/s3SDK');

const objectKey = 'findMe';
const hiddenKey = 'leaveMeAlone';
const userMetadata = {
    food: 'pizza' };

describe('Basic search', () => {
    const bucketName = `basicsearchmebucket${Date.now()}`;
    before(done => {
        s3Client.createBucket({ Bucket: bucketName }, err => {
            if (err) {
                return done(err);
            }
            return s3Client.putObject({ Bucket: bucketName, Key: objectKey,
                Metadata: userMetadata }, err => {
                if (err) {
                    return done(err);
                }
                return s3Client.putObject({ Bucket: bucketName,
                    Key: hiddenKey },
                    err => {
                        // give ingestion pipeline some time
                        setTimeout(() => done(err), 45000);
                    });
            });
        });
    });

    after(done => {
        s3Client.deleteObjects({ Bucket: bucketName, Delete: { Objects: [
            { Key: objectKey },
            { Key: hiddenKey }],
        } },
            err => {
                if (err) {
                    return done(err);
                }
                return s3Client.deleteBucket({ Bucket: bucketName }, done);
            });
    });

    it('should list the object with the searched for metadata', done => {
        const encodedSearch = encodeURIComponent(`key="${objectKey}"`);
        const searchRequest = s3Client.listObjects({ Bucket: bucketName });
        searchRequest.on('build', () => {
            searchRequest.httpRequest.path =
            `${searchRequest.httpRequest.path}?search=${encodedSearch}`;
        });
        searchRequest.on('success', res => {
            assert(res.data.Contents[0], 'should be Contents listed');
            assert.strictEqual(res.data.Contents[0].Key, objectKey);
            assert.strictEqual(res.data.Contents.length, 1);
            return done();
        });
        searchRequest.on('error', done);
        searchRequest.send();
    });
});

describe('Search when no objects in bucket', () => {
    const bucketName = `noobjectbucket${Date.now()}`;
    before(done => {
        s3Client.createBucket({ Bucket: bucketName }, done);
    });

    after(done => {
        s3Client.deleteBucket({ Bucket: bucketName }, done);
    });

    it('should return empty listing when no objects in bucket', done => {
        const encodedSearch = encodeURIComponent(`key="${objectKey}"`);
        const searchRequest = s3Client.listObjects({ Bucket: bucketName });
        searchRequest.on('build', () => {
            searchRequest.httpRequest.path =
            `${searchRequest.httpRequest.path}?search=${encodedSearch}`;
        });
        searchRequest.on('success', res => {
            assert.strictEqual(res.data.Contents.length, 0);
            return done();
        });
        searchRequest.on('error', done);
        searchRequest.send();
    });
});
