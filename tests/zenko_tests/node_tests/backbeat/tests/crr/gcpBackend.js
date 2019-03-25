const assert = require('assert');
const crypto = require('crypto');
const { series } = require('async');
const tags = require('mocha-tags');

const { scalityS3Client } = require('../../../s3SDK');
const gcpStorage = require('../../gcpStorage');
const ReplicationUtility = require('../../ReplicationUtility');

const utils = new ReplicationUtility(scalityS3Client, undefined, gcpStorage);
const destBucket = process.env.GCP_CRR_BUCKET_NAME;
const destGCPLocation = process.env.GCP_BACKEND_DESTINATION_LOCATION;
const srcBucket = `source-bucket-${Date.now()}`;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const filePrefix = `${srcBucket}/${hex}`;
const file = `${filePrefix}/object-to-replicate-${Date.now()}`;
const copyFile = `${file}-copy`;
const copySource = `/${srcBucket}/${file}`;
// eslint-disable-next-line
const fileutf8 = `${filePrefix}/%EA%9D%8B崰㈌㒈保轖䳷䀰⺩ቆ楪僷ꈅꓜ퇬枅࿷염곞召㸾⌙ꪊᆐ庍뉆䌗↎幐냂詴 끴鹲萯⇂쫤ᛩ꺶㖭簹릍铰᫫暨鿐魪셑蛃춧㡡竺뫁噛̷ᗰⷑ錜⑔痴䧫㾵᏷ำꎆ꼵껪멷㄀誕㳓腜쒃컹㑻鳃삚舿췈孨੦⮀Ǌ곓⵪꺼꜈嗼뫘悕錸瑺⁤⑬১㵀⡸Ҏ礄䧛졼⮦ٞ쫁퓡厈譤擵泶鵇俻縫륒㜓垻ㆩꝿ詀펉ᆙ舑䜾힑藪碙ꀎꂰ췊Ᏻ   㘺幽醛잯ද汧Ꟑꛒⶨ쪸숞헹㭔ꡔᘼ뺓ᡆ᡾ᑟ䅅퀭耓弧⢠⇙폪ް蛧⃪Ἔ돫ꕢ븥ヲ캂䝄쟐颺ᓾ둾Ұ껗礞ᾰ瘹蒯硳풛瞋襎奺熝妒컚쉴⿂㽝㝳駵鈚䄖戭䌸᫲ᇁ䙪鸮ᐴ稫ⶭ뀟ھ⦿䴳稉ꉕ捈袿놾띐✯伤䃫⸧ꠏ瘌틳藔ˋ㫣敀䔩㭘식↴⧵佶痊牌ꪌ搒꾛æᤈべ쉴挜炩⽍舘ꆗ줣徭Z䐨 敗羥誜嘳ֶꫜ걵ࣀ묟ኋ拃秷䨸菥䟆곘縧멀煣⧃⏶혣뎧邕⢄⭖陙䣎灏ꗛ僚䌁䠒䲎둘ꪎ傩쿌ᨌ뀻阥눉넠猌ㆯ㰢船戦跏灳蝒礯鞰諾벥煸珬㟑孫鞹Ƭꄹ孙ꢱ钐삺ᓧ鈠䁞〯蘼᫩헸ῖ"`; // eslint-disable-line
const REPLICATION_TIMEOUT = 300000;

