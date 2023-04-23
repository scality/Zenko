Feature: IAM Policies for Backbeat Service Users
  As a backbeat service user, 
  I want to have specific permissions to perform S3 actions for data replication and expiration 
  So that I can effectively manage data within the system.


  @2.6.0
  @PreMerge
  @IamPoliciesBackbeatServiceUser
  Scenario Outline: Backbeat Service Users are authorized to perform the actions and get success response
    Given an existing bucket "" "<withVersioning>" versioning, "without" ObjectLock "" retention mode
    And an object "" that "<objectExists>"
    And a service user "<serviceUserName>" assuming the role "<roleName>" of a user account
    When the user tries to perform "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action               | withVersioning | objectExists   | serviceUserName         | roleName                    |
      | GetBucketVersioning  | with           | does not exist | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     |
      | ListObjects          | with           | exists         | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     |
      | ListMultipartUploads | with           | exists         | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     |
      | GetObjectTagging     | without        | exists         | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     |
      | GetObjectTagging     | with           | exists         | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     |
      | GetObject            | without        | exists         | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     |
      | GetObject            | with           | exists         | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     |
      | GetObject            | without        | exists         | backbeat-lifecycle-op-1 | backbeat-lifecycle-op-1     |
      | GetObject            | with           | exists         | backbeat-lifecycle-op-1 | backbeat-lifecycle-op-1     |
      | DeleteObject         | without        | exists         | backbeat-lifecycle-op-1 | backbeat-lifecycle-op-1     |
      | DeleteObject         | with           | exists         | backbeat-lifecycle-op-1 | backbeat-lifecycle-op-1     |
      | AbortMultipartUpload | with           | exits          | backbeat-lifecycle-op-1 | backbeat-lifecycle-op-1     |
      | GetObject            | without        | exists         | sorbet-fwd-2            | cold-storage-archive-role-2 |
      | GetObject            | with           | exists         | sorbet-fwd-2            | cold-storage-archive-role-2 |
      | GetObject            | without        | exists         | sorbet-fwd-2            | cold-storage-restore-role-2 |
      | GetObject            | with           | exists         | sorbet-fwd-2            | cold-storage-restore-role-2 |

  @2.6.0
  @PreMerge
  @IamPoliciesBackbeatServiceUser
  Scenario Outline: Backbeat Service Users are authorized to perform the actions and get expected error response
    Given an existing bucket "" "<withVersioning>" versioning, "without" ObjectLock "" retention mode
    And an object "" that "<objectExists>"
    And a service user "<serviceUserName>" assuming the role "<roleName>" of a user account
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "<expectedError>" error

    Examples:
      | action                          | withVersioning | objectExists   | serviceUserName         | roleName                    | expectedError                |
      | GetBucketLifecycleConfiguration | with           | does not exist | backbeat-lifecycle-bp-1 | backbeat-lifecycle-bp-1     | NoSuchLifecycleConfiguration |
      | PutObjectVersion                | with           | exists         | sorbet-fwd-2            | cold-storage-restore-role-2 | InvalidObjectState           |

  @2.6.0
  @PreMerge
  @Flaky
  @IamPoliciesBackbeatServiceUser
  Scenario Outline: Backbeat Service Users are authorized to perform the actions
    Given a service user "<serviceUserName>" assuming the role "<roleName>" of an internal service account
    When the user tries to perform vault auth "<action>"
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action         | serviceUserName                | roleName                       |
      | GetAccountInfo | backbeat-qp-1                  | backbeat-qp-1                  |
      | GetAccountInfo | backbeat-lifecycle-conductor-1 | backbeat-lifecycle-conductor-1 |

  @2.6.0
  @PreMerge
  @Flaky
  @IamPoliciesBackbeatServiceUser
  Scenario Outline: Backbeat Service Users are not authorized to perform the actions
    Given a service user "<serviceUserName>" assuming the role "<roleName>" of a user account
    When the user tries to perform vault auth "<action>"
    Then the user should not be able to perform the "<action>" action

    Examples:
      | action         | serviceUserName                | roleName                       |
      | GetAccountInfo | backbeat-lifecycle-conductor-1 | backbeat-lifecycle-conductor-1 |
