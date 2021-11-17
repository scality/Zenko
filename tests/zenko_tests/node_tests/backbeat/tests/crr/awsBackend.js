const assert = require('assert');
const crypto = require('crypto');
const { series, parallel, timesSeries, each } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
const srcBucket = `source-bucket-${Date.now()}`;
const destBucket = process.env.AWS_CRR_BUCKET_NAME;
const destLocation = process.env.AWS_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;
const copyKey = `${key}-copy`;
const copySource = `/${srcBucket}/${key}`;
// eslint-disable-next-line
const keyutf8 = `${keyPrefix}/%EA%9D%8崰㈌㒈保轖䳷䀰⺩ቆ楪僷ꈅꓜ퇬枅࿷염곞召㸾⌙ꪊᆐ庍뉆䌗↎幐냂詴 끴鹲萯⇂쫤ᛩ꺶㖭簹릍铰᫫暨鿐魪셑蛃춧㡡竺뫁噛̷ᗰⷑ錜⑔痴䧫㾵᏷ำꎆ꼵껪멷㄀誕㳓腜쒃컹㑻鳃삚舿췈孨੦⮀Ǌ곓⵪꺼꜈嗼뫘悕錸瑺⁤⑬১㵀⡸Ҏ礄䧛졼⮦ٞ쫁퓡垻ㆩꝿ詀펉ᆙ舑䜾힑藪碙ꀎꂰ췊Ᏻ   㘺幽醛잯ද汧Ꟑꛒⶨ쪸숞헹㭔ꡔᘼ뺓ᡆ᡾ᑟ䅅퀭耓弧⢠⇙폪ް蛧⃪Ἔ돫ꕢ븥ヲ캂䝄쟐颺ᓾ둾Ұ껗礞ᾰ瘹蒯硳풛瞋襎奺熝妒컚쉴⿂㽝㝳駵鈚䄖戭䌸᫲ᇁ䙪鸮ᐴ稫ⶭ뀟ھ⦿䴳稉ꉕ捈袿놾띐✯伤䃫⸧ꠏ瘌틳藔ˋ㫣敀䔩㭘식↴⧵佶痊牌ꪌ搒꾛æᤈべ쉴挜炩⽍舘ꆗ줣徭Z䐨 敗羥誜嘳ֶꫜ걵ࣀ묟ኋ拃秷䨸菥䟆곘縧멀煣⧃⏶혣뎧邕⢄⭖陙䣎灏ꗛ僚䌁䠒䲎둘ꪎ傩쿌ᨌ뀻阥눉넠猌ㆯ㰢船戦跏灳蝒礯鞰諾벥煸珬㟑孫鞹Ƭꄹ孙ꢱ钐삺ᓧ鈠䁞〯蘼᫩헸ῖ"`;
const REPLICATION_TIMEOUT = 300000;

