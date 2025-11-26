const assert = require('assert');
const crypto = require('crypto');
const async = require('async');
const { jsutil } = require('arsenal');

const {
    ListObjectVersionsCommand,
    PutObjectCommand,
    CopyObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    UploadPartCopyCommand,
    GetObjectCommand,
    CreateBucketCommand,
    PutBucketVersioningCommand,
    DeleteBucketCommand,
    PutBucketReplicationCommand,
    DeleteBucketReplicationCommand,
    HeadObjectCommand,
    GetObjectAclCommand,
    PutObjectAclCommand,
    PutObjectTaggingCommand,
    DeleteObjectTaggingCommand,
    GetObjectTaggingCommand,
    DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { scalityS3Client, awsS3Client } = require('../s3SDK');

const srcLocation = process.env.AWS_BACKEND_SOURCE_LOCATION;
const destAWSLocation = process.env.AWS_BACKEND_DESTINATION_LOCATION;
const destAzureLocation = process.env.AZURE_BACKEND_DESTINATION_LOCATION;
const destGCPLocation = process.env.GCP_BACKEND_DESTINATION_LOCATION;
// eslint-disable-next-line
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
        // eslint-disable-next-line no-console
        console.log('Source object MD5:', digest1);
        // eslint-disable-next-line no-console
        console.log('Destination object MD5:', digest2);
        assert.strictEqual(digest1, digest2);
    }

    _deleteVersionList(versionList, bucketName, cb) {
        if (versionList.length < 1) {
            return cb();
        }

        const deletePromises = versionList.map(item => {
            const params = {
                Bucket: bucketName,
                Key: item.Key,
            };
            if (item.VersionId) {
                params.VersionId = item.VersionId;
            }
            return this.s3.send(new DeleteObjectCommand(params));
        });

        return Promise.all(deletePromises)
            .then(() => cb())
            .catch(cb);
    }

    _setS3Client(s3Client) {
        this.s3 = s3Client;
        return this;
    }

    deleteAllVersions(bucketName, keyPrefix, cb) {
        this.s3.send(new ListObjectVersionsCommand({ Bucket: bucketName }))
            .then(data => {
                let versions = data.Versions || [];
                let deleteMarkers = data.DeleteMarkers || [];

                // If replicating to a multiple backend bucket, we only want to
                // remove versions that we have put with our tests.
                if (keyPrefix) {
                    versions = versions.filter(version => version.Key.startsWith(keyPrefix));
                    deleteMarkers = deleteMarkers.filter(marker => marker.Key.startsWith(keyPrefix));
                }

                if (versions.length === 0 && deleteMarkers.length === 0) {
                    return cb();
                }

                return async.series([
                    next => this._deleteVersionList(deleteMarkers, bucketName, next),
                    next => this._deleteVersionList(versions, bucketName, next),
                ], cb);
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.log('Error deleting all object versions:', err);
            });
    }

    deleteAllBlobs(containerName, keyPrefix, cb) {
        (async () => {
            const client = this.azure.getContainerClient(containerName);
            const options = { includeMetadata: true };
            const iter = client.listBlobsFlat(options).byPage({ maxPageSize: 20 });

            // eslint-disable-next-line no-restricted-syntax
            for await (const response of iter) {
                const { blobItems } = response.segment;
                const filteredEntries = blobItems.filter(blobItem => blobItem.name.startsWith(keyPrefix));
                await Promise.all(filteredEntries.map(
                    blob => client.deleteBlob(blob, options),
                ));
            }
        })().then(() => cb(null), cb);
    }

    deleteAllFiles(bucketName, filePrefix, cb) {
        const bucket = this.gcpStorage.bucket(bucketName);
        bucket.deleteFiles({ prefix: filePrefix }, cb);
    }

    putObject(bucketName, objectName, content, cb) {
        const params = {
            Bucket: bucketName,
            Key: objectName,
        };
        if (content) {
            params.Body = content;
        }
        this.s3.send(new PutObjectCommand(params))
            .then(data => {
                // eslint-disable-next-line no-console
                console.log(`PutObject data: ${JSON.stringify(data)}`);
                cb(null, data);
            })
            .catch(cb);
    }

    putObjectWithContentType(bucketName, objectName, content, cb) {
        this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            ContentType: 'image/png',
            Body: content,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    putObjectWithUserMetadata(bucketName, objectName, content, cb) {
        this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            Metadata: { customKey: 'customValue' },
            Body: content,
        }))
            .then(data => {
                // eslint-disable-next-line no-console
                console.log('PutObjectWithUserMetadata data:', data);
                cb(null, data);
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.log('Error in putObjectWithUserMetadata:', err);
                cb(err);
            });
    }

    putObjectWithCacheControl(bucketName, objectName, content, cb) {
        // eslint-disable-next-line no-console
        console.log('Putting object with cache control', { bucketName, objectName });
        this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            CacheControl: 'test-cache-control',
            Body: content,
        }))
            .then(data => {
                // eslint-disable-next-line no-console
                console.log('PutObjectWithCacheControl data:', data);
                cb(null, data);
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.log('Error in putObjectWithCacheControl:', err);
                cb(err);
            });
    }

    putObjectWithContentDisposition(bucketName, objectName, content, cb) {
        this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            ContentDisposition: 'test-content-disposition',
            Body: content,
        }))
            .then(data => {
                // eslint-disable-next-line no-console
                console.log('PutObjectWithContentDisposition data:', data);
                cb(null, data)
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.log('Error in putObjectWithContentDisposition:', err);
                cb(err);
            });
    }

    putObjectWithContentEncoding(bucketName, objectName, content, cb) {
        this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            ContentEncoding: 'ascii',
            Body: content,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    putObjectWithContentLanguage(bucketName, objectName, content, cb) {
        this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            ContentLanguage: 'test-content-language',
            Body: content,
        }))
            .then(data => {
                // eslint-disable-next-line no-console
                console.log('PutObjectWithContentLanguage data:', data);
                cb(null, data);
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.log('Error in putObjectWithContentLanguage:', err);
                cb(err);
            });
    }

    putObjectWithProperties(bucketName, objectName, content, cb) {
        this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            Metadata: { customKey: 'customValue' },
            ContentType: 'image/png',
            CacheControl: 'test-cache-control',
            ContentDisposition: 'test-content-disposition',
            ContentEncoding: 'ascii',
            ContentLanguage: 'test-content-language',
            Body: content,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    copyObject(bucketName, copySource, objectName, cb) {
        this.s3.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: copySource,
            Key: objectName,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    genericCompleteMPU(
        bucketName,
        objectName,
        howManyParts,
        isExternalBackend,
        hasOptionalFields,
        customPartSize,
        cb,
    ) {
        let uploadId;
        let ETags = [];
        const partSize = customPartSize === false
            ? ((1024 * 1024) * 5) + 1 : customPartSize;
        const partNumbers = Array.from(Array(howManyParts).keys());
        const initiateMPUParams = {
            Bucket: bucketName,
            Key: objectName,
        };
        if (hasOptionalFields) {
            Object.assign(initiateMPUParams, {
                Metadata: { customKey: 'customValue' },
                ContentType: 'image/png',
                CacheControl: 'test-cache-control',
                ContentDisposition: 'test-content-disposition',
                ContentEncoding: 'ascii',
                ContentLanguage: 'test-content-language',
            });
        }
        return async.waterfall([
            next => this.s3.send(new CreateMultipartUploadCommand(initiateMPUParams))
                .then(data => {
                    uploadId = data.UploadId;
                    return next();
                })
                .catch(next),
            next => async.mapLimit(partNumbers, 2, (partNumber, callback) => {
                const uploadPartParams = {
                    Bucket: bucketName,
                    Key: objectName,
                    PartNumber: partNumber + 1,
                    UploadId: uploadId,
                    Body: Buffer.alloc(partSize).fill(partNumber + 1),
                };

                return this.s3.send(new UploadPartCommand(uploadPartParams))
                    .then(data => callback(null, data.ETag))
                    .catch(callback);
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
                return this.s3.send(new CompleteMultipartUploadCommand(params))
                    .then(data => next(null, data))
                    .catch(next);
            },
        ], (err, data) => {
            if (err) {
                return this.s3.send(new AbortMultipartUploadCommand({
                    Bucket: bucketName,
                    Key: objectName,
                    UploadId: uploadId,
                })).then(() => cb(err)).catch(abortErr => {
                    const aggregateError = new Error(`Original error: ${err}; Abort failed: ${abortErr}`);
                    aggregateError.originalError = err;
                    aggregateError.abortError = abortErr;
                    cb(aggregateError);
                });
            }
            return cb(null, data);
        });
    }

    completeSinglePartMPU(bucketName, objectName, size, cb) {
        this.genericCompleteMPU(
            bucketName,
            objectName,
            1,
            true,
            false,
            size,
            cb,
        );
    }

    completeMPUAWS(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(
            bucketName,
            objectName,
            howManyParts,
            true,
            false,
            false,
            cb,
        );
    }

    completeMPUAWSWithProperties(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(
            bucketName,
            objectName,
            howManyParts,
            true,
            true,
            false,
            cb,
        );
    }

    completeMPUGCP(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(
            bucketName,
            objectName,
            howManyParts,
            true,
            false,
            false,
            cb,
        );
    }

    completeMPUGCPWithProperties(bucketName, objectName, howManyParts, cb) {
        this.genericCompleteMPU(
            bucketName,
            objectName,
            howManyParts,
            true,
            true,
            false,
            cb,
        );
    }

    completeMPUWithPartCopy(
        bucketName,
        objectName,
        copySource,
        byteRange,
        howManyParts,
        cb,
    ) {
        let uploadId;
        let ETags = [];
        const partNumbers = Array.from(Array(howManyParts).keys());
        return async.waterfall([
            next => this.s3.send(new CreateMultipartUploadCommand({
                Bucket: bucketName,
                Key: objectName,
            }))
                .then(data => {
                    uploadId = data.UploadId;
                    return next();
                })
                .catch(next),
            next => async.mapLimit(partNumbers, 2, (partNumber, callback) => {
                const uploadPartCopyParams = {
                    Bucket: bucketName,
                    CopySource: copySource,
                    CopySourceRange: byteRange
                        ? `bytes=${byteRange}` : undefined,
                    Key: objectName,
                    PartNumber: partNumber + 1,
                    UploadId: uploadId,
                };
                return this.s3.send(new UploadPartCopyCommand(uploadPartCopyParams))
                    .then(data => callback(null, data.ETag))
                    .catch(callback);
            }, (err, results) => {
                if (err) {
                    return next(err);
                }
                ETags = results;
                return next();
            }),
            next => this.s3.send(new CompleteMultipartUploadCommand({
                Bucket: bucketName,
                Key: objectName,
                MultipartUpload: {
                    Parts: partNumbers.map(n => ({
                        ETag: ETags[n],
                        PartNumber: n + 1,
                    })),
                },
                UploadId: uploadId,
            }))
                .then(data => next(null, data))
                .catch(next),
        ], err => {
            if (err) {
                return this.s3.send(new AbortMultipartUploadCommand({
                    Bucket: bucketName,
                    Key: objectName,
                    UploadId: uploadId,
                })).then(() => cb(err)).catch(abortErr => {
                    const aggregateError = new Error(`Original error: ${err}; Abort failed: ${abortErr}`);
                    aggregateError.originalError = err;
                    aggregateError.abortError = abortErr;
                    cb(aggregateError);
                });
            }
            return cb();
        });
    }

    getObject(bucketName, objName, cb) {
        this.s3.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: objName,
        }))
            .then(async (data) => {
                if (data.Body) {
                    const chunks = [];
                    // eslint-disable-next-line no-restricted-syntax
                    for await (const chunk of data.Body) {
                        chunks.push(chunk);
                    }
                    data.Body = Buffer.concat(chunks);
                }
                cb(null, data);
            })
            .catch(cb);
    }

    getBlobToText(containerName, blob, cb) {
        this.azure.getContainerClient(containerName).downloadToBuffer(blob).then(
            buffer => cb(null, buffer.toString()),
            cb,
        );
    }

    getBlob(containerName, blob, cb) {
        this.azure.getContainerClient(containerName).download(blob).then(rsp => {
            const data = [];
            let totalLength = 0;
            rsp.readableStreamBody.on('data', chunk => {
                totalLength += chunk.length;
                data.push(chunk);
            });
            rsp.readableStreamBody.on('end', () => {
                cb(null, Buffer.concat(data, totalLength));
            });
            rsp.readableStreamBody.on('error', err => cb(err));
        }, cb);
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
        this.s3.send(new CreateBucketCommand({ Bucket: bucketName }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    createVersionedBucket(bucketName, cb) {
        return async.series([
            next => this.s3.send(new CreateBucketCommand({ Bucket: bucketName }))
                .then(() => next())
                .catch(next),
            next => this.s3.send(new PutBucketVersioningCommand({
                Bucket: bucketName,
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            }))
                .then(data => {
                    // eslint-disable-next-line no-console
                    console.log(`[TEST] Created versioned bucket: ${bucketName}`);
                    // eslint-disable-next-line no-console
                    console.log(`[TEST] data: ${data}`);
                    next();
                })
                .catch(next),
        ], cb);
    }

    createVersionedBucketAWS(bucketName, cb) {
        return async.series([
            next => this.s3.send(new CreateBucketCommand({
                Bucket: bucketName,
                CreateBucketConfiguration: {
                    LocationConstraint: srcLocation,
                },
            }))
                .then(() => next())
                .catch(next),
            next => this.s3.send(new PutBucketVersioningCommand({
                Bucket: bucketName,
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            }))
                .then(() => next())
                .catch(next),
        ], cb);
    }

    deleteVersionedBucket(bucketName, cb) {
        return async.series([
            next => this.deleteAllVersions(bucketName, undefined, next),
            next => this.s3.send(new DeleteBucketCommand({ Bucket: bucketName }))
                .then(() => {
                    // eslint-disable-next-line no-console
                    console.log(`[TEST] Deleted versioned bucket: ${bucketName}`);
                    next();
                })
                .catch(next),
        ], cb);
    }

    putBucketVersioning(bucketName, status, cb) {
        this.s3.send(new PutBucketVersioningCommand({
            Bucket: bucketName,
            VersioningConfiguration: {
                Status: status,
            },
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    putBucketReplication(
        srcBucket,
        destBucket,
        roleArn,
        storageClass,
        cb,
    ) {
        this.s3.send(new PutBucketReplicationCommand({
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
        }))
            .then(data => {
                // eslint-disable-next-line no-console
                console.log(`[TEST] Created replication ${data}`);
                cb(null, data);
            })
            .catch(cb);
    }

    deleteBucketReplication(bucketName, cb) {
        this.s3.send(new DeleteBucketReplicationCommand({
            Bucket: bucketName,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    getHeadObject(bucketName, key, cb) {
        this.s3.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    getObjectACL(bucketName, key, cb) {
        this.s3.send(new GetObjectAclCommand({
            Bucket: bucketName,
            Key: key,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    putObjectACL(bucketName, key, cb) {
        this.s3.send(new PutObjectAclCommand({
            Bucket: bucketName,
            Key: key,
            ACL: 'public-read',
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    putObjectTagging(bucketName, key, versionId, cb) {
        this.s3.send(new PutObjectTaggingCommand({
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
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    deleteObjectTagging(bucketName, key, versionId, cb) {
        this.s3.send(new DeleteObjectTaggingCommand({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    getObjectTagging(bucketName, key, versionId, cb) {
        this.s3.send(new GetObjectTaggingCommand({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    deleteObject(bucketName, key, versionId, cb) {
        const params = {
            Bucket: bucketName,
            Key: key,
        };
        if (versionId) {
            params.VersionId = versionId;
        }
        this.s3.send(new DeleteObjectCommand(params))
            .then(data => cb(null, data))
            .catch(cb);
    }

    expectReplicationStatus(bucketName, key, versionId, expectedStatus, cb) {
        this.s3.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }))
            .then(data => {
                assert.strictEqual(data.ReplicationStatus, expectedStatus);
                return cb();
            })
            .catch(cb);
    }

    // Continue getting head object while the status is PENDING or PROCESSING.
    waitUntilReplicated(bucketName, key, versionId, cb) {
        return async.doWhilst(
            callback => this.s3.send(new HeadObjectCommand({
                Bucket: bucketName,
                Key: key,
                VersionId: versionId,
            }))
                .then(data => {
                    const cbOnce = jsutil.once(callback);
                    const status = data.ReplicationStatus;
                    // eslint-disable-next-line no-console
                    console.log(`Current replication status: ${status}`);
                    // eslint-disable-next-line no-console
                    console.log(`HeadObject data: ${JSON.stringify(data)}`);
                    assert.notStrictEqual(
                        status,
                        'FAILED',
                        `Unexpected CRR failure occurred: ${JSON.stringify(data)}`,
                    );
                    if (status === 'PENDING' || status === 'PROCESSING') {
                        return setTimeout(() => cbOnce(null, status), 4000);
                    }
                    return cbOnce(null, status);
                })
                .catch(err => {
                    const cbOnce = jsutil.once(callback);
                    return cbOnce(err);
                }),
            status => (status === 'PENDING' || status === 'PROCESSING'),
            cb,
        );
    }

    // Continue getting object while the object exists.
    waitUntilDeleted(bucketName, key, client, cb) {
        let objectExists;
        const method = client === 'azure' ? 'getBlobToText' : 'getObject';
        const expectedCode = client === 'azure' ? 'BlobNotFound' : 'NoSuchKey';
        return async.doWhilst(
            callback => this[method](bucketName, key, err => {
                const cbOnce = jsutil.once(callback);
                if (err) {
                    const errorCode = err.name || err.code;
                    if (errorCode !== expectedCode) {
                        return cbOnce(err);
                    }
                }
                objectExists = err === null;
                if (!objectExists) {
                    return cbOnce();
                }
                return setTimeout(cbOnce, 2000);
            }),
            () => objectExists,
            cb,
        );
    }

    // Continue getting head object while any backend status is PENDING.
    waitWhilePendingCRR(bucketName, key, cb) {
        let shouldContinue;
        return async.doWhilst(
            callback => this.s3.send(new HeadObjectCommand({
                Bucket: bucketName,
                Key: key,
            }))
                .then(data => {
                    const cbOnce = jsutil.once(callback);
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
                        return setTimeout(cbOnce, 2000);
                    }
                    return cbOnce();
                })
                .catch(err => {
                    const cbOnce = jsutil.once(callback);
                    return cbOnce(err);
                }),
            () => shouldContinue,
            cb,
        );
    }

    // Continue getting head object while the replication status is FAILED.
    waitWhileFailedCRR(bucketName, key, cb) {
        let shouldContinue;
        return async.doWhilst(
            callback => this.s3.send(new HeadObjectCommand({
                Bucket: bucketName,
                Key: key,
            }))
                .then(data => {
                    const cbOnce = jsutil.once(callback);
                    shouldContinue = data.ReplicationStatus === 'FAILED';
                    if (shouldContinue) {
                        return setTimeout(cbOnce, 2000);
                    }
                    return cbOnce();
                })
                .catch(err => {
                    const cbOnce = jsutil.once(callback);
                    return cbOnce(err);
                }),
            () => shouldContinue,
            cb,
        );
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
            // eslint-disable-next-line no-console
            console.log('Source object data:', srcData);
            // eslint-disable-next-line no-console
            console.log('Destination object data:', destData);
            assert.strictEqual(srcData.ReplicationStatus, 'COMPLETED');
            assert.strictEqual(
                srcData.ContentLength,
                destData.ContentLength,
            );
            this._compareObjectBody(srcData.Body, destData.Body);
            const srcUserMD = srcData.Metadata;
            assert.strictEqual(
                srcUserMD[`${destAWSLocation}-version-id`],
                destData.VersionId,
            );
            assert.strictEqual(
                srcUserMD[`${destAWSLocation}-replication-status`],
                'COMPLETED',
            );
            const destUserMD = destData.Metadata;
            assert.strictEqual(
                destUserMD['scal-version-id'],
                srcData.VersionId,
            );
            assert.strictEqual(
                destUserMD['scal-replication-status'],
                'REPLICA',
            );
            if (optionalField === 'Metadata') {
                assert.strictEqual(srcUserMD.customkey, 'customValue');
                assert.strictEqual(destUserMD.customkey, 'customValue');
            }
            if (optionalField && optionalField !== 'Metadata') {
                assert.strictEqual(
                    srcData[optionalField],
                    destData[optionalField],
                );
            }
            return cb();
        });
    }

    compareObjectsCRR(srcBucket, destClient, destBucket, key, userMetadataField, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            next => this.getObject(srcBucket, key, next),
            next => destClient.getObject(destBucket, key, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            assert.strictEqual(srcData.ReplicationStatus, 'COMPLETED');
            assert.strictEqual(destData.ReplicationStatus, 'REPLICA');
            assert.strictEqual(
                srcData.ContentLength,
                destData.ContentLength,
            );
            this._compareObjectBody(srcData.Body, destData.Body);
            const srcUserMD = srcData.Metadata;
            assert.strictEqual(
                srcData.VersionId,
                destData.VersionId,
            );
            if (userMetadataField) {
                const destUserMD = destData.Metadata;
                assert.strictEqual(
                    srcUserMD[userMetadataField],
                    destUserMD[userMetadataField],
                );
            }
            return cb();
        });
    }

    compareObjectsOneToMany(
        srcBucket,
        awsDestBucket,
        destContainer,
        gcpDestBucket,
        key,
        cb,
    ) {
        return async.parallel([
            next => this.compareObjectsAWS(
                srcBucket,
                awsDestBucket,
                key,
                undefined,
                next,
            ),
            next => this.compareObjectsAzure(
                srcBucket,
                destContainer,
                key,
                next,
            ),
            next => this.compareObjectsGCP(
                srcBucket,
                gcpDestBucket,
                key,
                next,
            ),
        ], cb);
    }

    compareObjectsAzure(srcBucket, containerName, key, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            next => this.getObject(srcBucket, key, next),
            next => this.azure.getContainerClient(containerName)
                .getProperties(`${srcBucket}/${key}`)
                .then(res => next(null, res), next), // may be removed if we use async 2.3+
            next => this.getBlob(
                containerName,
                `${srcBucket}/${key}`,
                next,
            ),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destPropResult = data[2];
            const destPropResponse = destPropResult._response;
            const destDataBuf = data[3];
            assert.strictEqual(srcData.ReplicationStatus, 'COMPLETED');
            // Azure does not have versioning so there is no version metadata
            // from Azure to set on the source.
            assert.strictEqual(
                srcData.Metadata[`${destAzureLocation}-replication-status`],
                'COMPLETED',
            );
            assert.strictEqual(destPropResult.metadata.scal_replication_status, 'REPLICA');
            assert.strictEqual(destPropResult.metadata.scal_version_id, srcData.VersionId);
            assert.strictEqual(
                destPropResponse.headers['x-ms-meta-scal_replication_status'],
                'REPLICA',
            );
            assert.strictEqual(
                destPropResponse.headers['x-ms-meta-scal_version_id'],
                srcData.VersionId,
            );
            this._compareObjectBody(srcData.Body, destDataBuf);
            return cb();
        });
    }

    compareObjectsGCP(srcBucket, destBucket, key, cb) {
        return async.series({
            wait: next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            srcData: next => this.getObject(srcBucket, key, next),
            destMetadata: next => this.getMetadata(
                destBucket,
                `${srcBucket}/${key}`,
                next,
            ),
            destData: next => this.download(
                destBucket,
                `${srcBucket}/${key}`,
                next,
            ),
        }, (err, data) => {
            if (err) {
                return cb(err);
            }
            const { srcData, destMetadata, destData } = data;
            assert.strictEqual(srcData.ReplicationStatus, 'COMPLETED');
            assert.strictEqual(
                `${srcData.ContentLength}`,
                destMetadata[0].size,
            );
            const srcUserMD = srcData.Metadata;
            const destUserMD = destMetadata[0].metadata;
            assert.strictEqual(
                srcUserMD[`${destGCPLocation}-replication-status`],
                'COMPLETED',
            );
            assert.strictEqual(
                srcUserMD[`${destGCPLocation}-version-id`],
                destMetadata[0].generation,
            );
            assert.strictEqual(
                destUserMD['scal-replication-status'],
                'REPLICA',
            );
            assert.strictEqual(
                destUserMD['scal-version-id'],
                srcData.VersionId,
            );
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
            next => this.azure.getContainerClient(containerName)
                .getProperties(`${srcBucket}/${key}`)
                .then(res => next(null, res), next), // may be removed if we use async 2.3+
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destResult = data[2];
            const { contentSettings } = destResult;
            const { headers } = destResult._response;
            let expectedVal = srcData.Metadata.customkey;
            assert.strictEqual(
                expectedVal,
                destResult.metadata.customkey,
            );
            assert.strictEqual(
                expectedVal,
                headers['x-ms-meta-customkey'],
            );
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
    }

    compareGCPObjectProperties(srcBucket, destBucket, file, cb) {
        return async.series({
            wait: next => this.waitUntilReplicated(srcBucket, file, undefined, next),
            srcData: next => this.getHeadObject(srcBucket, file, next),
            destData: next => this.getMetadata(
                destBucket,
                `${srcBucket}/${file}`,
                next,
            ),
        }, (err, data) => {
            if (err) {
                return cb(err);
            }
            const { srcData, destData } = data;
            const destProperties = destData[0];
            const destMetadata = destProperties.metadata;
            let expectedVal = srcData.Metadata.customkey;
            assert.strictEqual(expectedVal, destMetadata.customkey);
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
    }

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
            assert.strictEqual(
                data[1].Grants[0].Permission,
                data[2].Grants[0].Permission,
            );
            return cb();
        });
    }

    compareACLsCRR(srcBucket, destClient, destBucket, key, cb) {
        return async.series([
            next => this.waitUntilReplicated(srcBucket, key, undefined, next),
            next => this.getObjectACL(srcBucket, key, next),
            next => destClient.getObjectACL(destBucket, key, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            assert.strictEqual(
                data[1].Grants[0].Permission,
                data[2].Grants[0].Permission,
            );
            return cb();
        });
    }

    compareObjectTagsAWS(
        srcBucket,
        destBucket,
        key,
        scalityVersionId,
        AWSVersionId,
        cb,
    ) {
        return async.series([
            next => this.waitUntilReplicated(
                srcBucket,
                key,
                scalityVersionId,
                next,
            ),
            next => this.getObjectTagging(
                srcBucket,
                key,
                scalityVersionId,
                next,
            ),
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

    compareObjectTagCRR(
        srcBucket,
        destClient,
        destBucket,
        key,
        cb,
    ) {
        return async.series([
            next => this.waitUntilReplicated(
                srcBucket,
                key,
                undefined,
                next,
            ),
            next => this.getObjectTagging(
                srcBucket,
                key,
                undefined,
                next,
            ),
            next => destClient.getObjectTagging(
                destBucket,
                key,
                null,
                next,
            ),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            assert.deepStrictEqual(srcData.TagSet, destData.TagSet);
            return cb();
        });
    }

    compareObjectTagsAzure(
        srcBucket,
        destContainer,
        key,
        scalityVersionId,
        cb,
    ) {
        return async.series([
            next => this.waitUntilReplicated(
                srcBucket,
                key,
                scalityVersionId,
                next,
            ),
            next => this.getObjectTagging(
                srcBucket,
                key,
                scalityVersionId,
                next,
            ),
            next => this.azure.getContainerClient(destContainer)
                .getProperties(`${srcBucket}/${key}`)
                .then(res => next(null, res), next), // may be removed if we use async 2.3+
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            const destTagSet = [];
            const destTags = destData.metadata.tags;
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
            wait: next => this.waitUntilReplicated(
                srcBucket,
                file,
                scalityVersionId,
                next,
            ),
            srcData: next => this.getObjectTagging(
                srcBucket,
                file,
                scalityVersionId,
                next,
            ),
            destData: next => this.getMetadata(
                destContainer,
                `${srcBucket}/${file}`,
                next,
            ),
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
                        });
                    }
                });
            }
            assert.deepStrictEqual(srcData.TagSet, destTagSet);
            return cb();
        });
    }

    assertNoObject(bucketName, key, cb) {
        this.getObject(bucketName, key, err => {
            assert.strictEqual(err.name, 'NoSuchKey');
            return cb();
        });
    }

    assertVersionCount(bucketName, expectedCount, cb) {
        this.s3.send(new ListObjectVersionsCommand({
            Bucket: bucketName,
        }))
            .then(data => {
                const versions = data.Versions || [];
                const deleteMarkers = data.DeleteMarkers || [];
                const totalCount = versions.length + deleteMarkers.length;
                assert.strictEqual(totalCount, expectedCount);
                cb();
            })
            .catch(cb);
    }
}

module.exports = ReplicationUtility;
