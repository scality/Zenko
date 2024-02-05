type ActionPermissionsType = ({
    action: string;
    permissions: string[];
    implicitPermissions: string[];
    expectedResultOnAllowTest?: undefined;
} | {
    action: string;
    permissions: string[];
    implicitPermissions: string[];
    expectedResultOnAllowTest: string;
});

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
    'PutBucketReplication'
];

const actionPermissions: ActionPermissionsType[] = [
    {
        action: 'CreateBucket',
        permissions: ['s3:CreateBucket'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutBucketAcl',
        permissions: ['s3:PutBucketAcl'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'AccessControlListNotSupported',
    },
    {
        action: 'PutBucketEncryption',
        permissions: ['s3:PutEncryptionConfiguration'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutBucketLifecycleConfiguration',
        permissions: ['s3:PutLifecycleConfiguration'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'MalformedXML',
    },
    {
        action: 'PutBucketNotificationConfiguration',
        permissions: ['s3:PutBucketNotification'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'InvalidArgument',
    },
    {
        action: 'PutBucketPolicy',
        permissions: ['s3:PutBucketPolicy'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutBucketReplication',
        permissions: ['s3:PutReplicationConfiguration'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'Destination bucket must exist',
    },
    // initial permission passes, but then fails on destination bucket 
    {
        action: 'PutBucketVersioning',
        permissions: ['s3:PutBucketVersioning'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutObjectLockConfiguration',
        permissions: ['s3:PutBucketObjectLockConfiguration'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'InvalidBucketState',
    },
    {
        action: 'PutObject',
        permissions: ['s3:PutObject'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutObjectLegalHold',
        permissions: ['s3:PutObjectLegalHold'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutObjectRetention',
        permissions: ['s3:PutObjectRetention'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutObjectTagging',
        permissions: ['s3:PutObjectTagging'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutObjectAcl',
        permissions: ['s3:PutObjectAcl'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'AccessControlListNotSupported',
    },
    {
        action: 'PutBucketCors',
        permissions: ['s3:PutBucketCORS'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'PutBucketWebsite',
        permissions: ['s3:PutBucketWebsite'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetBucketCors',
        permissions: ['s3:GetBucketCORS'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'NoSuchCORSConfiguration',
    },
    {
        action: 'GetBucketWebsite',
        permissions: ['s3:GetBucketWebsite'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'NoSuchWebsiteConfiguration',
    },
    {
        action: 'GetBucketAcl',
        permissions: ['s3:GetBucketAcl'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetBucketEncryption',
        permissions: ['s3:GetEncryptionConfiguration'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetBucketLifecycleConfiguration',
        permissions: ['s3:GetLifecycleConfiguration'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'NoSuchLifecycleConfiguration',
    },
    {
        action: 'GetBucketLocation',
        permissions: ['s3:GetBucketLocation'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetBucketNotificationConfiguration',
        permissions: ['s3:GetBucketNotification'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetObjectVersions',
        permissions: ['s3:ListBucketVersions'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetBucketPolicy',
        permissions: ['s3:GetBucketPolicy'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'NoSuchBucketPolicy',
    },
    {
        action: 'GetBucketReplication',
        permissions: ['s3:GetReplicationConfiguration'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'ReplicationConfigurationNotFoundError',
    },
    {
        action: 'GetBucketVersioning',
        permissions: ['s3:GetBucketVersioning'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetObjectLockConfiguration',
        permissions: ['s3:GetBucketObjectLockConfiguration'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'ObjectLockConfigurationNotFoundError',
    },
    {
        action: 'GetObject',
        permissions: ['s3:GetObject'],
        implicitPermissions: ['s3:GetObjectAcl'],
    },
    {
        action: 'GetObjectAcl',
        permissions: ['s3:GetObjectAcl'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'GetObjectLegalHold',
        permissions: ['s3:GetObjectLegalHold'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'NoSuchObjectLockConfiguration',
    },
    {
        action: 'GetObjectRetention',
        permissions: ['s3:GetObjectRetention'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'NoSuchObjectLockConfiguration',
    },
    {
        action: 'GetObjectTagging',
        permissions: ['s3:GetObjectTagging'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteBucketCors',
        permissions: ['s3:PutBucketCORS'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteBucketWebsite',
        permissions: ['s3:DeleteBucketWebsite'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteBucket',
        permissions: ['s3:DeleteBucket'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteBucketEncryption',
        permissions: ['s3:PutEncryptionConfiguration'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteBucketLifecycle',
        permissions: ['s3:PutLifecycleConfiguration'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteBucketPolicy',
        permissions: ['s3:DeleteBucketPolicy'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteBucketReplication',
        permissions: ['s3:PutReplicationConfiguration'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteObject',
        permissions: ['s3:DeleteObject'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteObjectTagging',
        permissions: ['s3:DeleteObjectTagging'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'DeleteObjects',
        permissions: ['s3:DeleteObject'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'ListObjects',
        permissions: ['s3:ListBucket'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'ListObjectsV2',
        permissions: ['s3:ListBucket'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'HeadBucket',
        permissions: ['s3:ListBucket'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'CreateMultipartUpload',
        permissions: ['s3:PutObject'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'UploadPart',
        permissions: ['s3:PutObject'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'CopyObject',
        permissions: ['s3:GetObject',
            's3:PutObject'],
        implicitPermissions: ['s3:GetObjectAcl'],
    },
    {
        action: 'HeadObject',
        permissions: ['s3:GetObject'],
        implicitPermissions: ['s3:GetObjectAcl'],
    },
    {
        action: 'ListMultipartUploads',
        permissions: ['s3:ListBucketMultipartUploads'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'AbortMultipartUpload',
        permissions: ['s3:AbortMultipartUpload'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'CompleteMultipartUpload',
        permissions: ['s3:PutObject'],
        implicitPermissions: ['s3:GetObject'],
        expectedResultOnAllowTest: 'InvalidPart',
    },
    {
        action: 'ListObjectVersions',
        permissions: ['s3:ListBucketVersions'],
        implicitPermissions: ['s3:GetObject'],
    },
    {
        action: 'MetadataSearch',
        permissions: ['s3:MetadataSearch'],
        implicitPermissions: ['s3:GetObject'],
    },
];

export {
    ActionPermissionsType,
    needObjectLock,
    needObject,
    needVersioning,
    actionPermissions,
};
