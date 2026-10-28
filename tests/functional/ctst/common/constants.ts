export default {
    complianceRetention: 'COMPLIANCE',
    governanceRetention: 'GOVERNANCE',
    DEFAULT_SUBDOMAIN: 'my-company.com',
    DEFAULT_TIMEOUT: 100000,
    ACCOUNT_NAME: 'AccountTest',
    INTERNAL_SERVICES_ACCOUNT_ID: '000000000000',
    USER_NAME_TEST: 'userNameForTest',
    POLICY_NAME_TEST: 'policyNameForTest',
    ROLE_NAME_TEST: 'roleNameForTest',
    BUCKET_NAME_TEST: 'bucketForTest',
    K_CLIENT: 'zenko-ui',
    MAX_ACCOUNT_CHECK_RETRIES: 100,
    // Must match the file name cli-testing's S3.getObject writes downloaded objects to
    OUTFILE_NAME: 'out.loc',
    assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow',
                Action: ['iam:ListRoles', 'sts:AssumeRole'],
                Resource: '*',
            },
        ],
    }),
    assumeRoleTrustPolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: {
            Effect: 'Allow',
            Principal: '*',
            Action: 'sts:AssumeRole',
        },
    }),
    // Exposed by cloudserver as x-amz-meta-* headers, hence found in the Metadata of HeadObject
    transitionInProgressMD: 'scal-s3-transition-in-progress',
    transitionAttemptMD: 'scal-s3-transition-attempt',
};
