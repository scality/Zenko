const assert = require('assert');
const crypto = require('crypto');
const { series } = require('async');

const { scalityS3Client } = require('../../s3SDK');
const sharedBlobSvc = require('../../azureSDK');
const ReplicationUtility = require('../../ReplicationUtility');

const utils = new ReplicationUtility(scalityS3Client, sharedBlobSvc);
const destContainer = process.env.AZURE_BACKBEAT_CONTAINER_NAME;
const destLocation = process.env.AZURE_BACKEND_DESTINATION_LOCATION;
const srcBucket = `source-bucket-${Date.now()}`;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;
const copyKey = `${key}-copy`;
const copySource = `/${srcBucket}/${key}`;
// Blob name with 1024 character Azure blob name limit.
const keyutf8 = `${keyPrefix}/%EA%9D%8B崰㈌㒈保轖䳷䀰⺩ቆ楪秲ⴝ㿅鼎ꓜ퇬枅࿷염곞召㸾⌙ꪊᆐ庍뉆䌗幐鸆䛃➟녩ˍ뙪臅⠙≼绒벊냂詴 끴鹲萯⇂㭢䈊퉉楝舳㷖족痴䧫㾵᏷ำꎆ꼵껪멷㄀誕㳓腜쒃컹㑻鳃삚舿췈孨੦⮀Ǌ곓⵪꺼꜈嗼뫘悕錸瑺⁤⑬১㵀⡸Ҏ礄䧛졼⮦ٞ쫁퓡厈譤擵泶鵇俻縫륒㜓垻ㆩꝿ詀펉ᆙ舑䜾힑藪碙ꀎꂰ췊Ᏻ   㘺幽醛잯ද汧Ꟑꛒⶨ쪸숞헹㭔ꡔᘼ뺓ᡆ᡾ᑟ䅅퀭耓弧⢠⇙폪ް蛧⃪Ἔ돫ꕢ븥ヲ캂䝄쟐颺ᓾ둾Ұ껗礞ᾰ瘹蒯硳풛瞋襎奺熝妒컚쉴⿂㽝㝳駵鈚䄖戭䌸᫲ᇁ䙪鸮ᐴ稫ⶭ뀟ھ⦿䴳稉ꉕ捈袿놾띐✯伤䃫⸧ꠏ瘌틳藔ˋ㫣敀䔩㭘식↴⧵佶痊牌ꪌ搒꾛æᤈべ쉴挜炩⽍舘ꆗ줣겤뒑徭Z䐨 敗羥誜嘳ֶꫜ걵ࣀ묟ኋ拃秷膤䨸菥䟆곘縧멀煣卲챸⧃⏶혣뎧邕⢄⭖陙䣎灏ꗛ僚䌁䠒䲎둘ꪎ傩쿌ᨌ뀻阥눉넠猌ㆯ㰢船戦跏灳蝒礯鞰諾벥煸珬㟑孫鞹Ƭꄹ孙ꢱ钐삺韦帇곎矇૧ਔ뙞밺㊑ک씌촃Ȅ頰ᖅ懚ホῐ꠷㯢먈㝹୥밷㮇䘖桲阥黾噘흳뵿澚㷞꫽鲂♤蔏앜嶃쎘嵥撞㒲 댦坪繤삮憫푇噻琕䖰⒣鯤蕆힀혙狶噕皩溊烻ᓧ鈠ᴥ徰穆ꘛ蹕綻表虣誗릊翿뱩䁞ሑ唫ꇘ苉钽뗑☧≳䟟踬ᶄꎶ愚쒄ꣷ鯍裊鮕漨踒ꠍ픸Ä☶莒浏钸목탬툖氭锰ꌒ⬧䨑렌肣꾯༭炢뤂㉥ˠٸ൪㤌ᶟ訧ᜒೳ揪Ⴛ摖㸣᳑⹞걀ꢢ䏹" 똣왷䉑摴둜辍㫣ზ㥌甦鵗⾃ꗹ빖ꓡ㲑㩝〯蘼᫩헸ῖ"` + // eslint-disable-line
'%EA%9D%8B崰㈌㒈保轖䳷䀰⺩ቆ楪秲ⴝ㿅鼎僷ꈅꓜ퇬枅࿷염곞召㸾⌙ꪊᆐ庍뉆䌗↎舳㷖족幐鸆蹪幐䎺誧洗靁麀厷ℷ쫤ᛩ꺶㖭簹릍铰᫫眘쁽暨鿐魪셑蛃춧㡡竺뫁噛̷ᗰⷑ錜⑔痴䧫㾵᏷ำꎆ꼵껪멷㄀誕㳓腜쒃컹㑻鳃삚舿췈孨੦⮀Ǌ곓⵪꺼꜈嗼뫘悕錸瑺⁤⑬১㵀⡸Ҏ礄䧛졼⮦ٞ쫁퓡厈譤擵泶鵇俻縫륒㜓垻ㆩꝿ詀펉ᆙ舑䜾힑藪碙ꀎꂰ췊Ᏻ   㘺幽醛잯ද汧Ꟑꛒⶨ쪸숞헹㭔ꡔᘼ뺓ᡆ᡾ᑟ䅅퀭耓弧⢠⇙폪ް蛧⃪Ἔ돫ꕢ븥ヲ캂䝄쟐颺ᓾ둾Ұ껗礞ᾰ瘹蒯硳풛瞋襎奺熝妒컚쉴⿂㽝㝳駵鈚䄖戭䌸᫲ᇁ䙪鸮ᐴ稫ⶭ뀟ھ⦿䴳稉ꉕ捈袿놾띐✯伤䃫⸧ꠏ瘌틳藔ˋ㫣敀䔩㭘식↴⧵佶痊牌ꪌ搒꾛æᤈべ쉴挜炩⽍舘ꆗ줣겤뒑徭Z䐨 敗羥誜嘳ֶꫜ걵ࣀ묟ኋ拃秷膤䨸菥䟆곘縧멀煣卲챸⧃⏶혣뎧邕⢄⭖陙䣎灏ꗛ僚䌁䠒䲎둘ꪎ傩쿌ᨌ뀻阥눉넠猌ㆯ㰢船戦跏灳蝒礯鞰諾벥煸珬㟑孫鞹Ƭꄹ孙ꢱ钐삺韦帇곎矇૧ਔ뙞밺㊑ک씌촃Ȅ頰ᖅ懚ホῐ꠷㯢먈㝹୥밷㮇䘖桲阥黾噘흳뵿澚㷞꫽鲂♤蔏앜嶃쎘嵥撞㒲 댦坪繤삮憫푇噻琕䖰虣誗릊翿뱩䁞ሑ唫ꇘ苉钽뗑☧≳䟟踬ᶄꎶ愚쒄ꣷ鯍裊鮕漨踒ꠍ목탬툖氭锰ꌒ⬧䨑렌肣꾯༭炢뤂㉥ˠٸ൪㤌ᶟ訧ᜒೳ揪Ⴛ摖㸣᳑⹞걀ꢢ䏹" 똣왷䉑摴둜辍㫣ზ㥌甦鵗⾃ꗹ빖ꓡ㲑㩝〯蘼᫩헸ῖ"'; // eslint-disable-line
const REPLICATION_TIMEOUT = 300000;

