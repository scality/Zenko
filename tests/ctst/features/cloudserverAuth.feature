
# to test (unsure of my evaluation of this)

# vault.checkPolicies()
# CreateBucket
# DeleteObjects
# PutObjectRetention

# vault.getEmailAddresses()
# GetBucketAcl (in the case the acl is set with account canonicalID)
# GetObjectAcl (for same case)

# vault.getAccountIds() → all cases where expectedBucketOwner parameter is used
# DeleteBucketEncryption
# GetBucketEncryption
# GetBucketTagging
# PutBucketEncryption
# PutBucketTagging

# vault.getCanonicalIds()
# Multi part upload?
# PutBucketAcl -> in case of ACL set in request header and is not canned
# PutObjectAcl -> same as above
# CreateBucket -> In case users are only identified by email

Feature: AWS S3 Bucket operations

    # # Test Case Context: The bucket must be created with an ACL where users are only identified by email address
    # @2.6.0
    # @PreMerge
    # @Cloudserver-Auth
    # Scenario: CreateBucket with ACL
    #     When I create a bucket with an ACL where users are identified by email address
    #     Then I should pass Vault authentication

    # @2.6.0
    # @PreMerge
    # @Cloudserver-Auth
    # Scenario: Check Authentication with Vault
    #     Given a bucket "<withVersioning>" versioning, "<withRetention>" retention mode, "<withBucketAclViaCanonicalId>" ACL set via canonical ID
    #     And an object that "<objectExists>" "<withObjectAclViaCanonicalId>" ACL set via canonical ID
    #     When I perform "<action>" on an object "<withAclViaHeader>" ACL set via header
    #     Then I should pass Vault authentication

    #     Examples:
    #         | action                 | withVersioning | withRetention | withBucketAclViaCanonicalId | objectExists   | withObjectAclViaCanonicalId | withAclViaHeader |
    #         | DeleteObjects          | with           | without       | without                     | exists         |                             |                  |
    #         | PutObjectRetention     | with           | with          | without                     | exists         |                             |                  |
    #         | GetObjectAcl           | without        | without       | without                     | exists         | with                        |                  |
    #         | PutObjectAcl           | without        | without       | without                     | exists         |                             | with             |

    # @2.6.0
    # @PreMerge
    # @Cloudserver-Auth
    # Scenario: Check Authentication with Vault
    #     Given a bucket "<withVersioning>" versioning, "<withRetention>" retention mode, "<withBucketAclViaCanonicalId>" ACL set via canonical ID
    #     And an object that "<objectExists>" "<withObjectAclViaCanonicalId>" ACL set via canonical ID
    #     When I perform "<action>" on a bucket "<withExpectedBucketOwner>" expectedBucketOwner parameter
    #     Then I should pass Vault authentication

    #     Examples:
    #         | action                 | withVersioning | withRetention | withBucketAclViaCanonicalId | objectExists   | withObjectAclViaCanonicalId | withExpectedBucketOwner |
    #         | GetBucketAcl           | without        | without       | with                        | does not exist |                             |                         |
    #         | GetObjectAcl           | without        | without       | without                     | exists         | with                        |                         |
    #         | DeleteBucketEncryption | without        | without       | without                     | does not exist |                             | with                    |
    #         | GetBucketEncryption    | without        | without       | without                     | does not exist |                             | with                    |
    #         | GetBucketTagging       | without        | without       | without                     | does not exist |                             | with                    |
    #         | PutBucketEncryption    | without        | without       | without                     | does not exist |                             | with                    |
    #         | PutBucketTagging       | without        | without       | without                     | does not exist |                             | with                    |



# Cases to test
# - pass CreateBucket with object lock config
# - not CreateBucket with object lock config when no policy
# - pass PutObjectRetention with object lock config
# - not PutObjectRetention with object lock config when no policy
# - pass DeleteObjects when all objects
# - not pass when one object denied


    @2.6.0
    @PreMerge
    @Cloudserver-Auth
    Scenario: Check Authentication with Vault passes
    
        