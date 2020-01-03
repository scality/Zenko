const assert = require('assert');
const crypto = require('crypto');
const async = require('async');
const fs = require('fs');

const { scalityS3Client, awsS3Client } = require('../s3SDK');

const srcLocation = process.env.AWS_BACKEND_SOURCE_LOCATION;
const destAWSLocation = process.env.AWS_BACKEND_DESTINATION_LOCATION;
const destAzureLocation = process.env.AZURE_BACKEND_DESTINATION_LOCATION;
const destGCPLocation = process.env.GCP_BACKEND_DESTINATION_LOCATION;
const REPLICATION_TIMEOUT = 10000;

class ReplicationUtility {
    constructor(s3, azure, gcpStorage) {
        this.s3 = s3;
        this.azure = azure;
        this.gcpStorage = gcpStorage;
    }

    _compareObjectBody(body1, body2) {
        const digest1 = crypto.createHash('md5').update(body1).digest('hex');
        const digest2 = crypto.createHash('md5').update(body2).digest('hex');
        // if (digest1 !== digest2) {
        //     // dump data for later investigation
        //     const filePrefix = `${process.env.CIRCLE_ARTIFACTS}/` +
        //               `genericStaas_backbeat_md5_mismatch_body`;
        //     fs.writeFileSync(`${filePrefix}1.bin`, body1);
        //     fs.writeFileSync(`${filePrefix}2.bin`, body2);
        //     console.error('md5 mismatch: data dumped in ' +
        //                   `${filePrefix}{1,2}.bin`);
        // }
        assert.strictEqual(digest1, digest2);
    }

    _deleteVersionList(versionList, bucketName, cb) {
        if (versionList.length < 1) {
            return cb();
        }
        const params = {
            Bucket: bucketName,
            Delete: {
                Objects: versionList.map(item => {
                    const temp = { Key: item.Key, VersionId: item.VersionId };
                    return temp;
                }),
            },
        }
        return this.s3.deleteObjects(params, cb);
    }

    _deleteBlobList(blobList, containerName, cb) {
        async.each(blobList, (blob, next) =>
            this.deleteBlob(containerName, blob.name, undefined, next), cb);
    }

    _setS3Client(s3Client) {
        this.s3 = s3Client;
        return this;
    }

    deleteAllVersions(bucketName, keyPrefix, cb) {
        this.s3.listObjectVersions({ Bucket: bucketName }, (err, data) => {
            if (err) {
                return cb(err);
            }
            let versions = data.Versions;
            let deleteMarkers = data.DeleteMarkers;
            // If replicating to a multiple backend bucket, we only want to
            // remove versions that we have put with our tests.
            if (keyPrefix) {
                versions = versions.filter(version =>
                    version.Key.startsWith(keyPrefix));
                deleteMarkers = deleteMarkers.filter(marker =>
                    marker.Key.startsWith(keyPrefix));
            }
            return async.series([
                next => this._deleteVersionList(deleteMarkers, bucketName,
                    next),
                next => this._deleteVersionList(versions, bucketName, next),
            ], err => cb(err));
        });
    }

    deleteAllBlobs(containerName, keyPrefix, cb) {
        const options = { include: 'metadata' };
        this.azure.listBlobsSegmented(containerName, null, options,
            (err, result, response) => {
                if (err) {
                    return cb(err);
                }
                // Only delete the blobs put by the current test.
                const filteredEntries = result.entries.filter(entry =>
                    entry.name.startsWith(keyPrefix));
                return this._deleteBlobList(filteredEntries, containerName, cb);
            });
    }

    deleteAllFiles(bucketName, filePrefix, cb) {
        const bucket = this.gcpStorage.bucket(bucketName);
        bucket.deleteFiles({ prefix: filePrefix }, cb);
    }

