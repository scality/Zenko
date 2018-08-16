const assert = require('assert');
const crypto = require('crypto');
const uuid = require('uuid/v4');
const { series, parallel, timesSeries, each } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
const destBucket = process.env.AWS_S3_BACKBEAT_BUCKET_NAME;
const destLocation = process.env.AWS_S3_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const REPLICATION_TIMEOUT = 300000;

describe('Replication with AWS backend', function() {
    this.timeout(REPLICATION_TIMEOUT);
    this.retries(3);
    let roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(function beforeEachF(done) {
        this.currentTest.srcBucket =
            `source-bucket-${uuid().replace(/-/g, '')}`;
        this.currentTest.keyPrefix =
            `${this.currentTest.srcBucket}/${hex}`;
        this.currentTest.key =
            `${this.currentTest.keyPrefix}/object-to-replicate-` +
            `${uuid().replace(/-/g, '')}`;
        this.currentTest.copyKey = `${this.currentTest.key}-copy`;
        this.currentTest.copySource =
            `/${this.currentTest.srcBucket}/${this.currentTest.key}`;
        // eslint-disable-next-line
        this.currentTest.keyutf8 = `${this.currentTest.keyPrefix}/%EA%9D%8崰㈌㒈保轖䳷䀰⺩ቆ楪僷ꈅꓜ퇬枅࿷염곞召㸾⌙ꪊᆐ庍뉆䌗↎幐냂詴 끴鹲萯⇂쫤ᛩ꺶㖭簹릍铰᫫暨鿐魪셑蛃춧㡡竺뫁噛̷ᗰⷑ錜⑔痴䧫㾵᏷ำꎆ꼵껪멷㄀誕㳓腜쒃컹㑻鳃삚舿췈孨੦⮀Ǌ곓⵪꺼꜈嗼뫘悕錸瑺⁤⑬১㵀⡸Ҏ礄䧛졼⮦ٞ쫁퓡垻ㆩꝿ詀펉ᆙ舑䜾힑藪碙ꀎꂰ췊Ᏻ   㘺幽醛잯ද汧Ꟑꛒⶨ쪸숞헹㭔ꡔᘼ뺓ᡆ᡾ᑟ䅅퀭耓弧⢠⇙폪ް蛧⃪Ἔ돫ꕢ븥ヲ캂䝄쟐颺ᓾ둾Ұ껗礞ᾰ瘹蒯硳풛瞋襎奺熝妒컚쉴⿂㽝㝳駵鈚䄖戭䌸᫲ᇁ䙪鸮ᐴ稫ⶭ뀟ھ⦿䴳稉ꉕ捈袿놾띐✯伤䃫⸧ꠏ瘌틳藔ˋ㫣敀䔩㭘식↴⧵佶痊牌ꪌ搒꾛æᤈべ쉴挜炩⽍舘ꆗ줣徭Z䐨 敗羥誜嘳ֶꫜ걵ࣀ묟ኋ拃秷䨸菥䟆곘縧멀煣⧃⏶혣뎧邕⢄⭖陙䣎灏ꗛ僚䌁䠒䲎둘ꪎ傩쿌ᨌ뀻阥눉넠猌ㆯ㰢船戦跏灳蝒礯鞰諾벥煸珬㟑孫鞹Ƭꄹ孙ꢱ钐삺ᓧ鈠䁞〯蘼᫩헸ῖ"`;
        return series([
            next => scalityUtils.createVersionedBucket(
                this.currentTest.srcBucket, next),
            next => scalityUtils.putBucketReplicationMultipleBackend(
                this.currentTest.srcBucket, destBucket, roleArn, destLocation,
                next),
        ], done);
    });

    afterEach(function afterEachF(done) {
        return series([
            next => scalityUtils.deleteVersionedBucket(
                this.currentTest.srcBucket, next),
            // Destination location has falsy bucket match property, so we
            // update the key prefix.
            next => awsUtils.deleteAllVersions(destBucket,
                `${this.currentTest.srcBucket}/${this.currentTest.keyPrefix}`,
                next),
        ], done);
    });

    it('should replicate an object', function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });

    it('should replicate a zero byte object', function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                undefined, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });

    // AWS documentation: the name for a key is a sequence of Unicode characters
    // whose UTF-8 encoding is at most 1024 bytes long.
    it.skip('should replicate an object with UTF-8 encoding',
    function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket,
                this.test.keyutf8, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.keyutf8, undefined, next),
        ], done);
    });

    it('should replicate a copied object', function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.copyKey, undefined, next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
                this.test.key, undefined, next),
        ], done);
    });

    it('should replicate a MPU object: single 0 byte part', function itF(done) {
        return series([
            next => scalityUtils.completeSinglePartMPU(this.test.srcBucket,
                this.test.key, 0, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });

    it('should replicate a MPU object: single 1 byte part', function itF(done) {
        return series([
            next => scalityUtils.completeSinglePartMPU(this.test.srcBucket,
                this.test.key, 1, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });

    it('should replicate a MPU object: 2 parts', function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });

    it('should replicate a MPU object: 10 parts', function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 10, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });

    [undefined,
    `0-${1024 * 1024 * 5}`,
    `${1024 * 1024 * 2}-${1024 * 1024 * 7}`].forEach(range =>
        it('should replicate a MPU with parts copied from another MPU with ' +
        `byte range '${range}' for each part`, function itF(done) {
            return series([
                next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                    this.test.key, 2, next),
                next => scalityUtils.completeMPUWithPartCopy(
                    this.test.srcBucket, this.test.copyKey,
                    this.test.copySource, range, 2, next),
                next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                    destBucket, this.test.copyKey, undefined, next),
                // avoid a race at cleanup by ensuring everything is replicated
                next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
                    this.test.key, undefined, next),
            ], done);
        }));

    // Object ACLs would not be applicable on AWS: they should not
    // trigger a replication task at all (i.e. stay in COMPLETED status)
    it('should not replicate object ACL', function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareACLsAWS(this.test.srcBucket, destBucket,
                this.test.key, next),
            next => scalityUtils.putObjectACL(this.test.srcBucket,
                this.test.key, next),
            next => scalityUtils.expectReplicationStatus(this.test.srcBucket,
                this.test.key, undefined, 'COMPLETED', next),
        ], done);
    });

    it('should put delete marker on destination bucket when deleting the ' +
    'source object', function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.deleteObject(this.test.srcBucket,
                this.test.key, null, next),
            next => scalityUtils.assertNoObject(this.test.srcBucket,
                this.test.key, next),
            next => awsUtils.waitUntilDeleted(destBucket, this.test.key, 's3',
                next),
            next => awsUtils.assertNoObject(destBucket, this.test.key, next),
        ], done);
    });

    it('should replicate object tags of the latest version',
    function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
        ], done);
    });

    it('should replicate object tags of a previous version',
    function itF(done) {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => awsUtils.getHeadObject(destBucket,
                `${this.test.srcBucket}/${this.test.key}`,
        (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, firstVersionScality, firstVersionAWS,
                next),
        ], done);
    });

    it('should replicate deleting object tags of the latest version',
    function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
            next => scalityUtils.deleteObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
        ], done);
    });

    it('should replicate deleting object tags of a previous version',
    function itF(done) {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => awsUtils.getHeadObject(destBucket,
                `${this.test.srcBucket}/${this.test.key}`,
            (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, firstVersionScality,
                firstVersionAWS, next),
            next => scalityUtils.deleteObjectTagging(this.test.srcBucket,
                this.test.key, firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, firstVersionScality,
                firstVersionAWS, next),
        ], done);
    });

    it('should replicate object tags of the latest MPU version',
    function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
        ], done);
    });

    // this test should work in general but with current
    // implementation it's racy since there's a possibility that the
    // COMPLETED replication status may be set before tags are
    // replicated, so skip it for now
    it.skip('should replicate object tags of an MPU version when tagging is ' +
    'put before replication is complete', function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 5, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
        ], done);
    });

    it('should replicate object tags of a previous MPU version',
    function itF(done) {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => awsUtils.getHeadObject(destBucket,
                `${this.test.srcBucket}/${this.test.key}`,
            (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, firstVersionScality,
                firstVersionAWS, next),
        ], done);
    });

    it('should replicate deleting object tags of the latest MPU version',
    function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
            next => scalityUtils.deleteObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
        ], done);
    });

    // this test should work in general but with current
    // implementation it's racy since there's a possibility that the
    // COMPLETED replication status may be set before tags are
    // replicated, so skip it for now
    it.skip('should replicate object tags of an MPU version when tagging is ' +
    'put and then deleted before replication is complete', function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 5, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.deleteObjectTagging(this.test.srcBucket,
                this.test.key, undefined, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, undefined, next),
        ], done);
    });

    it('should replicate deleting object tags of a previous MPU version',
    function itF(done) {
        let firstVersionScality = null;
        let firstVersionAWS = null;
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => awsUtils.getHeadObject(destBucket,
                `${this.test.srcBucket}/${this.test.key}`,
            (err, data) => {
                if (err) {
                    return next(err);
                }
                firstVersionScality = data.Metadata['scal-version-id'];
                firstVersionAWS = data.VersionId;
                return next();
            }),
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.putObjectTagging(this.test.srcBucket,
                this.test.key, firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, firstVersionScality,
                firstVersionAWS, next),
            next => scalityUtils.deleteObjectTagging(this.test.srcBucket,
                this.test.key, firstVersionScality, next),
            next => scalityUtils.compareObjectTagsAWS(this.test.srcBucket,
                destBucket, this.test.key, firstVersionScality,
                firstVersionAWS, next),
        ], done);
    });

    it('should replicate an object with custom user metadata',
    function itF(done) {
        return series([
            next => scalityUtils.putObjectWithUserMetadata(this.test.srcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'Metadata', next),
        ], done);
    });

    it('should replicate an object with content-type', function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentType(this.test.srcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentType', next),
        ], done);
    });

    it('should replicate an object with cache control', function itF(done) {
        return series([
            next => scalityUtils.putObjectWithCacheControl(this.test.srcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'CacheControl', next),
        ], done);
    });

    it('should replicate an object with content disposition',
    function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentDisposition(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentDisposition', next),
        ], done);
    });

    it('should replicate an object with content encoding', function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentEncoding(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentEncoding', next),
        ], done);
    });

    it('should replicate an object with content language', function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentLanguage(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentLanguage', next),
        ], done);
    });

    it('should replicate an object copy with custom user metadata',
    function itF(done) {
        return series([
            next => scalityUtils.putObjectWithUserMetadata(this.test.srcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
            next => scalityUtils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.copyKey, 'Metadata', next),
        ], done);
    });

    it('should replicate an object copy with content-type', function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentType(this.test.srcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.copyKey, 'ContentType', next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
                this.test.key, undefined, next),
        ], done);
    });

    it('should replicate an object copy with cache control',
    function itF(done) {
        return series([
            next => scalityUtils.putObjectWithCacheControl(this.test.srcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.copyKey, 'CacheControl', next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
                this.test.key, undefined, next),
        ], done);
    });

    it('should replicate an object copy with content disposition',
    function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentDisposition(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.copyKey, 'ContentDisposition', next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
                this.test.key, undefined, next),
        ], done);
    });

    it('should replicate an object copy with content encoding',
    function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentEncoding(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.copyKey, 'ContentEncoding', next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
                this.test.key, undefined, next),
        ], done);
    });

    it('should replicate an object copy with content language',
    function itF(done) {
        return series([
            next => scalityUtils.putObjectWithContentLanguage(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.copyKey, 'ContentLanguage', next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
                this.test.key, undefined, next),
        ], done);
    });

    it('should replicate an MPU object with custom user metadata',
    function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWSWithProperties(
                this.test.srcBucket, this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'Metadata', next),
        ], done);
    });

    it('should replicate an MPU object with content-type', function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWSWithProperties(
                this.test.srcBucket, this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentType', next),
        ], done);
    });

    it('should replicate an MPU object with cache control', function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWSWithProperties(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'CacheControl', next),
        ], done);
    });

    it('should replicate an MPU object with content disposition',
    function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWSWithProperties(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentDisposition', next),
        ], done);
    });

    it('should replicate an MPU object with content encoding',
    function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWSWithProperties(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentEncoding', next),
        ], done);
    });

    it('should replicate an MPU object with content language',
    function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWSWithProperties(
                this.test.srcBucket, this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, 'ContentLanguage', next),
        ], done);
    });
});

