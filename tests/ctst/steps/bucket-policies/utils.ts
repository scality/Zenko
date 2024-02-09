type ActionPermissionsType = {
    action: string;
    permissions: string[];
    subAuthorizationChecks?: boolean;
    expectedResultOnAllowTest?: string;
    excludePermissionOnBucketObjects?: boolean,
    excludePermissionsOnBucket?: boolean,
    useWildCardBucketName?: boolean,
    needsSetup?: boolean,
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
    'PutObject',
    'GetObject',
    'GetObjectAcl',
    'GetObjectLegalHold',
    'GetObjectRetention',
    'GetObjectTagging',
    'DeleteObject',
    'DeleteObjectTagging',
    'DeleteObjects',
    'HeadObject',
    'UploadPart',
    'UploadPartCopy',
    'DeleteObjectVersion',
    'DeleteObjectVersionTagging',
    'GetObjectVersion',
    'GetObjectVersionAcl',
    'GetObjectVersionTagging',
    'PutObjectVersionAcl',
    'PutObjectVersionTagging',
    'PutObjectVersionRetention',
    'PutObjectVersionLegalHold',
];

const needVersioning = [
    'PutBucketReplication',
    'ListObjectVersions',
];

const actionPermissions: ActionPermissionsType[] = [
    // Create bucket is not checking any bucket policy
    // {
    //     action: 'CreateBucket',
    //     permissions: ['s3:CreateBucket'],
    //     expectedResultOnAllowTest: 'BucketAlreadyOwnedByYou',
    //     excludePermissionOnBucketObjects: true,
    //     useWildCardBucketName: true,
    // },
    {
        action: 'PutBucketAcl',
        permissions: ['s3:PutBucketAcl'],
        expectedResultOnAllowTest: 'MalformedXML',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketEncryption',
        permissions: ['s3:PutEncryptionConfiguration'],
        expectedResultOnAllowTest: 'MalformedXML',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketLifecycleConfiguration',
        permissions: ['s3:PutLifecycleConfiguration'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketNotificationConfiguration',
        permissions: ['s3:PutBucketNotification'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketPolicy',
        permissions: ['s3:PutBucketPolicy'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketReplication',
        permissions: ['s3:PutReplicationConfiguration'],
        expectedResultOnAllowTest: 'InvalidRequest: Versioning must be \'Enabled\'',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketVersioning',
        permissions: ['s3:PutBucketVersioning'],
        excludePermissionOnBucketObjects: true,
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
        expectedResultOnAllowTest: 'MalformedXML',
    },
    {
        action: 'PutObjectRetention',
        permissions: ['s3:PutObjectRetention', 's3:BypassGovernanceRetention'],
    },
    {
        action: 'PutObjectTagging',
        permissions: ['s3:PutObjectTagging'],
    },
    {
        action: 'PutObjectAcl',
        permissions: ['s3:PutObjectAcl'],
    },
    {
        action: 'PutBucketCors',
        permissions: ['s3:PutBucketCORS'],
        expectedResultOnAllowTest: 'MissingRequestBodyError',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketTagging',
        permissions: ['s3:PutBucketTagging'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'PutBucketWebsite',
        permissions: ['s3:PutBucketWebsite'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketCors',
        permissions: ['s3:GetBucketCORS'],
        expectedResultOnAllowTest: 'NoSuchCORSConfiguration',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketTagging',
        permissions: ['s3:GetBucketTagging'],
        expectedResultOnAllowTest: 'NoSuchTagSet',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketWebsite',
        permissions: ['s3:GetBucketWebsite'],
        expectedResultOnAllowTest: 'NoSuchWebsiteConfiguration',
    },
    {
        action: 'GetBucketAcl',
        permissions: ['s3:GetBucketAcl'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketEncryption',
        permissions: ['s3:GetEncryptionConfiguration'],
        expectedResultOnAllowTest: 'ServerSideEncryptionConfigurationNotFoundError',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketLifecycleConfiguration',
        permissions: ['s3:GetLifecycleConfiguration'],
        expectedResultOnAllowTest: 'NoSuchLifecycleConfiguration',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketLocation',
        permissions: ['s3:GetBucketLocation'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketNotificationConfiguration',
        permissions: ['s3:GetBucketNotification'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetObjectVersions',
        permissions: ['s3:ListBucketVersions'],
    },
    {
        action: 'GetBucketPolicy',
        permissions: ['s3:GetBucketPolicy'],
        expectedResultOnAllowTest: 'NoSuchBucketPolicy',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketReplication',
        permissions: ['s3:GetReplicationConfiguration'],
        expectedResultOnAllowTest: 'ReplicationConfigurationNotFoundError',
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'GetBucketVersioning',
        permissions: ['s3:GetBucketVersioning'],
        excludePermissionOnBucketObjects: true,
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
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'DeleteBucketTagging',
        permissions: ['s3:PutBucketTagging'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'DeleteBucketWebsite',
        permissions: ['s3:DeleteBucketWebsite'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'DeleteBucket',
        permissions: ['s3:DeleteBucket'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'DeleteBucketEncryption',
        permissions: ['s3:PutEncryptionConfiguration'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'DeleteBucketLifecycle',
        permissions: ['s3:PutLifecycleConfiguration'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'DeleteBucketPolicy',
        permissions: ['s3:DeleteBucketPolicy'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'DeleteBucketReplication',
        permissions: ['s3:PutReplicationConfiguration'],
        excludePermissionOnBucketObjects: true,
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
        permissions: ['s3:DeleteObject'],
        subAuthorizationChecks: true,
        expectedResultOnAllowTest: 'NoSuchKey',
    },
    {
        action: 'ListObjects',
        permissions: ['s3:ListBucket'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'ListObjectsV2',
        permissions: ['s3:ListBucket'],
        excludePermissionOnBucketObjects: true,
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
        expectedResultOnAllowTest: 'NoSuchUpload',
    },
    {
        action: 'UploadPartCopy',
        permissions: ['s3:PutObject'],
    },
    {
        action: 'CopyObject',
        permissions: ['s3:GetObject', 's3:PutObject'],
        expectedResultOnAllowTest: 'NoSuchKey',
    },
    {
        action: 'HeadObject',
        permissions: ['s3:GetObject'],
    },
    {
        action: 'ListMultipartUploads',
        permissions: ['s3:ListBucketMultipartUploads'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'AbortMultipartUpload',
        permissions: ['s3:AbortMultipartUpload'],
        needsSetup: true,
    },
    {
        action: 'CompleteMultipartUpload',
        permissions: ['s3:PutObject'],
        expectedResultOnAllowTest: 'NoSuchUpload',
        needsSetup: true,
    },
    {
        action: 'ListObjectVersions',
        permissions: ['s3:ListBucketVersions'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'MetadataSearch',
        permissions: ['s3:MetadataSearch'],
    },
    // Version APIs
    {
        action: 'DeleteObjectVersion',
        permissions: ['s3:DeleteObjectVersion'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'DeleteObjectVersionTagging',
        permissions: ['s3:DeleteObjectVersionTagging'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'GetObjectVersion',
        permissions: ['s3:GetObjectVersion'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'GetObjectVersionAcl',
        permissions: ['s3:GetObjectVersionAcl'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'GetObjectVersionTagging',
        permissions: ['s3:GetObjectVersionTagging'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionAcl',
        permissions: ['s3:PutObjectVersionAcl'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionTagging',
        permissions: ['s3:PutObjectVersionTagging'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionRetention',
        permissions: ['s3:PutObjectVersionRetention'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionLegalHold',
        permissions: ['s3:PutObjectVersionLegalHold'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
];

export {
    ActionPermissionsType,
    needObjectLock,
    needObject,
    needVersioning,
    actionPermissions,
};
