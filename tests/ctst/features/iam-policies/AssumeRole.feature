Feature: IAM Policies for Assume Role Session Users
  This feature allows you to create and attach IAM policies for IAM users.
  IAM users should have the permissions to perform the actions that they are granted in their IAM policies.


  @2.6.0
  @PreMerge
  @Flaky
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
  @Flaky
  @IamPoliciesAssumeRole
  Scenario Outline: Assume Role User is authorized to perform the actions if the IAM policies that attached to the role have the right permission
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "Allow" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action         | resource                           | bucketName             | objectExists   | objectName       | ifCrossAccount |
      | MetadataSearch | *                                  |                        | does not exist |                  |                |
      | MetadataSearch | *                                  |                        | does not exist |                  | cross account  |
      | GetObject      | *                                  |                        | exists         |                  |                |
      | GetObject      | *                                  |                        | exists         |                  | cross account  |
      | MetadataSearch | metadatasearch-bucket1             | metadatasearch-bucket1 | does not exist |                  |                |
      | MetadataSearch | metadatasearch-bucket1             | metadatasearch-bucket1 | does not exist |                  | cross account  |
      | GetObject      | getobject-bucket1/*                | getobject-bucket1      | exists         |                  |                |
      | GetObject      | getobject-bucket1/*                | getobject-bucket1      | exists         |                  | cross account  |
      | GetObject      | getobject-bucket2/getobject-object | getobject-bucket2      | exists         | getobject-object |                |
      | GetObject      | getobject-bucket2/getobject-object | getobject-bucket2      | exists         | getobject-object | cross account  |

  @2.6.0
  @PreMerge
  @Flaky
  @IamPoliciesAssumeRole
  Scenario Outline: Assume Role User is not authorized to perform the actions on the resource when they don't have permissions for or explicitly denied in the IAM policies that attached the role that the User assumed
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "<effect>" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | effect | resource                            | bucketName             | objectExists   | objectName       | ifCrossAccount |
      | MetadataSearch | Allow  | metadatasearch-bucket3-1            | metadatasearch-bucket3 | does not exist |                  |                |
      | MetadataSearch | Allow  | metadatasearch-bucket3-1            | metadatasearch-bucket3 | does not exist |                  | cross account  |
      | MetadataSearch | Deny   | *                                   |                        | does not exist |                  |                |
      | MetadataSearch | Deny   | *                                   |                        | does not exist |                  | cross account  |
      | MetadataSearch | Deny   | metadatasearch-bucket4              | metadatasearch-bucket4 | does not exist |                  |                |
      | MetadataSearch | Deny   | metadatasearch-bucket4              | metadatasearch-bucket4 | does not exist |                  | cross account  |
      | GetObject      | Allow  | getobject-bucket3-1/*               | getobject-bucket3      | exists         |                  |                |
      | GetObject      | Allow  | getobject-bucket3-1/*               | getobject-bucket3      | exists         |                  | cross account  |
      | GetObject      | Allow  | getobject-bucket4/getobject-object1 | getobject-bucket4      | exists         | getobject-object |                |
      | GetObject      | Allow  | getobject-bucket4/getobject-object1 | getobject-bucket4      | exists         | getobject-object | cross account  |
      | GetObject      | Deny   | *                                   | getobject-bucket5      | exists         |                  |                |
      | GetObject      | Deny   | *                                   | getobject-bucket5      | exists         |                  | cross account  |
      | GetObject      | Deny   | getobject-bucket5/*                 | getobject-bucket5      | exists         |                  |                |
      | GetObject      | Deny   | getobject-bucket5/*                 | getobject-bucket5      | exists         |                  | cross account  |
      | GetObject      | Deny   | getobject-bucket6/getobject-object  | getobject-bucket6      | exists         | getobject-object |                |
      | GetObject      | Deny   | getobject-bucket6/getobject-object  | getobject-bucket6      | exists         | getobject-object | cross account  |

  @2.6.0
  @PreMerge
  @Flaky
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
      | action         | resource                           | bucketName             | objectExists   | objectName       | ifCrossAccount |
      | MetadataSearch | *                                  | metadatasearch-bucket5 | does not exist |                  |                |
      | MetadataSearch | *                                  | metadatasearch-bucket5 | does not exist |                  | cross account  |
      | MetadataSearch | metadatasearch-bucket6             | metadatasearch-bucket6 | does not exist |                  |                |
      | MetadataSearch | metadatasearch-bucket6             | metadatasearch-bucket6 | does not exist |                  | cross account  |
      | GetObject      | *                                  | getobject-bucket7      | exists         |                  |                |
      | GetObject      | *                                  | getobject-bucket7      | exists         |                  | cross account  |
      | GetObject      | getobject-bucket8/*                | getobject-bucket8      | exists         |                  |                |
      | GetObject      | getobject-bucket8/*                | getobject-bucket8      | exists         |                  | cross account  |
      | GetObject      | getobject-bucket9/getobject-object | getobject-bucket9      | exists         | getobject-object |                |
      | GetObject      | getobject-bucket9/getobject-object | getobject-bucket9      | exists         | getobject-object | cross account  |
