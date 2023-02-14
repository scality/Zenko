Feature: IAM Policies for Assume Role Session Users
  This feature allows you to create and attach IAM policies for IAM users.
  IAM users should have the permissions to perform the actions that they are granted in their IAM policies.


  @2.6.0
  @PreMerge
  @IamPoliciesAssumeRole
  Scenario Outline: Assume Role User is not authorized to perform the actions with no IAM policy attached to the role
    Given an existing bucket "" "without" versioning, "without" ObjectLock "" retention mode
    And an object "" that "<objectExists>"
    And a "<ifCrossAccount>" AssumeRole user
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | objectExists   | ifCrossAccount |
      | MetadataSearch | does not exist |                |
      | MetadataSearch | does not exist | cross account  |
      | GetObject      | exists         |                |
      | GetObject      | exists         | cross account  |

  @2.6.0
  @PreMerge
  @IamPoliciesAssumeRole
  Scenario Outline: Assume Role User is authorized to perform the actions if the IAM policies that attached to the role have the right permission
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "Allow" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action         | resource                | bucketName    | objectExists   | objectName | ifCrossAccount |
      | MetadataSearch | *                       |               | does not exist |            |                |
      | MetadataSearch | *                       |               | does not exist |            | cross account  |
      | GetObject      | *                       |               | exists         |            |                |
      | GetObject      | *                       |               | exists         |            | cross account  |
      | MetadataSearch | ar-md-bucket1           | ar-md-bucket1 | does not exist |            |                |
      | MetadataSearch | ar-md-bucket2           | ar-md-bucket2 | does not exist |            | cross account  |
      | GetObject      | ar-go-bucket1/*         | ar-go-bucket1 | exists         |            |                |
      | GetObject      | ar-go-bucket2/*         | ar-go-bucket2 | exists         |            | cross account  |
      | GetObject      | ar-go-bucket3/go-object | ar-go-bucket3 | exists         | go-object  |                |
      | GetObject      | ar-go-bucket4/go-object | ar-go-bucket4 | exists         | go-object  | cross account  |

  @2.6.0
  @PreMerge
  @IamPoliciesAssumeRole
  Scenario Outline: Assume Role User is not authorized to perform the actions on the resource when they don't have permissions for or explicitly denied in the IAM policies that attached the role that the User assumed
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "<effect>" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | effect | resource                 | bucketName     | objectExists   | objectName | ifCrossAccount |
      | MetadataSearch | Allow  | ar-md-bucket3-1          | ar-md-bucket3  | does not exist |            |                |
      | MetadataSearch | Allow  | ar-md-bucket4-1          | ar-md-bucket4  | does not exist |            | cross account  |
      | MetadataSearch | Deny   | *                        |                | does not exist |            |                |
      | MetadataSearch | Deny   | *                        |                | does not exist |            | cross account  |
      | MetadataSearch | Deny   | ar-md-bucket5            | ar-md-bucket5  | does not exist |            |                |
      | MetadataSearch | Deny   | ar-md-bucket6            | ar-md-bucket6  | does not exist |            | cross account  |
      | GetObject      | Allow  | ar-go-bucket5-1/*        | ar-go-bucket5  | exists         |            |                |
      | GetObject      | Allow  | ar-go-bucket6-1/*        | ar-go-bucket6  | exists         |            | cross account  |
      | GetObject      | Allow  | ar-go-bucket7/go-object1 | ar-go-bucket7  | exists         | go-object  |                |
      | GetObject      | Allow  | ar-go-bucket8/go-object1 | ar-go-bucket8  | exists         | go-object  | cross account  |
      | GetObject      | Deny   | *                        | ar-go-bucket9  | exists         |            |                |
      | GetObject      | Deny   | *                        | ar-go-bucket10 | exists         |            | cross account  |
      | GetObject      | Deny   | ar-go-bucket11/*         | ar-go-bucket11 | exists         |            |                |
      | GetObject      | Deny   | ar-go-bucket12/*         | ar-go-bucket12 | exists         |            | cross account  |
      | GetObject      | Deny   | ar-go-bucket13/go-object | ar-go-bucket13 | exists         | go-object  |                |
      | GetObject      | Deny   | ar-go-bucket14/go-object | ar-go-bucket14 | exists         | go-object  | cross account  |

  @2.6.0
  @PreMerge
  @IamPoliciesAssumeRole
  Scenario Outline: Assume Role User is not authorized to perform the actions on the resource if Allow and Denied are both specified in the IAM policies that attached to the role the User assumed
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "Allow" effect to perform "<action>" on "<resource>"
    And an IAM policy attached to the entity "role" with "Deny" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error
    Examples:
      | action         | resource                 | bucketName     | objectExists   | objectName | ifCrossAccount |
      | MetadataSearch | *                        | ar-md-bucket7  | does not exist |            |                |
      | MetadataSearch | *                        | ar-md-bucket8  | does not exist |            | cross account  |
      | MetadataSearch | ar-md-bucket9            | ar-md-bucket9  | does not exist |            |                |
      | MetadataSearch | ar-md-bucket10           | ar-md-bucket10 | does not exist |            | cross account  |
      | GetObject      | *                        | ar-go-bucket15 | exists         |            |                |
      | GetObject      | *                        | ar-go-bucket16 | exists         |            | cross account  |
      | GetObject      | ar-go-bucket17/*         | ar-go-bucket17 | exists         |            |                |
      | GetObject      | ar-go-bucket18/*         | ar-go-bucket18 | exists         |            | cross account  |
      | GetObject      | ar-go-bucket19/go-object | ar-go-bucket19 | exists         | go-object  |                |
      | GetObject      | ar-go-bucket20/go-object | ar-go-bucket20 | exists         | go-object  | cross account  |