describe('Replication with GCP backend', function() {
    this.timeout(REPLICATION_TIMEOUT);
    this.retries(3);
    let roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(done => series([
        next => utils.createVersionedBucket(srcBucket, next),
        next => utils.putBucketReplicationMultipleBackend(srcBucket,
            destBucket, roleArn, destGCPLocation, next),
    ], done));

    afterEach(done => series([
        next => utils.deleteVersionedBucket(srcBucket, next),
        next => utils.deleteAllFiles(destBucket, filePrefix, next),
    ], done));

    it('should replicate an object', done => series([
        next => utils.putObject(srcBucket, file, Buffer.alloc(1), next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
    ], done));

    it.skip('should replicate an object with UTF-8 encoding', done => series([
        next => utils.putObject(srcBucket, fileutf8, Buffer.alloc(1), next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, fileutf8, next),
    ], done));

    it('should replicate a copied object', done => series([
        next => utils.putObject(srcBucket, file, Buffer.alloc(1), next),
        next => utils.copyObject(srcBucket, copySource, copyFile, next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, copyFile, next),
        next => utils.waitUntilReplicated(srcBucket, file, undefined, next),
    ], done));

    it('should replicate a MPU object: 2 parts', done => series([
        next => utils.completeMPUGCP(srcBucket, file, 2, next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
    ], done));

    it('should replicate a MPU object: 10 parts', done => series([
        next => utils.completeMPUGCP(srcBucket, file, 10, next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
    ], done));

    // GCP MPUs are limited to 1024 parts, so check that we can still replicate
    // and source MPU that is greater than 1024 parts.
    it.skip('should replicate a MPU object: 1025 parts', done => series([
        next => utils.completeMPUGCP(srcBucket, file, 1025, next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
    ], done));

    [undefined,
    `0-${1024 * 1024 * 5}`,
    `${1024 * 1024 * 2}-${1024 * 1024 * 7}`].forEach(range =>
        it('should replicate a MPU with parts copied from another MPU with ' +
        `byte range '${range}' for each part`, done => series([
            next => utils.completeMPUGCP(srcBucket, file, 2, next),
            next => utils.completeMPUWithPartCopy(srcBucket, copyFile,
                copySource, range, 2, next),
            next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
        ], done)));

    it.skip('should delete the destination object when putting a delete marker on ' +
    'the source object', done => series([
        next => utils.putObject(srcBucket, file, Buffer.alloc(1), next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
        next => utils.deleteObject(srcBucket, file, null, next),
        next => utils.waitUntilDeleted(destBucket, file, 'gcp', next),
        next => utils.getMetadata(destBucket, `${srcBucket}/${file}`, err => {
            assert.strictEqual(err.message,
                `No such object: ${destBucket}/${srcBucket}/${file}`);
            return next();
        }),
    ], done));

    it('should replicate object tags of the latest version', done =>
    series([
        next => utils.putObject(srcBucket, file, Buffer.alloc(1), next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
        next => utils.putObjectTagging(srcBucket, file, undefined, next),
        next => utils.compareObjectTagsGCP(srcBucket, destBucket, file,
            undefined, next),
    ], done));

    it('should replicate deleting object tags of the latest version',
    done => series([
        next => utils.putObject(srcBucket, file, Buffer.alloc(1), next),
        next => utils.compareObjectsGCP(srcBucket, destBucket, file, next),
        next => utils.putObjectTagging(srcBucket, file, undefined, next),
        next => utils.compareObjectTagsGCP(srcBucket, destBucket, file,
            undefined, next),
        next => utils.deleteObjectTagging(srcBucket, file, undefined, next),
        next => utils.compareObjectTagsGCP(srcBucket, destBucket, file,
            undefined, next),
    ], done));

    it('should replicate an object with properties', done => series([
        next => utils.putObjectWithProperties(srcBucket, file, Buffer.alloc(1),
            next),
        next => utils.compareGCPObjectProperties(srcBucket, destBucket, file,
            next),
    ], done));

    it('should replicate a copied object with properties', done => series([
        next => utils.putObjectWithProperties(srcBucket, file, Buffer.alloc(1),
            next),
        next => utils.copyObject(srcBucket, copySource, copyFile, next),
        next => utils.compareGCPObjectProperties(srcBucket, destBucket,
            copyFile, next),
        next => utils.waitUntilReplicated(srcBucket, file, undefined, next),
    ], done));

    it('should replicate a MPU object with properties', done => series([
        next => utils.completeMPUGCPWithProperties(srcBucket, file, 2, next),
        next => utils.compareGCPObjectProperties(srcBucket, destBucket,
            file, next),
    ], done));
});
