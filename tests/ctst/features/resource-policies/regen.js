/**
 * BDD testing require that each scenario is explicitly written in the feature file.
 * However, testing authz scenarios for each API is too extensive, so this code
 * helps maintaining this test suite.
 * When editing the feature files, make sure to re-run this script to ensure that
 * all the tests scenarios are consistent. You can add a new S3 API to test under
 * APIs, and a scenario combination under allCombinations.
 * When applying the script, make sure to have the changes in a separate commit.
 * Usage: node regen.js
 */
import fs from 'fs';

const targetFiles = [
    './AssumeRole.feature',
    './CrossAccountAssumeRole.feature',
    './IAMUser.feature',
];

const APIs = [
    'AbortMultipartUpload',
    'CompleteMultipartUpload',
    'CopyObject',
    // 'CreateBucket',
    'CreateMultipartUpload',
    'DeleteBucket',
    'DeleteBucketCors',
    'DeleteBucketEncryption',
    'DeleteBucketLifecycle',
    'DeleteBucketPolicy',
    'DeleteBucketReplication',
    'DeleteBucketWebsite',
    'DeleteObject',
    'DeleteBucketTagging',
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
    'GetBucketTagging',
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
    'PutBucketTagging',
    'PutObjectTagging',
    'UploadPart',
    'UploadPartCopy',
    // Version-related
    'DeleteObjectVersion',
    'DeleteObjectVersionTagging',
    'GetObjectVersion',
    'GetObjectVersionAcl',
    'GetObjectVersionTagging',
    'PutObjectVersionAcl',
    'PutObjectVersionTagging',
    'PutObjectVersionRetention',
    'PutObjectVersionLegalHold',
    // Scality-specific
    'MetadataSearch',
];

const scenarios = [];

// In order, sets the current configuration for:
// bucketPolicyExists, bucketPolicyApplies, bucketPolicyEffect,
// iamPolicyExists, iamPolicyApplies, iamPolicyEffect
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

const longest = {
    action: 'action'.length,
    bucketPolicyExists: 'bucketPolicyExists'.length,
    bucketPolicyApplies: 'bucketPolicyApplies'.length,
    bucketPolicyEffect: 'bucketPolicyEffect'.length,
    iamPolicyExists: 'iamPolicyExists'.length,
    iamPolicyApplies: 'iamPolicyApplies'.length,
    iamPolicyEffect: 'iamPolicyEffect'.length,
};

for (const api of APIs) {
    for (const combination of allCombinations) {
        const scenario = {
            action: api,
            bucketPolicyExists: combination[0],
            bucketPolicyApplies: combination[1],
            bucketPolicyEffect: combination[2],
            iamPolicyExists: combination[3],
            iamPolicyApplies: combination[4],
            iamPolicyEffect: combination[5],
        };
        scenarios.push(scenario);
        for (const key in scenario) {
            if (scenario[key].length > longest[key] || !longest[key]) {
                longest[key] = scenario[key].length;
            }
        }
    }
}

const output = scenarios.map(scenario => {
    const paddedAction = scenario.action.padEnd(longest.action);
    const paddedIamPolicyExists = scenario.iamPolicyExists.padEnd(longest.iamPolicyExists);
    const paddedIamPolicyApplies = scenario.iamPolicyApplies.padEnd(longest.iamPolicyApplies);
    const paddedIamPolicyEffect = scenario.iamPolicyEffect.padEnd(longest.iamPolicyEffect);
    const paddedBucketPolicyExists = scenario.bucketPolicyExists.padEnd(longest.bucketPolicyExists);
    const paddedBucketPolicyApplies = scenario.bucketPolicyApplies.padEnd(longest.bucketPolicyApplies);
    const paddedBucketPolicyEffect = scenario.bucketPolicyEffect.padEnd(longest.bucketPolicyEffect);

    // eslint-disable-next-line max-len
    return `            | ${paddedAction} | ${paddedBucketPolicyExists} | ${paddedBucketPolicyApplies} | ${paddedBucketPolicyEffect} | ${paddedIamPolicyExists} | ${paddedIamPolicyApplies} | ${paddedIamPolicyEffect} |`;
}).join('\n');

targetFiles.forEach(file => {
    const filePath = `${__dirname}/${file}`;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const startIndex = fileContent.indexOf('Everything below is generated');
    const startIndexNextLine = fileContent.indexOf('\n', startIndex);
    const endIndex = fileContent.length;
    
    if (startIndex !== -1 && endIndex !== -1) {
        const newContent =
            `${fileContent.substring(0, startIndexNextLine)  }\n${  output  }\n${  fileContent.substring(endIndex)}`;
        fs.writeFileSync(filePath, newContent, 'utf-8');
        // eslint-disable-next-line no-console
        console.log(`Content in ${file} replaced.`);
    } else {
        // eslint-disable-next-line no-console
        console.error(
            `Couldn't find the specified markers in ${file}. Make sure the file contains the markers as specified.`);
    }
});
