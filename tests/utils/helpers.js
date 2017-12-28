const assert = require('assert');

const testUtils = {};

testUtils.runAndCheckSearch = (s3Client, bucketName, encodedSearch,
    keyToFind, done) => {
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
};

module.exports = testUtils;
