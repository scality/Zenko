const assert = require('assert');
const s3Client = require('../utils/s3SDK');

const objectKey = 'findMe';
const hiddenKey = 'leaveMeAlone';
const userMetadata = {
    food: 'pizza' };

function runAndCheckSearch(bucketName, encodedSearch, keyToFind, done) {
    const searchRequest = s3Client.listObjects({ Bucket: bucketName });
    searchRequest.on('build', () => {
        searchRequest.httpRequest.path =
        `${searchRequest.httpRequest.path}?search=${encodedSearch}`;
    });
    searchRequest.on('success', res => {
        if (keyToFind) {
            assert(res.data.Contents[0], 'should be Contents listed');
            assert.strictEqual(res.data.Contents[0].Key, keyToFind);
            assert.strictEqual(res.data.Contents.length, 1);
        } else {
            assert.strictEqual(res.data.Contents.length, 0);
        }
        return done();
    });
    searchRequest.on('error', done);
    searchRequest.send();
}

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

    it('should list object with searched for system metadata', done => {
        const encodedSearch = encodeURIComponent(`key="${objectKey}"`);
        return runAndCheckSearch(bucketName, encodedSearch, objectKey, done);
    });

    it('should list object with searched for user metadata', done => {
        const encodedSearch =
            encodeURIComponent('userMd.\`x-amz-meta-food\`' +
            `="${userMetadata.food}"`);
        return runAndCheckSearch(bucketName, encodedSearch, objectKey, done);
    });

    it('should return empty listing when no object has user md', done => {
        const encodedSearch =
        encodeURIComponent('userMd.\`x-amz-meta-food\`="nosuchfood"');
        return runAndCheckSearch(bucketName, encodedSearch, null, done);
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
        return runAndCheckSearch(bucketName, encodedSearch, null, done);
    });
});
