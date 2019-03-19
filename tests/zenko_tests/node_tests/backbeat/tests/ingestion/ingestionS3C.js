const assert = require('assert');
const crypto = require('crypto');
const async = require('async');
const uuid = require('uuid/v4');

const { scalityS3Client, ringS3Client } = require('../../../s3SDK');
const IngestionUtility = require('../../IngestionUtility');

const scalityUtils = new IngestionUtility(scalityS3Client, ringS3Client);
const ringS3CUtils = new IngestionUtility(ringS3Client);
const ingestionSrcBucket = process.env.RING_S3C_INGESTION_SRC_BUCKET_NAME;
const srcLocation = process.env.RING_S3C_BACKEND_SOURCE_LOCATION;
const location = `${srcLocation}:ingest`;
// eslint-disable-next-line
const keyutf8 = `%EA%9D%8崰㈌㒈保轖䳷䀰⺩ቆ楪僷ꈅꓜ퇬枅࿷염곞召㸾⌙ꪊᆐ庍뉆䌗↎幐냂詴 끴鹲萯⇂쫤ᛩ꺶㖭簹릍铰᫫暨鿐魪셑蛃춧㡡竺뫁噛̷ᗰⷑ錜⑔痴䧫㾵᏷ำꎆ꼵껪멷㄀誕㳓腜쒃컹㑻鳃삚舿췈孨੦⮀Ǌ곓⵪꺼꜈嗼뫘悕錸瑺⁤⑬১㵀⡸Ҏ礄䧛졼⮦ٞ쫁퓡垻ㆩꝿ詀펉ᆙ舑䜾힑藪碙ꀎꂰ췊Ᏻ   㘺幽醛잯ද汧Ꟑꛒⶨ쪸숞헹㭔ꡔᘼ뺓ᡆ᡾ᑟ䅅퀭耓弧⢠⇙폪ް蛧⃪Ἔ돫ꕢ븥ヲ캂䝄쟐颺ᓾ둾Ұ껗礞ᾰ瘹蒯硳풛瞋襎奺熝妒컚쉴⿂㽝㝳駵鈚䄖戭䌸᫲ᇁ䙪鸮ᐴ稫ⶭ뀟ھ⦿䴳稉ꉕ捈袿놾띐✯伤䃫⸧ꠏ瘌틳藔ˋ㫣敀䔩㭘식↴⧵佶痊牌ꪌ搒꾛æᤈべ쉴挜炩⽍舘ꆗ줣徭Z䐨 敗羥誜嘳ֶꫜ걵ࣀ묟ኋ拃秷䨸菥䟆곘縧멀煣⧃⏶혣뎧邕⢄⭖陙䣎灏ꗛ僚䌁䠒䲎둘ꪎ傩쿌ᨌ뀻阥눉넠猌ㆯ㰢船戦跏灳蝒礯鞰諾벥煸珬㟑孫鞹Ƭꄹ孙ꢱ钐삺ᓧ鈠䁞〯蘼᫩헸ῖ"`;
const INGESTION_TIMEOUT = 30000;

describe.only('Ingesting existing data from RING S3C bucket', () => {

    beforeEach(function beforeEachF(done) {
        this.currentTest.ingestionDestBucket =
            `ingestion-dest-bucket-${uuid()}`;
        this.currentTest.keyPrefix =
            `${ingestionSrcBucket}/${uuid()}`;
        this.currentTest.key =
            `${this.currentTest.keyPrefix}/object-to-ingest-${uuid()}`;
        return done();
    });

    afterEach(function afterEach(done) {
        return async.series([
            next => scalityUtils.deleteVersionedBucket(
                this.currentTest.ingestionDestBucket, next),
            next => ringS3CUtils.deleteAllVersions(ingestionSrcBucket,
                this.currentTest.keyPrefix, next),
        ], done);
    });

    it('should ingest an object', function itF(done) {
        return async.series([
            next => ringS3CUtils.putObject(ingestionSrcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.createIngestionBucket(
                this.test.ingestionDestBucket, location, next),
            next => setTimeout(next, 5000),
            next => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                this.test.ingestionDestBucket, this.test.key, next),
        ], done);
    });

    it('should ingest a 0-byte object', function itF(done) {
        return async.series([
            next => ringS3CUtils.putObject(ingestionSrcBucket,
                this.test.key, null, next),
            next => scalityUtils.createIngestionBucket(
                this.test.ingestionDestBucket, location, next),
            next => setTimeout(next, 5000),
            next => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                this.test.ingestionDestBucket, this.test.key, next),
        ], done);
    });

    it.skip('should ingest object tags', function itF(done) {
        return async.series([
            next => ringS3CUtils.putObject(ingestionSrcBucket,
                this.test.key, Buffer.alloc(1), next),
            next => scalityUtils.createIngestionBucket(
                this.test.ingestionDestBucket, location, next),
            next => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                this.test.ingestionDestBucket, this.test.key, next),
            next => scalityUtils.putObjectTagging(ingestionSrcBucket,
                this.test.key, undefined, next),
            // next => scalityUtils.compareObjectTagsRINGS3C(ingestionSrcBucket,
            //     this.test.ingestionDestBucket, this.test.key, undefined,
            //     undefined, next),
        ], done);
    });
});