describe('Replication with AWS backend', function() {
    this.timeout(REPLICATION_TIMEOUT);
    this.retries(3);
    let roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(done => series([
        next => scalityUtils.createVersionedBucket(srcBucket, next),
        next => scalityUtils.putBucketReplicationMultipleBackend(srcBucket,
            destBucket, roleArn, destLocation, next),
    ], done));

    afterEach(done => series([
        next => scalityUtils.deleteVersionedBucket(srcBucket, next),
        // Destination location has falsy bucket match property, so we update
        // the key prefix.
        next => awsUtils.deleteAllVersions(destBucket,
            `${srcBucket}/${keyPrefix}`, next),
    ], done));

    it('should replicate an object', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a zero byte object', done => series([
        next => scalityUtils.putObject(srcBucket, key, undefined, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    // AWS documentation: the name for a key is a sequence of Unicode characters
    // whose UTF-8 encoding is at most 1024 bytes long.
    it.skip('should replicate an object with UTF-8 encoding', done => series([
        next => scalityUtils.putObject(srcBucket, keyutf8, Buffer.alloc(1),
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, keyutf8,
            undefined, next),
    ], done));

    it('should replicate a copied object', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            undefined, next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate a MPU object: single 0 byte part', done => series([
        next => scalityUtils.completeSinglePartMPU(srcBucket, key, 0, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a MPU object: single 1 byte part', done => series([
        next => scalityUtils.completeSinglePartMPU(srcBucket, key, 1, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it.skip('should replicate a MPU object: 2 parts', done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it.skip('should replicate a MPU object: 10 parts', done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 10, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    [undefined,
    `0-${1024 * 1024 * 5}`,
    `${1024 * 1024 * 2}-${1024 * 1024 * 7}`].forEach(range =>
        it.skip('should replicate a MPU with parts copied from another MPU with ' +
        `byte range '${range}' for each part`, done => series([
            next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
            next => scalityUtils.completeMPUWithPartCopy(srcBucket, copyKey,
                copySource, range, 2, next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket,
                copyKey, undefined, next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                     next),
        ], done)));

    // Object ACLs would not be applicable on AWS: they should not
    // trigger a replication task at all (i.e. stay in COMPLETED status)
    it('should not replicate object ACL', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.compareACLsAWS(srcBucket, destBucket, key, next),
        next => scalityUtils.putObjectACL(srcBucket, key, next),
        next => scalityUtils.expectReplicationStatus(srcBucket, key, undefined,
                                                     'COMPLETED', next),
    ], done));

    it('should put delete marker on destination bucket when deleting the ' +
    'source object', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.deleteObject(srcBucket, key, null, next),
        next => awsUtils.waitUntilDeleted(destBucket, key, 's3', next),
        next => awsUtils.assertNoObject(destBucket, key, next),
    ], done));

    it('should replicate object tags of the latest version', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.putObjectTagging(srcBucket, key, undefined, next),
        next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket, key,
            undefined, undefined, next),
    ], done));

    it('should replicate object tags of a previous version', done => {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1),
                next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => awsUtils.getHeadObject(destBucket, `${srcBucket}/${key}`,
        (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1),
                next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => scalityUtils.putObjectTagging(srcBucket, key,
                firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, firstVersionScality, firstVersionAWS, next),
        ], done);
    });

    it('should replicate deleting object tags of the latest version',
    done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.putObjectTagging(srcBucket, key, undefined, next),
        next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket, key,
            undefined, undefined, next),
        next => scalityUtils.deleteObjectTagging(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket, key,
            undefined, undefined, next),
    ], done));

    it('should replicate deleting object tags of a previous version',
    done => {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1),
                next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => awsUtils.getHeadObject(destBucket, `${srcBucket}/${key}`,
            (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1),
                next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => scalityUtils.putObjectTagging(srcBucket, key,
                firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, firstVersionScality, firstVersionAWS, next),
            next => scalityUtils.deleteObjectTagging(srcBucket, key,
                firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, firstVersionScality, firstVersionAWS, next),
        ], done);
    });

    it.skip('should replicate object tags of the latest MPU version', done =>
    series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.putObjectTagging(srcBucket, key, undefined, next),
        next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket, key,
            undefined, undefined, next),
    ], done));

    // this test should work in general but with current
    // implementation it's racy since there's a possibility that the
    // COMPLETED replication status may be set before tags are
    // replicated, so skip it for now
    it.skip('should replicate object tags of an MPU version when tagging is ' +
    'put before replication is complete', done =>
        series([
            next => scalityUtils.completeMPUAWS(srcBucket, key, 5, next),
            next => scalityUtils.putObjectTagging(srcBucket, key, undefined,
                next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, undefined, undefined, next),
        ], done));

    it.skip('should replicate object tags of a previous MPU version', done => {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => awsUtils.getHeadObject(destBucket, `${srcBucket}/${key}`,
            (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => scalityUtils.putObjectTagging(srcBucket, key,
                firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, firstVersionScality, firstVersionAWS, next),
        ], done);
    });

    it.skip('should replicate deleting object tags of the latest MPU version',
    done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.putObjectTagging(srcBucket, key, undefined, next),
        next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket, key,
            undefined, undefined, next),
        next => scalityUtils.deleteObjectTagging(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket, key,
            undefined, undefined, next),
    ], done));

    // this test should work in general but with current
    // implementation it's racy since there's a possibility that the
    // COMPLETED replication status may be set before tags are
    // replicated, so skip it for now
    it.skip('should replicate object tags of an MPU version when tagging is ' +
    'put and then deleted before replication is complete', done =>
        series([
            next => scalityUtils.completeMPUAWS(srcBucket, key, 5, next),
            next => scalityUtils.putObjectTagging(srcBucket, key, undefined,
                next),
            next => scalityUtils.deleteObjectTagging(srcBucket, key, undefined,
                next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, undefined, undefined, next),
        ], done));

    it.skip('should replicate deleting object tags of a previous MPU version',
    done => {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => awsUtils.getHeadObject(destBucket, `${srcBucket}/${key}`,
            (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => scalityUtils.putObjectTagging(srcBucket, key,
                firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, firstVersionScality, firstVersionAWS, next),
            next => scalityUtils.deleteObjectTagging(srcBucket, key,
                firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket,
                key, firstVersionScality, firstVersionAWS, next),
        ], done);
    });

    it('should replicate an object with custom user metadata', done =>
    series([
        next => scalityUtils.putObjectWithUserMetadata(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'Metadata', next),
    ], done));

    it('should replicate an object with content-type', done => series([
        next => scalityUtils.putObjectWithContentType(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentType', next),
    ], done));

    it('should replicate an object with cache control', done => series([
        next => scalityUtils.putObjectWithCacheControl(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'CacheControl', next),
    ], done));

    it('should replicate an object with content disposition', done =>
    series([
        next => scalityUtils.putObjectWithContentDisposition(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentDisposition', next),
    ], done));

    it('should replicate an object with content encoding', done =>
    series([
        next => scalityUtils.putObjectWithContentEncoding(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentEncoding', next),
    ], done));

    it('should replicate an object with content language', done =>
    series([
        next => scalityUtils.putObjectWithContentLanguage(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentLanguage', next),
    ], done));

    it('should replicate an object copy with custom user metadata', done =>
    series([
        next => scalityUtils.putObjectWithUserMetadata(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            'Metadata', next),
    ], done));

    it('should replicate an object copy with content-type', done =>
    series([
        next => scalityUtils.putObjectWithContentType(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            'ContentType', next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate an object copy with cache control', done =>
    series([
        next => scalityUtils.putObjectWithCacheControl(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            'CacheControl', next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate an object copy with content disposition', done =>
    series([
        next => scalityUtils.putObjectWithContentDisposition(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            'ContentDisposition', next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate an object copy with content encoding', done =>
    series([
        next => scalityUtils.putObjectWithContentEncoding(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            'ContentEncoding', next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate an object copy with content language', done =>
    series([
        next => scalityUtils.putObjectWithContentLanguage(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            'ContentLanguage', next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it.skip('should replicate an MPU object with custom user metadata', done =>
    series([
        next => scalityUtils.completeMPUAWSWithProperties(srcBucket, key,
            2, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'Metadata', next),
    ], done));

    it.skip('should replicate an MPU object with content-type', done => series([
        next => scalityUtils.completeMPUAWSWithProperties(srcBucket, key, 2,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentType', next),
    ], done));

    it.skip('should replicate an MPU object with cache control', done => series([
        next => scalityUtils.completeMPUAWSWithProperties(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'CacheControl', next),
    ], done));

    it.skip('should replicate an MPU object with content disposition', done =>
    series([
        next => scalityUtils.completeMPUAWSWithProperties(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentDisposition', next),
    ], done));

    it.skip('should replicate an MPU object with content encoding', done =>
    series([
        next => scalityUtils.completeMPUAWSWithProperties(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentEncoding', next),
    ], done));

    it.skip('should replicate an MPU object with content language', done =>
    series([
        next => scalityUtils.completeMPUAWSWithProperties(srcBucket, key,
            Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            'ContentLanguage', next),
    ], done));
});

describe.skip('Replication with AWS backend: source AWS location', function() {
    this.timeout(REPLICATION_TIMEOUT);
    let roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(done => series([
        next => scalityUtils.createVersionedBucketAWS(srcBucket, next),
        next => scalityUtils.putBucketReplicationMultipleBackend(srcBucket,
            destBucket, roleArn, destLocation, next),
    ], done));

    afterEach(done => series([
        next => scalityUtils.deleteVersionedBucket(srcBucket, next),
        // Destination location has falsy bucket match property, so we update
        // the key prefix.
        next => awsUtils.deleteAllVersions(destBucket,
            `${srcBucket}/${keyPrefix}`, next),
    ], done));

    it('should replicate an object', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a MPU object: 2 parts', done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));
});
