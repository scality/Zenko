Feature: IAM Policies for IAM Users
  This feature allows you to create and attach IAM policies for IAM users.
  IAM users should have the permissions to perform the actions that they are granted in their IAM policies.

  @2.6.0
  @PreMerge
  @IamPoliciesIamUsers
  Scenario Outline: User is not authorized to perform the actions without IAM policy
    Given an existing bucket "" "without" versioning, "without" ObjectLock "" retention mode
    And an object "" that "<objectExists>"
    And a IAM_USER type
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | objectExists   |
      | MetadataSearch | does not exist |
      | GetObject      | exists         |

  @2.6.0
  @PreMerge
  @IamPoliciesIamUsers
  Scenario Outline: User is authorized to perform the actions that are granted in the IAM policy
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an IAM policy attached to the user with "Allow" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action         | resource                | bucketName    | objectExists   | objectName |
      | MetadataSearch | *                       |               | does not exist |            |
      | GetObject      | *                       |               | exists         |            |
      | MetadataSearch | iu-md-bucket1           | iu-md-bucket1 | does not exist |            |
      | GetObject      | iu-go-bucket1/*         | iu-go-bucket1 | exists         |            |
      | GetObject      | iu-go-bucket2/go-object | iu-go-bucket2 | exists         | go-object  |

  @2.6.0
  @PreMerge
  @IamPoliciesIamUsers
  Scenario Outline: User is not authorized to perform the actions on the resource that they don't have permissions for or explicitly denied
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an IAM policy attached to the user with "<effect>" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | effect | resource                 | bucketName    | objectExists   | objectName |
      | MetadataSearch | Allow  | iu-md-bucket3-1          | iu-md-bucket3 | does not exist |            |
      | MetadataSearch | Deny   | *                        |               | does not exist |            |
      | MetadataSearch | Deny   | iu-md-bucket4            | iu-md-bucket4 | does not exist |            |
      | GetObject      | Allow  | iu-go-bucket3-1/*        | iu-go-bucket3 | exists         |            |
      | GetObject      | Allow  | iu-go-bucket4/go-object1 | iu-go-bucket4 | exists         | go-object  |
      | GetObject      | Deny   | *                        | iu-go-bucket5 | exists         |            |
      | GetObject      | Deny   | iu-go-bucket5/*          | iu-go-bucket5 | exists         |            |
      | GetObject      | Deny   | iu-go-bucket6/go-object  | iu-go-bucket6 | exists         | go-object  |

  @2.6.0
  @PreMerge
  @IamPoliciesIamUsers
  Scenario Outline: User is not authorized to perform the actions on the resource when Allow and Denied are both specified
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an IAM policy attached to the user with "Allow" effect to perform "<action>" on "<resource>"
    And an IAM policy attached to the user with "Deny" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error
    Examples:
      | action         | resource                | bucketName    | objectExists   | objectName |
      | MetadataSearch | *                       | iu-md-bucket5 | does not exist |            |
      | MetadataSearch | iu-md-bucket6           | iu-md-bucket6 | does not exist |            |
      | GetObject      | *                       | iu-go-bucket7 | exists         |            |
      | GetObject      | iu-go-bucket8/*         | iu-go-bucket8 | exists         |            |
      | GetObject      | iu-go-bucket9/go-object | iu-go-bucket9 | exists         | go-object  |
