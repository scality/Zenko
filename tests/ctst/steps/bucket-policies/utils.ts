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
    'GetObjectLegalHold',
    'PutObjectLegalHold',
    'GetObjectRetention',
    'PutObjectRetention',
    'PutObjectVersionLegalHold',
    'PutObjectVersionRetention',
    'GetObjectVersionLegalHold',
    'GetObjectVersionRetention',
];

const needObject = [
    'CopyObject',
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
    'RestoreObject',
];

const needVersioning = [
    'PutBucketReplication',
    'ListObjectVersions',
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
        needsSetup: true,
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
        needsSetup: true,
    },
    {
        action: 'GetObjectRetention',
        permissions: ['s3:GetObjectRetention'],
        needsSetup: true,
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
        action: 'ListObjectsVersions',
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
        needsSetup: true,
    },
    {
        action: 'UploadPart',
        permissions: ['s3:PutObject'],
        needsSetup: true,
    },
    {
        action: 'UploadPartCopy',
        permissions: ['s3:PutObject', 's3:GetObject'],
        needsSetup: true,
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
        expectedResultOnAllowTest: 'MalformedXML',
        needsSetup: true,
    },
    {
        action: 'ListObjectVersions',
        permissions: ['s3:ListBucketVersions', 's3:ListBucket'],
        excludePermissionOnBucketObjects: true,
    },
    {
        action: 'RestoreObject',
        permissions: ['s3:RestoreObject'],
        expectedResultOnAllowTest: 'InvalidObjectState',
    },
    {
        action: 'MetadataSearch',
        permissions: ['s3:MetadataSearch'],
        excludePermissionOnBucketObjects: true,
    },
    // Version APIs
    {
        action: 'DeleteObjectVersion',
        permissions: ['s3:DeleteObject', 's3:DeleteObjectVersion'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'DeleteObjectVersionTagging',
        permissions: ['s3:DeleteObjectTagging', 's3:DeleteObjectVersionTagging'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'GetObjectVersion',
        permissions: ['s3:GetObject', 's3:GetObjectVersion'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'GetObjectVersionAcl',
        permissions: ['s3:GetObjectAcl', 's3:GetObjectVersionAcl'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'GetObjectVersionTagging',
        permissions: ['s3:GetObjectTagging', 's3:GetObjectVersionTagging'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionAcl',
        permissions: ['s3:PutObjectAcl', 's3:PutObjectVersionAcl'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionTagging',
        permissions: ['s3:PutObjectTagging', 's3:PutObjectVersionTagging'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionRetention',
        permissions: ['s3:PutObjectRetention', 's3:PutObjectVersionRetention'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
    {
        action: 'PutObjectVersionLegalHold',
        permissions: ['s3:PutObjectLegalHold', 's3:PutObjectVersionLegalHold'],
        expectedResultOnAllowTest: 'NoSuchVersion',
    },
];

const preCreatedPolicies = {
    fullAccess: {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow',
                Principal: {
                    AWS: [
                        'arn:aws:iam::id:root',
                    ],
                },
                Action: [
                    's3:ListBucket',
                    's3:GetBucketLocation',
                ],
                Resource: [
                    'arn:aws:s3:::name',
                ],
            },
            {
                Effect: 'Allow',
                Principal: {
                    AWS: [
                        'arn:aws:iam::id:root',
                    ],
                },
                Action: [
                    's3:*',
                ],
                Resource: [
                    'arn:aws:s3:::name/*',
                ],
            },
        ],
    },
};

const writeOperationsOnABucket = [
    'DeleteBucket',
    'DeleteBucketCors',
    'DeleteBucketEncryption',
    'DeleteBucketLifecycle',
    'DeleteBucketPolicy',
    'DeleteBucketReplication',
    'DeleteBucketTagging',
    'DeleteBucketWebsite',
    'GetBucketAcl',
    'GetBucketCors',
    'GetBucketEncryption',
    'GetBucketLifecycleConfiguration',
    'GetBucketNotificationConfiguration',
    'GetBucketPolicy',
    'GetBucketReplication',
    'GetBucketTagging',
    'GetBucketVersioning',
    'GetObjectLockConfiguration',
    'GetBucketTagging',
    'ListMultipartUploads',
    'PutBucketAcl',
    'PutBucketCors',
    'PutBucketEncryption',
    'PutBucketLifecycleConfiguration',
    'PutBucketNotificationConfiguration',
    'PutBucketPolicy',
    'PutBucketReplication',
    'PutBucketTagging',
    'PutBucketVersioning',
    'PutObjectLockConfiguration',
    'PutBucketPolicy',
    'MetadataSearch',
];

export {
    ActionPermissionsType,
    needObjectLock,
    needObject,
    needVersioning,
    actionPermissions,
    preCreatedPolicies,
    writeOperationsOnABucket,
};