    putObject(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            Body: content,
        }, cb);
    }

    putObjectWithContentType(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            ContentType: 'image/png',
            Body: content,
        }, cb);
    }

    putObjectWithUserMetadata(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            Metadata: { customKey: 'customValue' },
            Body: content,
        }, cb);
    }

    putObjectWithCacheControl(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            CacheControl: 'test-cache-control',
            Body: content,
        }, cb);
    }

    putObjectWithContentDisposition(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            ContentDisposition: 'test-content-disposition',
            Body: content,
        }, cb);
    }

    putObjectWithContentEncoding(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            ContentEncoding: 'ascii',
            Body: content,
        }, cb);
    }

    putObjectWithContentLanguage(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            ContentLanguage: 'test-content-language',
            Body: content,
        }, cb);
    }

    putObjectWithProperties(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            Metadata: { 'customKey': 'customValue' },
            ContentType: 'image/png',
            CacheControl: 'test-cache-control',
            ContentDisposition: 'test-content-disposition',
            ContentEncoding: 'ascii',
            ContentLanguage: 'test-content-language',
            Body: content,
        }, cb);
    }

    copyObject(bucketName, copySource, objectName, cb) {
        this.s3.copyObject({
            Bucket: bucketName,
            CopySource: copySource,
            Key: objectName,
        }, cb);
    }

    genericCompleteMPU(bucketName, objectName, howManyParts, isExternalBackend,
        hasOptionalFields, customPartSize, cb) {
        let uploadId;
        let ETags = [];
        const partSize = customPartSize === false ?
            ((1024 * 1024) * 5) + 1 : customPartSize;
        const partNumbers = Array.from(Array(howManyParts).keys());
        const initiateMPUParams = {
            Bucket: bucketName,
            Key: objectName,
        }
        if (hasOptionalFields) {
            Object.assign(initiateMPUParams, {
                Metadata: { 'customKey': 'customValue' },
                ContentType: 'image/png',
                CacheControl: 'test-cache-control',
                ContentDisposition: 'test-content-disposition',
                ContentEncoding: 'ascii',
                ContentLanguage: 'test-content-language',
            });
        }
        return async.waterfall([
            next => this.s3.createMultipartUpload(initiateMPUParams,
            (err, data) => {
                if (err) {
                    return next(err);
                }
                uploadId = data.UploadId;
                return next();
            }),
            next =>
                async.mapLimit(partNumbers, 2, (partNumber, callback) => {
                    const uploadPartParams = {
                        Bucket: bucketName,
                        Key: objectName,
                        PartNumber: partNumber + 1,
                        UploadId: uploadId,
                        Body: Buffer.alloc(partSize).fill(partNumber + 1),
                    };

                    return this.s3.uploadPart(uploadPartParams,
                        (err, data) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, data.ETag);
                        });
                }, (err, results) => {
                    if (err) {
                        return next(err);
                    }
                    ETags = results;
                    return next();
                }),
            next => {
                const params = {
                    Bucket: bucketName,
                    Key: objectName,
                    MultipartUpload: {
                        Parts: partNumbers.map(n => ({
                            ETag: ETags[n],
                            PartNumber: n + 1,
                        })),
                    },
                    UploadId: uploadId,
                };
                return this.s3.completeMultipartUpload(params, next);
            },
        ], (err, data) => {
            if (err) {
                return this.s3.abortMultipartUpload({
                    Bucket: bucketName,
                    Key: objectName,
                    UploadId: uploadId,
                }, () => cb(err));
            }
            return cb(null, data);
        });
    }

    completeSinglePartMPU(bucketName, objectName, size, cb) {
        this.genericCompleteMPU(bucketName, objectName, 1, true, false, size,
            cb);
    }

    completeMPUAWS(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(bucketName, objectName, howManyParts, true,
            false, false, cb);
    }

    completeMPUAWSWithProperties(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(bucketName, objectName, howManyParts, true,
            true, false, cb);
    }

    completeMPUGCP(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(bucketName, objectName, howManyParts, true,
            false, false, cb);
    }

    completeMPUGCPWithProperties(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(bucketName, objectName, howManyParts, true,
            true, false, cb);
    }

    completeMPUWithPartCopy(bucketName, objectName, copySource, byteRange,
        howManyParts, cb) {
        let uploadId;
        let ETags = [];
        const partNumbers = Array.from(Array(howManyParts).keys());
        return async.waterfall([
            next => this.s3.createMultipartUpload({
                Bucket: bucketName,
                Key: objectName,
            }, (err, data) => {
                if (err) {
                    return next(err);
                }
                uploadId = data.UploadId;
                return next();
            }),
            next =>
                async.mapLimit(partNumbers, 2, (partNumber, callback) => {
                    const uploadPartCopyParams = {
                        Bucket: bucketName,
                        CopySource: copySource,
                        CopySourceRange: byteRange ?
                            `bytes=${byteRange}` : undefined,
                        Key: objectName,
                        PartNumber: partNumber + 1,
                        UploadId: uploadId,
                    };
                    return this.s3.uploadPartCopy(uploadPartCopyParams,
                        (err, data) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, data.ETag);
                        });
                }, (err, results) => {
                    if (err) {
                        return next(err);
                    }
                    ETags = results;
                    return next();
                }),
            next => this.s3.completeMultipartUpload({
                Bucket: bucketName,
                Key: objectName,
                MultipartUpload: {
                    Parts: partNumbers.map(n => ({
                        ETag: ETags[n],
                        PartNumber: n + 1,
                    })),
                },
                UploadId: uploadId,
            }, next),
        ], err => {
            if (err) {
                return this.s3.abortMultipartUpload({
                    Bucket: bucketName,
                    Key: objectName,
                    UploadId: uploadId,
                }, () => cb(err));
            }
            return cb();
        });
    }

    getObject(bucketName, objName, cb) {
        this.s3.getObject({
            Bucket: bucketName,
            Key: objName,
        }, cb);
    }

    getBlobToText(containerName, blob, cb) {
        this.azure.getBlobToText(containerName, blob, cb);
    }

    getBlob(containerName, blob, cb) {
        const request = this.azure.createReadStream(containerName, blob);
        const data = [];
        let totalLength = 0;
        request.on('data', chunk => {
            totalLength += chunk.length;
            data.push(chunk);
        });
        request.on('end', () => {
            cb(null, Buffer.concat(data, totalLength))
        });
        request.on('error', err => cb(err));
    }

    getMetadata(bucketName, fileName, cb) {
        const bucket = this.gcpStorage.bucket(bucketName);
        const file = bucket.file(fileName);
        file.getMetadata(cb);
    }

    download(bucketName, fileName, cb) {
        const bucket = this.gcpStorage.bucket(bucketName);
        const file = bucket.file(fileName);
        file.download(cb);
    }

    createBucket(bucketName, cb) {
        this.s3.createBucket({ Bucket: bucketName }, cb);
    }

    createVersionedBucket(bucketName, cb) {
        return async.series([
            next => this.s3.createBucket({ Bucket: bucketName }, next),
            next => this.s3.putBucketVersioning({
                Bucket: bucketName,
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            }, next),
        ], err => cb(err));
    }

    createVersionedBucketAWS(bucketName, cb) {
        return async.series([
            next => this.s3.createBucket({
                Bucket: bucketName,
                CreateBucketConfiguration: {
                    LocationConstraint: srcLocation,
                },
            }, next),
            next => this.s3.putBucketVersioning({
                Bucket: bucketName,
                VersioningConfiguration: {
                    Status: 'Enabled',
                }
            }, next),
        ], err => cb(err));
    }

    deleteVersionedBucket(bucketName, cb) {
        return async.series([
            next => this.deleteAllVersions(bucketName, undefined, next),
            next => this.s3.deleteBucket({ Bucket: bucketName }, next),
        ], err => cb(err));
    }

    putBucketReplicationMultipleBackend(srcBucket, destBucket, roleArn,
        storageClass, cb) {
        this.s3.putBucketReplication({
            Bucket: srcBucket,
            ReplicationConfiguration: {
                Role: roleArn,
                Rules: [
                    {
                        Prefix: '',
                        Destination: {
                            Bucket: `arn:aws:s3:::${destBucket}`,
                            StorageClass: storageClass,
                        },
                        Status: 'Enabled',
                    },
                ],
            },
        }, cb);
    }

    getHeadObject(bucketName, key, cb) {
        this.s3.headObject({
            Bucket: bucketName,
            Key: key,
        }, cb);
    }

    getObjectACL(bucketName, key, cb) {
        this.s3.getObjectAcl({
            Bucket: bucketName,
            Key: key,
        }, cb);
    }

    putObjectACL(bucketName, key, cb) {
        this.s3.putObjectAcl({
            Bucket: bucketName,
            Key: key,
            ACL: 'public-read',
        }, cb);
    }

    putObjectTagging(bucketName, key, versionId, cb) {
        this.s3.putObjectTagging({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
            Tagging: {
                TagSet: [
                    {
                        Key: 'object-tag-key',
                        Value: 'object-tag-value',
                    },
                ],
            },
        }, cb);
    }

    deleteObjectTagging(bucketName, key, versionId, cb) {
        this.s3.deleteObjectTagging({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }, cb);
    }

    getObjectTagging(bucketName, key, versionId, cb) {
        this.s3.getObjectTagging({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }, cb);
    }

    deleteObject(bucketName, key, versionId, cb) {
        this.s3.deleteObject({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }, cb);
    }

    deleteBlob(containerName, blob, options, cb) {
        this.azure.deleteBlob(containerName, blob, options, cb);
    }

    expectReplicationStatus(bucketName, key, versionId, expectedStatus, cb) {
        this.s3.headObject({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }, (err, data) => {
            if (err) {
                return cb(err);
            }
            assert.strictEqual(data.ReplicationStatus, expectedStatus);
            return cb();
        });
    }

    // Continue getting head object while the status is PENDING or PROCESSING.
    waitUntilReplicated(bucketName, key, versionId, cb) {
        let status;
        return async.doWhilst(callback =>
            this.s3.headObject({
                Bucket: bucketName,
                Key: key,
                VersionId: versionId,
            }, (err, data) => {
                if (err) {
                    return callback(err);
                }
                status = data.ReplicationStatus;
                assert.notStrictEqual(status, 'FAILED',
                    `Unexpected CRR failure occurred: ${JSON.stringify(data)}`);
                if (status === 'PENDING' || status === 'PROCESSING') {
                    return setTimeout(callback, 2000);
                }
                return callback();
            }),
        () => (status === 'PENDING' || status === 'PROCESSING'), cb);
    }

    // Continue getting object while the object exists.
    waitUntilDeleted(bucketName, key, client, cb) {
        let objectExists;
        const method = client === 'azure' ? 'getBlobToText' : 'getObject';
        const expectedCode = client === 'azure' ? 'BlobNotFound' : 'NoSuchKey';
        return async.doWhilst(callback =>
            this[method](bucketName, key, err => {
                if (err && err.code !== expectedCode) {
                    return callback(err);
                }
                objectExists = err === null;
                if (!objectExists) {
                    return callback();
                }
                return setTimeout(callback, 2000);
            }),
        () => objectExists, cb);
    }

    // Continue getting head object while any backend status is PENDING.
    waitWhilePendingCRR(bucketName, key, cb) {
        let shouldContinue;
        return async.doWhilst(callback =>
            this.s3.headObject({
                Bucket: bucketName,
                Key: key,
            }, (err, data) => {
                if (err) {
                    return callback(err);
                }
                const statuses = [];
                // We cannot rely on the global status for one-to-many, so check
                // each of the destination statuses.
                Object.keys(data.Metadata).forEach(key => {
                    if (key.includes('replication-status')) {
                        statuses.push(data.Metadata[key]);
                    }
                });
                shouldContinue = statuses.includes('PENDING');
                if (shouldContinue) {
                    return setTimeout(callback, 2000);
                }
                return callback();
            }),
        () => shouldContinue, cb);
    }

    // Continue getting head object while the replication status is FAILED.
    waitWhileFailedCRR(bucketName, key, cb) {
        let shouldContinue;
        return async.doWhilst(callback =>
            this.s3.headObject({
                Bucket: bucketName,
                Key: key,
            }, (err, data) => {
                if (err) {
                    return callback(err);
                }
                shouldContinue = data.ReplicationStatus === 'FAILED';
                if (shouldContinue) {
                    return setTimeout(callback, 2000);
                }
                return callback();
            }),
        () => shouldContinue, cb);
    }

    compareObjectsAWS(srcBucket, destBucket, key, optionalField, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            next => this.getObject(srcBucket, key, next),
            next => this._setS3Client(awsS3Client)
                .getObject(destBucket, `${srcBucket}/${key}`, next),
        ], (err, data) => {
            this._setS3Client(scalityS3Client);
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            assert.strictEqual(srcData.ReplicationStatus, 'COMPLETED');
            assert.strictEqual(srcData.ContentLength,
                destData.ContentLength);
            this._compareObjectBody(srcData.Body, destData.Body);
            const srcUserMD = srcData.Metadata;
            assert.strictEqual(srcUserMD[`${destAWSLocation}-version-id`],
                destData.VersionId);
            assert.strictEqual(srcUserMD[`${destAWSLocation}-replication-status`],
                'COMPLETED');
            const destUserMD = destData.Metadata;
            assert.strictEqual(destUserMD['scal-version-id'],
                srcData.VersionId);
            assert.strictEqual(destUserMD['scal-replication-status'],
                'REPLICA');
            if (optionalField === 'Metadata') {
                assert.strictEqual(srcUserMD.customkey, 'customValue');
                assert.strictEqual(destUserMD.customkey, 'customValue');
            }
            if (optionalField && optionalField !== 'Metadata') {
                assert.strictEqual(srcData[optionalField],
                    destData[optionalField]);
            }
            return cb();
        });
    }

    compareObjectsOneToMany(srcBucket, awsDestBucket, destContainer,
        gcpDestBucket, key, cb) {
        return async.parallel([
            next => this.compareObjectsAWS(srcBucket, awsDestBucket, key,
                undefined, next),
            next => this.compareObjectsAzure(srcBucket, destContainer, key,
                next),
            next => this.compareObjectsGCP(srcBucket, gcpDestBucket, key,
                next),
        ], cb);
    };

    compareObjectsAzure(srcBucket, containerName, key, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            next => this.getObject(srcBucket, key, next),
            next => this.azure.getBlobProperties(containerName,
                `${srcBucket}/${key}`, next),
            next => this.getBlob(containerName,
                `${srcBucket}/${key}`, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destProperties = data[2];
            const destPropResult = destProperties[0];
            const destPropResponse = destProperties[1];
            const destDataBuf = data[3];
            assert.strictEqual(srcData.ReplicationStatus, 'COMPLETED');
            // Azure does not have versioning so there is no version metadata
            // from Azure to set on the source.
            assert.strictEqual(
                srcData.Metadata[`${destAzureLocation}-replication-status`],
                'COMPLETED');
            assert.strictEqual(
                destPropResult.metadata['scal_replication_status'], 'REPLICA');
            assert.strictEqual(
                destPropResult.metadata['scal_version_id'], srcData.VersionId);
            assert.strictEqual(
                destPropResponse.headers['x-ms-meta-scal_replication_status'],
                'REPLICA');
            assert.strictEqual(
                destPropResponse.headers['x-ms-meta-scal_version_id'],
                srcData.VersionId);
            this._compareObjectBody(srcData.Body, destDataBuf);
            return cb();
        });
    }

    compareObjectsGCP(srcBucket, destBucket, key, cb) {
        return async.series({
            wait: next =>
                this.waitUntilReplicated(srcBucket, key, undefined, next),
            srcData: next => this.getObject(srcBucket, key, next),
            destMetadata: next => this.getMetadata(destBucket,
                `${srcBucket}/${key}`, next),
            destData: next => this.download(destBucket,
                `${srcBucket}/${key}`, next),
        }, (err, data) => {
            if (err) {
                return cb(err);
            }
            const { srcData, destMetadata, destData } = data;
            assert.strictEqual(srcData.ReplicationStatus, 'COMPLETED');
            assert.strictEqual(`${srcData.ContentLength}`,
                destMetadata[0].size);
            const srcUserMD = srcData.Metadata;
            const destUserMD = destMetadata[0].metadata;
            assert.strictEqual(
                srcUserMD[`${destGCPLocation}-replication-status`],
                'COMPLETED');
            assert.strictEqual(srcUserMD[`${destGCPLocation}-version-id`],
                destMetadata[0].generation);
            assert.strictEqual(destUserMD['scal-replication-status'],
                'REPLICA');
            assert.strictEqual(destUserMD['scal-version-id'],
                srcData.VersionId);
            // Zero-byte object condition.
            if (srcData.Body.length === 0) {
                assert.deepStrictEqual(destData, []);
                return cb();
            }
            this._compareObjectBody(srcData.Body, destData);
            return cb();
        });
    }

    compareAzureObjectProperties(srcBucket, containerName, key, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            next => this.getHeadObject(srcBucket, key, next),
            next => this.azure.getBlobProperties(containerName,
                `${srcBucket}/${key}`, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            const destResult = destData[0];
            const destResponse = destData[1];
            const { contentSettings } = destResult;
            const { headers } = destResponse;
            let expectedVal = srcData.Metadata.customkey;
            assert.strictEqual(expectedVal,
                destResult.metadata['customkey']);
            assert.strictEqual(expectedVal,
                headers['x-ms-meta-customkey']);
            expectedVal = srcData.ContentType;
            assert.strictEqual(expectedVal, contentSettings.contentType);
            assert.strictEqual(expectedVal, headers['content-type']);
            expectedVal = srcData.CacheControl;
            assert.strictEqual(expectedVal, contentSettings.cacheControl);
            assert.strictEqual(expectedVal, headers['cache-control']);
            expectedVal = srcData.ContentEncoding;
            assert.strictEqual(expectedVal, contentSettings.contentEncoding);
            assert.strictEqual(expectedVal, headers['content-encoding']);
            expectedVal = srcData.ContentLanguage;
            assert.strictEqual(expectedVal, contentSettings.contentLanguage);
            assert.strictEqual(expectedVal, headers['content-language']);
            return cb();
        });
    };

    compareGCPObjectProperties(srcBucket, destBucket, file, cb) {
        return async.series({
            wait: next =>
                this.waitUntilReplicated(srcBucket, file, undefined, next),
            srcData: next => this.getHeadObject(srcBucket, file, next),
            destData: next => this.getMetadata(destBucket,
                `${srcBucket}/${file}`, next),
        }, (err, data) => {
            if (err) {
                return cb(err);
            }
            const { srcData, destData } = data;
            const destProperties = destData[0];
            const destMetadata = destProperties.metadata;
            let expectedVal = srcData.Metadata.customkey;
            assert.strictEqual(expectedVal, destMetadata['customkey']);
            expectedVal = srcData.ContentType;
            assert.strictEqual(expectedVal, destProperties.contentType);
            expectedVal = srcData.CacheControl;
            assert.strictEqual(expectedVal, destProperties.cacheControl);
            expectedVal = srcData.ContentEncoding;
            assert.strictEqual(expectedVal, destProperties.contentEncoding);
            expectedVal = srcData.ContentDisposition;
            assert.strictEqual(expectedVal, destProperties.contentDisposition);
            expectedVal = srcData.ContentLanguage;
            assert.strictEqual(expectedVal, destProperties.contentLanguage);
            return cb();
        });
    };

    compareACLsAWS(srcBucket, destBucket, key, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            next => this.getObjectACL(srcBucket, key, next),
            next => this._setS3Client(awsS3Client)
                .getObjectACL(destBucket, `${srcBucket}/${key}`, next),
        ], (err, data) => {
            this._setS3Client(scalityS3Client);
            if (err) {
                return cb(err);
            }
            assert.strictEqual(data[1].Grants[0].Permission,
                data[2].Grants[0].Permission);
            return cb();
        });
    }

    compareObjectTagsAWS(srcBucket, destBucket, key, scalityVersionId,
        AWSVersionId, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, scalityVersionId,
                next),
            next => this.getObjectTagging(srcBucket, key, scalityVersionId,
               next),
            next => this._setS3Client(awsS3Client)
               .getObjectTagging(destBucket, `${srcBucket}/${key}`, AWSVersionId, next),
        ], (err, data) => {
            this._setS3Client(scalityS3Client);
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            // Version IDs will differ in the response, so just compare tag set.
            assert.deepStrictEqual(srcData.TagSet, destData.TagSet);
            return cb();
        });
    }

    compareObjectTagsAzure(srcBucket, destContainer, key, scalityVersionId,
        cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, scalityVersionId,
                next),
            next => this.getObjectTagging(srcBucket, key, scalityVersionId,
                next),
            next => this.azure.getBlobMetadata(destContainer,
                `${srcBucket}/${key}`, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            const destTagSet = [];
            const destTags = destData[0].metadata.tags;
            if (destTags) {
                const parsedTags = JSON.parse(destTags);
                Object.keys(parsedTags).forEach(key => destTagSet.push({
                    Key: key,
                    Value: parsedTags[key],
                }));
            }
            assert.deepStrictEqual(srcData.TagSet, destTagSet);
            return cb();
        });
    }

    compareObjectTagsGCP(srcBucket, destContainer, file, scalityVersionId, cb) {
        return async.series({
            wait: next =>
                this.waitUntilReplicated(srcBucket, file, scalityVersionId,
                    next),
            srcData: next => this.getObjectTagging(srcBucket, file,
                scalityVersionId, next),
            destData: next => this.getMetadata(destContainer,
                `${srcBucket}/${file}`, next),
        }, (err, data) => {
            if (err) {
                return cb(err);
            }
            const { srcData, destData } = data;
            const destTags = destData[0].metadata;
            const destTagSet = [];
            if (destTags) {
                Object.keys(destTags).forEach(key => {
                    const tag = key.split('aws-tag-')[1];
                    if (tag) {
                        destTagSet.push({
                            Key: tag,
                            Value: destTags[key],
                        })
                    }
                });
            }
            assert.deepStrictEqual(srcData.TagSet, destTagSet);
            return cb();
        });
    }

    assertNoObject(bucketName, key, cb) {
        this.getObject(bucketName, key, err => {
            assert.strictEqual(err.code, 'NoSuchKey');
            return cb();
        });
    }
}

module.exports = ReplicationUtility;
