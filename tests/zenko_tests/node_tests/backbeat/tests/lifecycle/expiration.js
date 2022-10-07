const uuid = require('uuid');
const async = require('async');

const { scalityS3Client } = require('../../../s3SDK');
const LifecycleUtlity = require('../../LifecycleUtility');

const utils = new LifecycleUtlity(scalityS3Client);
const getBucketName = prefix => `${prefix}${uuid.v4()}`;
const getObjectKey = prefix => `${prefix}${uuid.v4()}`;
const getObjectKeys = (prefix, count) => Array.from(Array(count)).map((_, n) => getObjectKey(`${prefix}${n}-`));

const filterTag = { Key: 'object-tag-key', Value: 'object-tag-value' };

const getFilter = (prefix, tag) => {
    if ((tag && tag.length > 1) || (prefix && tag)) {
        return {
            And: {
                Prefix: prefix || '',
                Tags: tag.length > 1 ? tag : [tag],
            },
        };
    }

    if (prefix) {
        return { Prefix: prefix };
    }

    if (tag) {
        return Array.isArray(tag) ? { Tag: tag[0] } : { Tag: tag };
    }

    return {};
};

const getExpirationObject = (id, expiration, prefix, tag, enabled) => ({
    ID: id,
    Status: enabled ? 'Enabled' : 'Disabled',
    Filter: getFilter(prefix, tag),
    Expiration: expiration,
});

const oneDay = 1000 * 60 * 60 * 24;

const expireDayRule = (prefix, tag, enabled) => getExpirationObject(
    'day expiration',
    { Days: 1 },
    prefix,
    tag,
    enabled,
);

const longExpireDayRule = (prefix, tag, enabled) => getExpirationObject(
    'day expiration',
    { Days: 2 },
    prefix,
    tag,
    enabled,
);

const expireDateRule = (prefix, tag, enabled) => getExpirationObject(
    'date expiration',
    { Date: new Date() },
    prefix,
    tag,
    enabled,
);

const longExpireDateRule = (prefix, tag, enabled) => getExpirationObject(
    'date expiration',
    { Date: new Date(Date.now() + oneDay) },
    prefix,
    tag,
    enabled,
);

const expireDeleteMarkerRule = (prefix, tag, enabled) => getExpirationObject(
    'delete marker expiration',
    { ExpiredObjectDeleteMarker: true },
    prefix,
    tag,
    enabled,
);

const expireVersionedRule = (prefix, tag, enabled) => ({
    ID: 'versioned object expiration',
    Status: enabled ? 'Enabled' : 'Disabled',
    Filter: getFilter(prefix, tag),
    NoncurrentVersionExpiration: { NoncurrentDays: 1 },
});

const longExpireVersionedRule = (prefix, tag, enabled) => ({
    ID: 'versioned object expiration',
    Status: enabled ? 'Enabled' : 'Disabled',
    Filter: getFilter(prefix, tag),
    NoncurrentVersionExpiration: { NoncurrentDays: 2 },
});

const expireMPURule = (prefix, tag, enabled) => ({
    ID: 'incomplete mpu expiration',
    Status: enabled ? 'Enabled' : 'Disabled',
    Filter: getFilter(prefix, tag),
    AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
});

const longExpireMPURule = (prefix, tag, enabled) => ({
    ID: 'incomplete mpu expiration',
    Status: enabled ? 'Enabled' : 'Disabled',
    Filter: getFilter(prefix, tag),
    AbortIncompleteMultipartUpload: { DaysAfterInitiation: 2 },
});

