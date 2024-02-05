/**
 * BDD testing require that each scenario is explicitly written in the feature file.
 * However, testing authz scenarios for each API is too extensive, so this code
 * helps maintaining this test suite.
 */

const APIs = [
    'AbortMultipartUpload',
    'CompleteMultipartUpload',
    'CopyObject',
    'CreateBucket',
    'CreateMultipartUpload',
    'DeleteBucket',
    'DeleteBucketCors',
    'DeleteBucketEncryption',
    'DeleteBucketLifecycle',
    'DeleteBucketPolicy',
    'DeleteBucketReplication',
    'DeleteBucketWebsite',
    'DeleteObject',
    'DeleteObjectTagging',
    'DeleteObjects',
    'GetBucketAcl',
    'GetBucketCors',
    'GetBucketEncryption',
    'GetBucketLifecycleConfiguration',
    'GetBucketNotificationConfiguration',
    'GetBucketPolicy',
    'GetBucketReplication',
    'GetBucketVersioning',
    'GetObject',
    'GetObjectAcl',
    'GetObjectLegalHold',
    'GetObjectLockConfiguration',
    'GetObjectRetention',
    'GetObjectTagging',
    'HeadBucket',
    'HeadObject',
    'ListMultipartUploads',
    'ListObjectVersions',
    'ListObjects',
    'ListObjectsV2',
    'PutBucketAcl',
    'PutBucketCors',
    'PutBucketEncryption',
    'PutBucketLifecycleConfiguration',
    'PutBucketNotificationConfiguration',
    'PutBucketPolicy',
    'PutBucketReplication',
    'PutBucketVersioning',
    'PutObject',
    'PutObjectAcl',
    'PutObjectLegalHold',
    'PutObjectLockConfiguration',
    'PutObjectRetention',
    'PutObjectTagging',
    'UploadPart',
    'MetadataSearch',
];

const scenarios = [];

const allCombinations = [
    ['existing', 'applies', 'ALLOW', 'existing', 'applies', 'ALLOW'],
    ['existing', 'applies', 'ALLOW', 'existing', 'applies', 'DENY'],
    ['existing', 'applies', 'ALLOW', 'existing', 'applies', 'ALLOW+DENY'],
    ['existing', 'applies', 'ALLOW', 'existing', 'does not apply', 'ALLOW'],
    ['existing', 'applies', 'ALLOW', 'non-existing', '', ''],
    ['existing', 'applies', 'DENY', 'existing', 'applies', 'ALLOW'],
    ['existing', 'applies', 'DENY', 'existing', 'applies', 'DENY'],
    ['existing', 'applies', 'DENY', 'existing', 'applies', 'ALLOW+DENY'],
    ['existing', 'applies', 'DENY', 'existing', 'does not apply', 'ALLOW'],
    ['existing', 'applies', 'DENY', 'non-existing', '', ''],
    ['existing', 'does not apply', 'ALLOW', 'existing', 'applies', 'ALLOW'],
    ['existing', 'does not apply', 'ALLOW', 'existing', 'applies', 'DENY'],
    ['existing', 'does not apply', 'ALLOW', 'existing', 'applies', 'ALLOW+DENY'],
    ['existing', 'does not apply', 'ALLOW', 'existing', 'does not apply', 'ALLOW'],
    ['existing', 'does not apply', 'ALLOW', 'non-existing', '', ''],
    ['non-existing', '', '', 'existing', 'applies', 'ALLOW'],
    ['non-existing', '', '', 'existing', 'applies', 'DENY'],
    ['non-existing', '', '', 'existing', 'applies', 'ALLOW+DENY'],
    ['non-existing', '', '', 'existing', 'does not apply', 'ALLOW'],
    ['non-existing', '', '', 'non-existing', '', ''],
];

for (const api of APIs) {
    for (const combination of allCombinations) {
        const scenario = {
            action: api,
            iamPolicyExists: combination[0],
            iamPolicyApplies: combination[1],
            iamPolicyEffect: combination[2],
            bucketPolicyExists: combination[3],
            bucketPolicyApplies: combination[4],
            bucketPolicyEffect: combination[5],
        };
        scenarios.push(scenario);
    }
}
const output = scenarios.map(scenario => {
    return `| ${scenario.action} | ${scenario.iamPolicyExists} | ${scenario.iamPolicyApplies} | ${scenario.iamPolicyEffect} | ${scenario.bucketPolicyExists} | ${scenario.bucketPolicyApplies} | ${scenario.bucketPolicyEffect} |`;
}).join('\n');
