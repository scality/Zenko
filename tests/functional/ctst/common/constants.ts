export default {
    complianceRetention: 'COMPLIANCE',
    governanceRetention: 'GOVERNANCE',
    // Exposed by cloudserver as x-amz-meta-* headers, hence found in the Metadata of HeadObject
    transitionInProgressMD: 'scal-s3-transition-in-progress',
    transitionAttemptMD: 'scal-s3-transition-attempt',
};
