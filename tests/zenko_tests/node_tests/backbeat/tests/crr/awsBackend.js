const crypto = require('crypto');
const { series } = require('async');

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

describe('Replication with AWS backend', function () {
    // eslint-disable-next-line
    this.timeout(REPLICATION_TIMEOUT);
    this.retries(3);
    const roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(done => series([
        next => scalityUtils.createVersionedBucket(srcBucket, next),
        next => scalityUtils.putBucketReplication(
            srcBucket,
            destBucket,
            roleArn,
            destLocation,
            next,
        ),
    ], done));

    afterEach(done => series([
        next => scalityUtils.deleteVersionedBucket(srcBucket, next),
        // Destination location has falsy bucket match property, so we update
        // the key prefix.
        next => awsUtils.deleteAllVersions(
            destBucket,
            `${srcBucket}/${keyPrefix}`,
            next,
        ),
    ], done));

    it('should replicate an object', done => series([
        next => {
            // eslint-disable-next-line no-console
            console.log(`[TEST] Putting object ${key} in bucket ${srcBucket}`);
            scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next);
        },
        next => {
            // eslint-disable-next-line no-console
            console.log(`[TEST] Comparing object ${key} in bucket ${destBucket}`);
            scalityUtils.compareObjectsAWS(
                srcBucket,
                destBucket,
                key,
                undefined,
                next,
            );
        },
    ], done));
});