describe('Lifecycle Expiration', function () {
    const notTargetObjectPrefix = 'not-exp-target/';
    const targetObjectPrefix = 'exp-target/';

    utils.setSourceLocation('us-east-1');

    // GC consumer might take a long time to consume its entries.
    // If it is the case, timeout after 5 minutes and retry.
    this.retries(3);
    this.timeout(360000);

    describe('behavior: should not delete objects', () => {
        const bucketName = getBucketName('exp-disabled-');
        const objectKey = getObjectKey('exp-disabled-');

        before(done => async.series([
            next => utils.createVersionedBucket(bucketName, next),
            next => utils.putObjects(bucketName, [objectKey], 10, next),
            // // create delete marker
            next => utils.deleteObject(bucketName, objectKey, undefined, next),
            next => utils.putObjects(bucketName, [objectKey], 1, next),
            next => utils.createMultipartUpload(bucketName, objectKey, next),
            next => utils.waitUntilBucketState(bucketName, [1, 11, 1, 1], next),
        ], done));

        after(done => async.series([
            next => utils.deleteVersionedBucket(bucketName, next),
        ], done));

        it('when all rules are disabled', done => {
            const lifecycleRules = [
                expireDayRule(null, null, false),
                expireDateRule(null, null, false),
                expireDeleteMarkerRule(null, null, false),
                expireVersionedRule(null, null, false),
                expireMPURule(null, null, false),
            ];
            async.series([
                next => utils.putBucketExpiration(bucketName, lifecycleRules, next),
                next => utils.waitUntilBucketState(bucketName, [1, 11, 1, 1], next),
            ], done);
        });

        it('when objects are still fresh', done => {
            const lifecycleRules = [
                longExpireDayRule(null, null, false),
                longExpireDateRule(null, null, false),
                longExpireVersionedRule(null, null, false),
                longExpireMPURule(null, null, false),
            ];
            async.series([
                next => utils.putBucketExpiration(bucketName, lifecycleRules, next),
                next => utils.waitUntilBucketState(bucketName, [1, 11, 1, 1], next),
            ], done);
        });
    });

    [
        [
            'with date expiration (no filters)',
            [expireDateRule(null, null, true)],
            // current, versioned, delete markers, incomplete mpu
            [0, 8, 4, 0],
        ],
        [
            'with date expiration (prefix)',
            [expireDateRule(targetObjectPrefix, null, true)],
            [2, 8, 2, 0],
        ],
        [
            'with days expiration (no filters)',
            [expireDayRule(null, null, true)],
            [0, 8, 4, 0],
        ],
        [
            'with days expiration (prefix)',
            [expireDayRule(targetObjectPrefix, null, true)],
            [2, 8, 2, 0],
        ],
        [
            'with non-current version expiration (no filters)',
            [
                expireVersionedRule(null, null, true),
            ],
            [4, 4, 0, 0],
        ],
        [
            'with non-current version expiration (prefix)',
            [expireVersionedRule(targetObjectPrefix, null, true)],
            [4, 6, 0, 0],
        ],
    ].forEach(([description, rules, expected]) => describe(description, () => {
        const bucketName = getBucketName('exp-bucket-');

        before(done => async.series([
            next => utils.createVersionedBucket(bucketName, next),
            next => utils.putObjects(bucketName, getObjectKeys(notTargetObjectPrefix, 2), 2, next),
            next => utils.putObjects(bucketName, getObjectKeys(targetObjectPrefix, 2), 2, next),
        ], done));

        after(done => async.series([
            next => utils.deleteVersionedBucket(bucketName, next),
        ], done));

        it('should delete expired targets', done => async.series([
            next => utils.putBucketExpiration(bucketName, rules, next),
            next => utils.waitUntilBucketState(bucketName, expected, next),
        ], done));

    }));

    [
        [
            'with date expiration (tag filter)',
            [expireDateRule(null, filterTag, true)],
            [2, 8, 2, 0],
        ],
        [
            'with days expiration (tag filter)',
            [expireDayRule(null, filterTag, true)],
            [2, 8, 2, 0],
        ],
        [
            'with non-current version expiration (tag filter)',
            [expireVersionedRule(null, filterTag, true)],
            [4, 6, 0, 0],
        ],
    ].forEach(([description, rules, expected]) => describe(description, () => {
        const bucketName = getBucketName('exp-tagged-bucket-');

        before(done => async.series([
            next => utils.createVersionedBucket(bucketName, next),
            next => utils.putObjects(bucketName, getObjectKeys(notTargetObjectPrefix, 2), 2, next),
            next => utils.putObjectsWithTagging(bucketName, getObjectKeys(targetObjectPrefix, 2), 2, next),
        ], done));

        after(done => async.series([
            next => utils.deleteVersionedBucket(bucketName, next),
        ], done));

        it('should delete expired targets', done => async.series([
            next => utils.putBucketExpiration(bucketName, rules, next),
            next => utils.waitUntilBucketState(bucketName, expected, next),
        ], done));
    }));

    [
        [
            'with delete marker expiration (no filter)',
            [
                expireVersionedRule(null, null, true),
                expireDeleteMarkerRule(null, null, true),
            ],
            [2, 2, 0, 0],
        ],
        [
            'with delete marker expiration (prefix)',
            [
                expireVersionedRule(targetObjectPrefix, null, true),
                expireDeleteMarkerRule(targetObjectPrefix, null, true),
            ],
            [2, 3, 1, 0],
        ],
    ].forEach(([description, rules, expected]) => describe(description, () => {
        const bucketName = getBucketName('exp-bucket-');
        const objectKey = getObjectKey(targetObjectPrefix);
        const notTargetKey = getObjectKey(notTargetObjectPrefix);

        before(done => async.series([
            next => utils.createVersionedBucket(bucketName, next),
            next => async.forEach(
                [objectKey, notTargetKey],
                (key, tnext) => async.series([
                    next => utils.putObjects(bucketName, [key], 1, next),
                    next => utils.deleteObject(bucketName, key, null, next),
                    next => utils.putObjects(bucketName, [key], 1, next),
                ], tnext),
                next,
            ),
        ], done));

        after(done => async.series([
            next => utils.deleteVersionedBucket(bucketName, next),
        ], done));

        it('should delete expired targets', done => async.series([
            next => utils.putBucketExpiration(bucketName, rules, next),
            next => utils.waitUntilBucketState(bucketName, expected, next),
        ], done));
    }));

    [
        [
            'with mpu expiration (no filter)',
            [expireMPURule(null, null, true)],
            [0, 0, 0, 0],
        ],
        [
            'with mpu expiration (prefix)',
            [expireMPURule(targetObjectPrefix, null, true)],
            [0, 0, 0, 1],
        ],
    ].forEach(([description, rules, expected]) => describe(description, () => {
        const bucketName = getBucketName('exp-bucket-');
        const objectKey = getObjectKey(targetObjectPrefix);
        const notTargetKey = getObjectKey(notTargetObjectPrefix);

        before(done => async.series([
            next => utils.createVersionedBucket(bucketName, next),
            next => utils.createMultipartUpload(bucketName, objectKey, next),
            next => utils.createMultipartUpload(bucketName, notTargetKey, next),
        ], done));

        after(done => async.series([
            next => utils.deleteVersionedBucket(bucketName, next),
        ], done));

        it('should delete expired targets', done => async.series([
            next => utils.putBucketExpiration(bucketName, rules, next),
            next => utils.waitUntilBucketState(bucketName, expected, next),
        ], done));
    }));

    describe('with object-lock enabled', () => {
        // NOTE: bucket clean-up cannot be done as per the retention behavior
        // of the object-lock feature
        [
            [
                'with governance retention configured',
                'GOVERNANCE',
                [0, 4, 2, 0],
            ],
            [
                'with compliance retention configured',
                'COMPLIANCE',
                [0, 4, 2, 0],
            ],
        ].forEach(([description, mode, expected]) => describe(description, () => {
            const bucketName = getBucketName('object-lock-bucket-');
            const objectKeyPrefix = 'locked-key-';
            const rules = [
                // should delete current
                expireDayRule(null, null, true),
                // should not delete versions
                expireVersionedRule(null, null, true),
                // should not remove delete markers
                expireDeleteMarkerRule(null, null, true),
            ];

            before(done => async.series([
                next => utils.createObjectLockedBucket(bucketName, mode, next),
                next => utils.putObjects(bucketName, getObjectKeys(objectKeyPrefix, 2), 2, next),
            ], done));

            it('should not delete locked targets', done => async.series([
                next => utils.putBucketExpiration(bucketName, rules, next),
                next => utils.waitUntilBucketState(bucketName, expected, next),
            ], done));
        }));

        describe('with legal-hold defined', () => {
            const bucketName = getBucketName('object-lock-bucket-');
            const objectKeyPrefix = 'legal-hold-key-';
            const rules = [
                // should delete current
                expireDayRule(null, null, true),
                // should not delete versions
                expireVersionedRule(null, null, true),
                // should not remove delete markers
                expireDeleteMarkerRule(null, null, true),
            ];

            before(done => async.series([
                next => utils.createObjectLockedBucket(bucketName, null, next),
                next => utils.putObjectsWithLegalHold(bucketName, getObjectKeys(objectKeyPrefix, 2), 2, next),
                next => utils.putObjects(bucketName, getObjectKeys(objectKeyPrefix, 2), 2, next),
            ], done));

            it('should not delete locked targets', done => async.series([
                next => utils.putBucketExpiration(bucketName, rules, next),
                next => utils.waitUntilBucketState(bucketName, [0, 4, 2, 0], next),
            ], done));
        });
    });
});
