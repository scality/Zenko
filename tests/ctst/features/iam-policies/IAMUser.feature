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
    And an IAM policy attached to the entity "user" with "Allow" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action         | resource                           | bucketName             | objectExists   | objectName       |
      | MetadataSearch | *                                  |                        | does not exist |                  |
      | GetObject      | *                                  |                        | exists         |                  |
      | MetadataSearch | metadatasearch-bucket1             | metadatasearch-bucket1 | does not exist |                  |
      | GetObject      | getobject-bucket1/*                | getobject-bucket1      | exists         |                  |
      | GetObject      | getobject-bucket2/getobject-object | getobject-bucket2      | exists         | getobject-object |

  @2.6.0
  @PreMerge
  @IamPoliciesIamUsers
  Scenario Outline: User is not authorized to perform the actions on the resource that they don't have permissions for or explicitly denied
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an IAM policy attached to the entity "user" with "<effect>" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action         | effect | resource                            | bucketName             | objectExists   | objectName       |
      | MetadataSearch | Allow  | metadatasearch-bucket3-1            | metadatasearch-bucket3 | does not exist |                  |
      | MetadataSearch | Deny   | *                                   |                        | does not exist |                  |
      | MetadataSearch | Deny   | metadatasearch-bucket4              | metadatasearch-bucket4 | does not exist |                  |
      | GetObject      | Allow  | getobject-bucket3-1/*               | getobject-bucket3      | exists         |                  |
      | GetObject      | Allow  | getobject-bucket4/getobject-object1 | getobject-bucket4      | exists         | getobject-object |
      | GetObject      | Deny   | *                                   | getobject-bucket5      | exists         |                  |
      | GetObject      | Deny   | getobject-bucket5/*                 | getobject-bucket5      | exists         |                  |
      | GetObject      | Deny   | getobject-bucket6/getobject-object  | getobject-bucket6      | exists         | getobject-object |

  @2.6.0
  @PreMerge
  @IamPoliciesIamUsers
  Scenario Outline: User is not authorized to perform the actions on the resource when Allow and Denied are both specified
    Given an existing bucket "<bucketName>" "without" versioning, "without" ObjectLock "" retention mode
    And an object "<objectName>" that "<objectExists>"
    And a IAM_USER type
    And an IAM policy attached to the entity "user" with "Allow" effect to perform "<action>" on "<resource>"
    And an IAM policy attached to the entity "user" with "Deny" effect to perform "<action>" on "<resource>"
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error
    Examples:
      | action         | resource                           | bucketName             | objectExists   | objectName       |
      | MetadataSearch | *                                  | metadatasearch-bucket5 | does not exist |                  |
      | MetadataSearch | metadatasearch-bucket6             | metadatasearch-bucket6 | does not exist |                  |
      | GetObject      | *                                  | getobject-bucket7      | exists         |                  |
      | GetObject      | getobject-bucket8/*                | getobject-bucket8      | exists         |                  |
      | GetObject      | getobject-bucket9/getobject-object | getobject-bucket9      | exists         | getobject-object |