describe('Replication with Azure backend', function f() {
    this.timeout(REPLICATION_TIMEOUT);
    this.retries(3);
    const roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(done => series([
        next => utils.createVersionedBucket(srcBucket, next),
        next => utils.putBucketReplicationMultipleBackend(srcBucket,
            destContainer, roleArn, destLocation, next),
    ], done));

    afterEach(done => series([
        next => utils.deleteAllBlobs(destContainer, `${srcBucket}/${keyPrefix}`,
            next),
        next => utils.deleteVersionedBucket(srcBucket, next),
    ], done));

    it('should replicate an object', done => series([
        next => utils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => utils.compareObjectsAzure(srcBucket, destContainer, key, next),
    ], done));

    it('should replicate a zero byte object', done => series([
        next => utils.putObject(srcBucket, key, undefined, next),
        next => utils.compareObjectsAzure(srcBucket, destContainer, key, next),
    ], done));

    it.skip('should replicate an object with UTF-8 encoding', done => series([
        next => utils.putObject(srcBucket, keyutf8, Buffer.alloc(1), next),
        next => utils.compareObjectsAzure(srcBucket, destContainer, keyutf8,
            next),
    ], done));

    it('should replicate a copied object', done => series([
        next => utils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => utils.copyObject(srcBucket, copySource, copyKey, next),
        next => utils.compareObjectsAzure(srcBucket, destContainer, copyKey,
            next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => utils.waitUntilReplicated(srcBucket, key, undefined, next),
    ], done));

    it('should replicate a MPU object: 2 parts', done => series([
        next => utils.completeMPUAWS(srcBucket, key, 2, next),
        next => utils.compareObjectsAzure(srcBucket, destContainer, key, next),
    ], done));

    it('should replicate a MPU object: 10 parts', done => series([
        next => utils.completeMPUAWS(srcBucket, key, 10, next),
        next => utils.compareObjectsAzure(srcBucket, destContainer, key, next),
    ], done));

    [undefined,
        `0-${1024 * 1024 * 5}`,
        `${1024 * 1024 * 2}-${1024 * 1024 * 7}`].forEach(range =>
        it('should replicate a MPU with parts copied from another MPU with ' +
        `byte range '${range}' for each part`, done => series([
            next => utils.completeMPUAWS(srcBucket, key, 2, next),
            next => utils.completeMPUWithPartCopy(srcBucket, copyKey,
                copySource, range, 2, next),
            next => utils.compareObjectsAzure(srcBucket, destContainer, copyKey,
                next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => utils.waitUntilReplicated(srcBucket, key, undefined, next),
        ], done)));

    it('should delete the destination object when putting a delete marker on ' +
    'the source object', done => series([
        next => utils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => utils.compareObjectsAzure(srcBucket, destContainer, key, next),
        next => utils.deleteObject(srcBucket, key, null, next),
        next => utils.assertNoObject(srcBucket, key, next),
        next => utils.waitUntilDeleted(destContainer, `${srcBucket}/${key}`,
            'azure', next),
        next => utils.getBlobToText(destContainer, `${srcBucket}/${key}`,
            err => {
                assert.strictEqual(err.code, 'BlobNotFound');
                return next();
            }),
    ], done));

    it('should replicate object tags of the latest version', done =>
        series([
            next => utils.putObject(srcBucket, key, Buffer.alloc(1), next),
            next => utils.compareObjectsAzure(srcBucket, destContainer, key,
                next),
            next => utils.putObjectTagging(srcBucket, key, undefined, next),
            next => utils.compareObjectTagsAzure(srcBucket, destContainer, key,
                undefined, next),
        ], done));

    it('should replicate deleting object tags of the latest version',
        done => series([
            next => utils.putObject(srcBucket, key, Buffer.alloc(1), next),
            next => utils.compareObjectsAzure(srcBucket, destContainer, key,
                next),
            next => utils.putObjectTagging(srcBucket, key, undefined, next),
            next => utils.compareObjectTagsAzure(srcBucket, destContainer, key,
                undefined, next),
            next => utils.deleteObjectTagging(srcBucket, key, undefined, next),
            next => utils.compareObjectTagsAzure(srcBucket, destContainer, key,
                undefined, next),
        ], done));

    it('should replicate an object with properties', done => series([
        next => utils.putObjectWithProperties(srcBucket, key, Buffer.alloc(1),
            next),
        next => utils.compareAzureObjectProperties(srcBucket, destContainer,
            key, next),
    ], done));

    it('should replicate a copied object with properties', done => series([
        next => utils.putObjectWithProperties(srcBucket, key, Buffer.alloc(1),
            next),
        next => utils.copyObject(srcBucket, copySource, copyKey, next),
        next => utils.compareAzureObjectProperties(srcBucket, destContainer,
            copyKey, next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => utils.waitUntilReplicated(srcBucket, key, undefined, next),
    ], done));

    it('should replicate a MPU object with properties', done => series([
        next => utils.completeMPUAWSWithProperties(srcBucket, key, 2, next),
        next => utils.compareAzureObjectProperties(srcBucket, destContainer,
            key, next),
    ], done));
});
