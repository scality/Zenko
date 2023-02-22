Feature: IAM Policies for Assume Role Session Users
  This feature allows you to create and attach IAM policies for IAM users.
  IAM users should have the permissions to perform the actions that they are granted in their IAM policies.


  @2.6.0
  @PreMerge
  @IAM-Policies-AssumeRole
  Scenario Outline: Assume Role User is not authorized to perform the actions with no IAM policy attached to the role
    Given an existing bucket "" "without" versioning
    And an object "" that "<objectExists>" "without" version-Id
    And a "<ifCrossAccount>" AssumeRole user
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | ifS3Standard  | objectExists   | ifCrossAccount |
      | MetadataSearch | notS3Standard | does not exist |                |
      | MetadataSearch | notS3Standard | does not exist | cross account  |
      | GetObject      | S3Standard    | exists         |                |
      | GetObject      | S3Standard    | exists         | cross account  |

  @2.6.0
  @PreMerge
  @IAM-Policies-AssumeRole
  Scenario Outline: Assume Role User is authorized to perform the actions if the IAM policies that attached to the role have the right permission
    Given an existing bucket "<bucketName>" "without" versioning
    And an object "<objectName>" that "<objectExists>" "without" version-Id
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "Allow" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action         | resource                           | ifS3Standard  | bucketName             | objectExists   | objectName       | ifCrossAccount |
      | MetadataSearch | *                                  | notS3Standard |                        | does not exist |                  |                |
      | MetadataSearch | *                                  | notS3Standard |                        | does not exist |                  | cross account  |
      | GetObject      | *                                  | S3Standard    |                        | exists         |                  |                |
      | GetObject      | *                                  | S3Standard    |                        | exists         |                  | cross account  |
      | MetadataSearch | metadatasearch-bucket1             | notS3Standard | metadatasearch-bucket1 | does not exist |                  |                |
      | MetadataSearch | metadatasearch-bucket1             | notS3Standard | metadatasearch-bucket1 | does not exist |                  | cross account  |
      | GetObject      | getobject-bucket1/*                | S3Standard    | getobject-bucket1      | exists         |                  |                |
      | GetObject      | getobject-bucket1/*                | S3Standard    | getobject-bucket1      | exists         |                  | cross account  |
      | GetObject      | getobject-bucket2/getobject-object | S3Standard    | getobject-bucket2      | exists         | getobject-object |                |
      | GetObject      | getobject-bucket2/getobject-object | S3Standard    | getobject-bucket2      | exists         | getobject-object | cross account  |

  @2.6.0
  @PreMerge
  @IAM-Policies-AssumeRole
  Scenario Outline: Assume Role User is not authorized to perform the actions on the resource when they don't have permissions for or explicitly denied in the IAM policies that attached the role that the User assumed
    Given an existing bucket "<bucketName>" "without" versioning
    And an object "<objectName>" that "<objectExists>" "without" version-Id
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "<effect>" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | effect | resource                            | ifS3Standard  | bucketName             | objectExists   | objectName       | ifCrossAccount |
      | MetadataSearch | Allow  | metadatasearch-bucket3-1            | notS3Standard | metadatasearch-bucket3 | does not exist |                  |                |
      | MetadataSearch | Allow  | metadatasearch-bucket3-1            | notS3Standard | metadatasearch-bucket3 | does not exist |                  | cross account  |
      | MetadataSearch | Deny   | *                                   | notS3Standard |                        | does not exist |                  |                |
      | MetadataSearch | Deny   | *                                   | notS3Standard |                        | does not exist |                  | cross account  |
      | MetadataSearch | Deny   | metadatasearch-bucket4              | notS3Standard | metadatasearch-bucket4 | does not exist |                  |                |
      | MetadataSearch | Deny   | metadatasearch-bucket4              | notS3Standard | metadatasearch-bucket4 | does not exist |                  | cross account  |
      | GetObject      | Allow  | getobject-bucket3-1/*               | S3Standard    | getobject-bucket3      | exists         |                  |                |
      | GetObject      | Allow  | getobject-bucket3-1/*               | S3Standard    | getobject-bucket3      | exists         |                  | cross account  |
      | GetObject      | Allow  | getobject-bucket4/getobject-object1 | S3Standard    | getobject-bucket4      | exists         | getobject-object |                |
      | GetObject      | Allow  | getobject-bucket4/getobject-object1 | S3Standard    | getobject-bucket4      | exists         | getobject-object | cross account  |
      | GetObject      | Deny   | *                                   | S3Standard    | getobject-bucket5      | exists         |                  |                |
      | GetObject      | Deny   | *                                   | S3Standard    | getobject-bucket5      | exists         |                  | cross account  |
      | GetObject      | Deny   | getobject-bucket5/*                 | S3Standard    | getobject-bucket5      | exists         |                  |                |
      | GetObject      | Deny   | getobject-bucket5/*                 | S3Standard    | getobject-bucket5      | exists         |                  | cross account  |
      | GetObject      | Deny   | getobject-bucket6/getobject-object  | S3Standard    | getobject-bucket6      | exists         | getobject-object |                |
      | GetObject      | Deny   | getobject-bucket6/getobject-object  | S3Standard    | getobject-bucket6      | exists         | getobject-object | cross account  |

  @2.6.0
  @PreMerge
  @IAM-Policies-AssumeRole
  Scenario Outline: Assume Role User is not authorized to perform the actions on the resource if Allow and Denied are both specified in the IAM policies that attached to the role the User assumed
    Given an existing bucket "<bucketName>" "without" versioning
    And an object "<objectName>" that "<objectExists>" "without" version-Id
    And a "<ifCrossAccount>" AssumeRole user
    And an IAM policy attached to the entity "role" with "Allow" effect to perform "<action>" on "<resource>"
    And an IAM policy attached to the entity "role" with "Deny" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should receive "AccessDenied" error
    Examples:
      | action         | resource                           | ifS3Standard  | bucketName             | objectExists   | objectName       | ifCrossAccount |
      | MetadataSearch | *                                  | notS3Standard | metadatasearch-bucket5 | does not exist |                  |                |
      | MetadataSearch | *                                  | notS3Standard | metadatasearch-bucket5 | does not exist |                  | cross account  |
      | MetadataSearch | metadatasearch-bucket6             | notS3Standard | metadatasearch-bucket6 | does not exist |                  |                |
      | MetadataSearch | metadatasearch-bucket6             | notS3Standard | metadatasearch-bucket6 | does not exist |                  | cross account  |
      | GetObject      | *                                  | S3Standard    | getobject-bucket7      | exists         |                  |                |
      | GetObject      | *                                  | S3Standard    | getobject-bucket7      | exists         |                  | cross account  |
      | GetObject      | getobject-bucket8/*                | S3Standard    | getobject-bucket8      | exists         |                  |                |
      | GetObject      | getobject-bucket8/*                | S3Standard    | getobject-bucket8      | exists         |                  | cross account  |
      | GetObject      | getobject-bucket9/getobject-object | S3Standard    | getobject-bucket9      | exists         | getobject-object |                |
      | GetObject      | getobject-bucket9/getobject-object | S3Standard    | getobject-bucket9      | exists         | getobject-object | cross account  |
