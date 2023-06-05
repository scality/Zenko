
# to test (unsure of my evaluation of this)

# vault.checkPolicies()
# CreateBucket
# DeleteObjects
# PutObjectRetention

Feature: AWS S3 Bucket operations

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
    Scenario: Check Authentication on bucket object lock actions with Vault
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "<action>" on "*"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "PutBucketObjectLockConfiguration" on "*"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "PutBucketVersioning" on "*"
        When the user tries to perform "<action>" on the bucket
        Then it "<should>" pass Vault authentication

        Examples:
            | action       | allow | should     |
            | CreateBucket | Allow | should     |
            | CreateBucket | Deny  | should not |


    @2.6.0
    @PreMerge
    @Cloudserver-Auth
    Scenario: Check Authentication on bucket object lock actions with Vault
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "<action>" on "*"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "PutObjectRetention" on "*"
        And an existing bucket "" "" versioning, "with" ObjectLock "" retention mode
        When the user tries to perform "<action>" on the bucket
        Then it "<should>" pass Vault authentication

        Examples:
            | action             | allow | should     |
            | PutObjectRetention | Allow | should     |
            | PutObjectRetention | Deny  | should not |


    @2.6.0
    @PreMerge
    @Cloudserver-Auth
    Scenario: Check Authentication on DeleteObjects with Vault
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "DeleteObjects" on "<resource1>"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "DeleteObjects" on "<resource2>"
        And an existing bucket "<bucketName>" "" versioning, "" ObjectLock "" retention mode
        And an object "<objName1>" that "exists"
        And an object "<objName2>" that "exists"
        When the user tries to perform DeleteObjects
        Then it "<should>" pass Vault authentication

        Examples:
            | bucketName     | objName1 | objName2 | resource1           | resource2           | allow | should     |
            | ca-do-bucket-1 | obj1     | obj2     | ca-do-bucket-1/obj1 | ca-do-bucket-1/obj2 | Allow | should     |
            | ca-do-bucket-2 | obj1     | obj2     | ca-do-bucket-1/obj1 | ca-do-bucket-1/obj2 | Deny  | should not |
