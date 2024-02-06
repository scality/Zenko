type ActionPermissionsType = {
    action: string;
    permissions: string[];
    subAuthorizationChecks?: boolean;
    expectedResultOnAllowTest?: string;
    excludePermissionOnBucketObjects?: boolean,
};

const needObjectLock = [
    'PutObjectLegalHold',
    'PutObjectRetention',
    'GetObjectLegalHold',
    'GetObjectRetention',
];

const needObject = [
    'PutObjectLegalHold',
    'PutObjectRetention',
    'PutObjectTagging',
    'PutObjectAcl',
    'GetObject',
    'GetObjectAcl',
    'GetObjectLegalHold',
    'GetObjectRetention',
    'GetObjectTagging',
    'DeleteObject',
    'DeleteObjectTagging',
    'DeleteObjects',
    'HeadObject',
];

const needVersioning = [
    'PutBucketReplication',
];

const actionPermissions: ActionPermissionsType[] = [
    {
        action: 'CreateBucket',
        permissions: ['s3:CreateBucket'],
    },
    {
        action: 'PutBucketAcl',
        permissions: ['s3:PutBucketAcl'],
        expectedResultOnAllowTest: 'AccessControlListNotSupported',
    },
    {
        action: 'PutBucketEncryption',
        permissions: ['s3:PutEncryptionConfiguration'],
    },
    {
        action: 'PutBucketLifecycleConfiguration',
        permissions: ['s3:PutLifecycleConfiguration'],
        expectedResultOnAllowTest: 'MalformedXML',
    },
    {
        action: 'PutBucketNotificationConfiguration',
        permissions: ['s3:PutBucketNotification'],
        expectedResultOnAllowTest: 'InvalidArgument',
    },
    {
        action: 'PutBucketPolicy',
        permissions: ['s3:PutBucketPolicy'],
    },
    {
        action: 'PutBucketReplication',
        permissions: ['s3:PutReplicationConfiguration'],
        expectedResultOnAllowTest: 'Destination bucket must exist',
    },
    // initial permission passes, but then fails on destination bucket 
    {
        action: 'PutBucketVersioning',
        permissions: ['s3:PutBucketVersioning'],
    },
    {
        action: 'PutObjectLockConfiguration',
        permissions: ['s3:PutBucketObjectLockConfiguration'],
        expectedResultOnAllowTest: 'InvalidBucketState',
    },
    {
        action: 'PutObject',
        permissions: ['s3:PutObject'],
    },
    {
        action: 'PutObjectLegalHold',
        permissions: ['s3:PutObjectLegalHold'],
    },
    {
        action: 'PutObjectRetention',
        permissions: ['s3:PutObjectRetention'],
    },
    {
        action: 'PutObjectTagging',
        permissions: ['s3:PutObjectTagging'],
    },
    {
        action: 'PutObjectAcl',
        permissions: ['s3:PutObjectAcl'],
        expectedResultOnAllowTest: 'AccessControlListNotSupported',
    },
    {
        action: 'PutBucketCors',
        permissions: ['s3:PutBucketCORS'],
    },
    {
        action: 'PutBucketWebsite',
        permissions: ['s3:PutBucketWebsite'],
    },
    {
        action: 'GetBucketCors',
        permissions: ['s3:GetBucketCORS'],
        expectedResultOnAllowTest: 'NoSuchCORSConfiguration',
    },
    {
        action: 'GetBucketWebsite',
        permissions: ['s3:GetBucketWebsite'],
        expectedResultOnAllowTest: 'NoSuchWebsiteConfiguration',
    },
    {
        action: 'GetBucketAcl',
        permissions: ['s3:GetBucketAcl'],
    },
    {
        action: 'GetBucketEncryption',
        permissions: ['s3:GetEncryptionConfiguration'],
    },
    {
        action: 'GetBucketLifecycleConfiguration',
        permissions: ['s3:GetLifecycleConfiguration'],
        expectedResultOnAllowTest: 'NoSuchLifecycleConfiguration',
    },
    {
        action: 'GetBucketLocation',
        permissions: ['s3:GetBucketLocation'],
    },
    {
        action: 'GetBucketNotificationConfiguration',
        permissions: ['s3:GetBucketNotification'],
    },
    {
        action: 'GetObjectVersions',
        permissions: ['s3:ListBucketVersions'],
    },
    {
        action: 'GetBucketPolicy',
        permissions: ['s3:GetBucketPolicy'],
        expectedResultOnAllowTest: 'NoSuchBucketPolicy',
    },
    {
        action: 'GetBucketReplication',
        permissions: ['s3:GetReplicationConfiguration'],
        expectedResultOnAllowTest: 'ReplicationConfigurationNotFoundError',
    },
    {
        action: 'GetBucketVersioning',
        permissions: ['s3:GetBucketVersioning'],
    },
    {
        action: 'GetObjectLockConfiguration',
        permissions: ['s3:GetBucketObjectLockConfiguration'],
        expectedResultOnAllowTest: 'ObjectLockConfigurationNotFoundError',
    },
    {
        action: 'GetObject',
        permissions: ['s3:GetObject'],
    },
    {
        action: 'GetObjectAcl',
        permissions: ['s3:GetObjectAcl'],
    },
    {
        action: 'GetObjectLegalHold',
        permissions: ['s3:GetObjectLegalHold'],
        expectedResultOnAllowTest: 'NoSuchObjectLockConfiguration',
    },
    {
        action: 'GetObjectRetention',
        permissions: ['s3:GetObjectRetention'],
        expectedResultOnAllowTest: 'NoSuchObjectLockConfiguration',
    },
    {
        action: 'GetObjectTagging',
        permissions: ['s3:GetObjectTagging'],
    },
    {
        action: 'DeleteBucketCors',
        permissions: ['s3:PutBucketCORS'],
    },
    {
        action: 'DeleteBucketWebsite',
        permissions: ['s3:DeleteBucketWebsite'],
    },
    {
        action: 'DeleteBucket',
        permissions: ['s3:DeleteBucket'],
    },
    {
        action: 'DeleteBucketEncryption',
        permissions: ['s3:PutEncryptionConfiguration'],
    },
    {
        action: 'DeleteBucketLifecycle',
        permissions: ['s3:PutLifecycleConfiguration'],
    },
    {
        action: 'DeleteBucketPolicy',
        permissions: ['s3:DeleteBucketPolicy'],
    },
    {
        action: 'DeleteBucketReplication',
        permissions: ['s3:PutReplicationConfiguration'],
    },
    {
        action: 'DeleteObject',
        permissions: ['s3:DeleteObject'],
    },
    {
        action: 'DeleteObjectTagging',
        permissions: ['s3:DeleteObjectTagging'],
    },
    {
        action: 'DeleteObjects',
        permissions: ['s3:DeleteObjects'],
    },
    {
        action: 'DeleteObjects',
        permissions: ['s3:DeleteObject'],
        subAuthorizationChecks: true,
        expectedResultOnAllowTest: 'NoSuchKey',
    },
    {
        action: 'ListObjects',
        permissions: ['s3:ListBucket'],
    },
    {
        action: 'ListObjectsV2',
        permissions: ['s3:ListBucket'],
    },
    {
        action: 'HeadBucket',
        permissions: ['s3:ListBucket'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'CreateMultipartUpload',
        permissions: ['s3:PutObject'],
    },
    {
        action: 'UploadPart',
        permissions: ['s3:PutObject'],
    },
    {
        action: 'CopyObject',
        permissions: ['s3:GetObject',
            's3:PutObject'],
    },
    {
        action: 'HeadObject',
        permissions: ['s3:GetObject'],
    },
    {
        action: 'ListMultipartUploads',
        permissions: ['s3:ListBucketMultipartUploads'],
    },
    {
        action: 'AbortMultipartUpload',
        permissions: ['s3:AbortMultipartUpload'],
    },
    {
        action: 'CompleteMultipartUpload',
        permissions: ['s3:PutObject'],
        expectedResultOnAllowTest: 'InvalidPart',
    },
    {
        action: 'ListObjectVersions',
        permissions: ['s3:ListBucketVersions'],
    },
    {
        action: 'MetadataSearch',
        permissions: ['s3:MetadataSearch'],
    },
];

export {
    ActionPermissionsType,
    needObjectLock,
    needObject,
    needVersioning,
    actionPermissions,
};
