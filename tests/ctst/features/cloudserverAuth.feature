Feature: AWS S3 Bucket operations

    @2.6.0
    @PreMerge
    @Cloudserver-Auth
    Scenario: Check Authentication on bucket object lock actions with Vault
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "CreateBucket" on "*"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "PutBucketObjectLockConfiguration" on "*"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "PutBucketVersioning" on "*"
        When the user tries to perform CreateBucket
        Then it "<should>" pass Vault authentication

        Examples:
            | allow | should     |
            | Allow | should     |
        # TODO: reenable after fix CLOUDSERVER-401
        #    | Deny  | should not |


    @2.6.0
    @PreMerge
    @Cloudserver-Auth
    Scenario: Check Authentication on bucket object lock actions with Vault
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "PutObjectRetention" on "*"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "BypassGovernanceRetention" on "*"
        And an existing bucket "" "" versioning, "with" ObjectLock "GOVERNANCE" retention mode
        And an object "" that "exists"
        When the user tries to perform PutObjectRetention "<withBypass>" bypass
        Then it "<should>" pass Vault authentication

        Examples:
            | allow | should     | withBypass |
            | Allow | should     | with       |
            | Allow | should not | without    |
            | Deny  | should not | with       |


    @2.6.0
    @PreMerge
    @Cloudserver-Auth
    Scenario: Check Authentication on DeleteObjects with Vault
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "DeleteObject" on "<resource1>"
        And an IAM policy attached to the entity "user" with "<allow>" effect to perform "DeleteObject" on "<resource2>"
        And an existing bucket "<bucketName>" "" versioning, "" ObjectLock "" retention mode
        And an object "<objName1>" that "exists"
        And an object "<objName2>" that "exists"
        When the user tries to perform DeleteObjects
        Then it "<should>" pass Vault authentication

        Examples:
            | bucketName     | objName1 | objName2 | resource1           | resource2           | allow | should     |
            | ca-do-bucket-1 | obj1     | obj2     | ca-do-bucket-1/obj1 | ca-do-bucket-1/obj2 | Allow | should     |
            | ca-do-bucket-2 | obj1     | obj2     | ca-do-bucket-1/obj1 | ca-do-bucket-1/obj2 | Deny  | should not |