describe('Replication with AWS backend: source AWS location', function() {
    this.timeout(REPLICATION_TIMEOUT);
    let roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(function beforeEachF(done) {
        this.currentTest.srcBucket = `source-bucket-${Date.now()}`;
        this.currentTest.keyPrefix = `${this.currentTest.srcBucket}/${hex}`;
        this.currentTest.key =
            `${this.currentTest.keyPrefix}/object-to-replicate-${Date.now()}`;
        return series([
            next => scalityUtils.createVersionedBucketAWS(
                this.currentTest.srcBucket, next),
            next => scalityUtils.putBucketReplicationMultipleBackend(
                this.currentTest.srcBucket, destBucket, roleArn, destLocation,
                next),
        ], done);
    });

    afterEach(function afterEachF(done) {
        return series([
            next => scalityUtils.deleteVersionedBucket(
                this.currentTest.srcBucket, next),
            // Destination location has falsy bucket match property, so we update
            // the key prefix.
            next => awsUtils.deleteAllVersions(destBucket,
                `${this.currentTest.srcBucket}/${this.currentTest.keyPrefix}`,
                next),
        ], done);
    });

    it('should replicate an object', function itF(done) {
        return series([
            next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });

    it('should replicate a MPU object: 2 parts', function itF(done) {
        return series([
            next => scalityUtils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => scalityUtils.compareObjectsAWS(this.test.srcBucket,
                destBucket, this.test.key, undefined, next),
        ], done);
    });
});
