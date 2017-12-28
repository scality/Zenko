const s3Client = require('../utils/s3SDK');
const runAndCheckSearch = require('../utils/helpers').runAndCheckSearch;

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

    it('should list object with searched for system metadata', done => {
        const encodedSearch = encodeURIComponent(`key="${objectKey}"`);
        return runAndCheckSearch(s3Client, bucketName,
            encodedSearch, objectKey, done);
    });

    it('should list object with searched for user metadata', done => {
        const encodedSearch =
            encodeURIComponent('userMd.\`x-amz-meta-food\`' +
            `="${userMetadata.food}"`);
        return runAndCheckSearch(s3Client, bucketName, encodedSearch,
            objectKey, done);
    });

    it('should return empty listing when no object has user md', done => {
        const encodedSearch =
        encodeURIComponent('userMd.\`x-amz-meta-food\`="nosuchfood"');
        return runAndCheckSearch(s3Client, bucketName,
            encodedSearch, null, done);
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
        return runAndCheckSearch(s3Client, bucketName,
            encodedSearch, null, done);
    });
});
