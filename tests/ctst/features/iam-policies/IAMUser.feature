Feature: IAM Policies for IAM Users
  This feature allows you to create and attach IAM policies for IAM users.
  IAM users should have the permissions to perform the actions that they are granted in their IAM policies.

  @2.6.0
  @PreMerge
  @IAM-Policies-IAMUsers
  Scenario Outline: User is not authorized to perform the actions without IAM policy
    Given an existing bucket "" "without" versioning
    And an object "" that "<objectExists>"
    And a IAM_USER type
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | ifS3Standard  | objectExists   |
      | MetadataSearch | notS3Standard | does not exist |
      | RestoreObject  | S3Standard    | exists         |

  @2.6.0
  @PreMerge
  @IAM-Policies-IAMUsers
  Scenario Outline: User is authorized to perform the actions that are granted in the IAM policy
    Given an existing bucket "<bucketName>" "without" versioning
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an existing IAM policy with "<effect>" effect to perform "<action>" on "<resource>"
    And attach the IAM policy to the user
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action         | effect | resource                                   | ifS3Standard  | bucketName             | objectExists   | objectName           |
      | MetadataSearch | Allow  | *                                          | notS3Standard |                        | does not exist |                      |
      | RestoreObject  | Allow  | *                                          | S3Standard    |                        | exists         |                      |
      | MetadataSearch | Allow  | metadatasearch-bucket1                     | notS3Standard | metadatasearch-bucket1 | does not exist |                      |
      | RestoreObject  | Allow  | restoreobject-bucket1/*                    | S3Standard    | restoreobject-bucket1  | exists         |                      |
      | RestoreObject  | Allow  | restoreobject-bucket2/restoreobject-object | S3Standard    | restoreobject-bucket2  | exists         | restoreobject-object |

  @2.6.0
  @PreMerge
  @IAM-Policies-IAMUsers
  Scenario Outline: User is not authorized to perform the actions on the resource that they don't have permissions for or explicitly denied
    Given an existing bucket "<bucketName>" "without" versioning
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an existing IAM policy with "<effect>" effect to perform "<action>" on "<resource>"
    And attach the IAM policy to the user
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | effect | resource                                    | ifS3Standard  | bucketName             | objectExists   | objectName           |
      | MetadataSearch | Allow  | metadatasearch-bucket3-1                    | notS3Standard | metadatasearch-bucket3 | does not exist |                      |
      | MetadataSearch | Deny   | *                                           | notS3Standard |                        | does not exist |                      |
      | MetadataSearch | Deny   | metadatasearch-bucket4                      | notS3Standard | metadatasearch-bucket4 | does not exist |                      |
      | RestoreObject  | Allow  | restoreobject-bucket3-1/*                   | S3Standard    | restoreobject-bucket3  | exists         |                      |
      | RestoreObject  | Allow  | restoreobject-bucket4/restoreobject-object1 | S3Standard    | restoreobject-bucket4  | exists         | restoreobject-object |
      | RestoreObject  | Deny   | *                                           | S3Standard    | restoreobject-bucket5  | exists         |                      |
      | RestoreObject  | Deny   | restoreobject-bucket5/*                     | S3Standard    | restoreobject-bucket5  | exists         |                      |
      | RestoreObject  | Deny   | restoreobject-bucket6/restoreobject-object  | S3Standard    | restoreobject-bucket6  | exists         | restoreobject-object |

  @2.6.0
  @PreMerge
  @IAM-Policies-IAMUsers
  Scenario Outline: User is not authorized to perform the actions on the resource when Allow and Denied are both specified
    Given an existing bucket "<bucketName>" "without" versioning
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an existing IAM policy with "Allow" effect to perform "<action>" on "<resource>"
    And attach the IAM policy to the user
    And an existing IAM policy with "Deny" effect to perform "<action>" on "<resource>"
    And attach the IAM policy to the user
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should receive "AccessDenied" error
    Examples:
      | action         | resource                                   | ifS3Standard  | bucketName             | objectExists   | objectName           |
      | MetadataSearch | *                                          | notS3Standard | metadatasearch-bucket5 | does not exist |                      |
      | MetadataSearch | metadatasearch-bucket6                     | notS3Standard | metadatasearch-bucket6 | does not exist |                      |
      | RestoreObject  | *                                          | S3Standard    | restoreobject-bucket7  | exists         |                      |
      | RestoreObject  | restoreobject-bucket8/*                    | S3Standard    | restoreobject-bucket8  | exists         |                      |
      | RestoreObject  | restoreobject-bucket9/restoreobject-object | S3Standard    | restoreobject-bucket9  | exists         | restoreobject-object |
