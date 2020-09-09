.. _create-policy:

create-policy
=============

Creates a new managed policy for your AWS account.

This operation creates a policy version with a version identifier of ``v1`` and
sets v1 as the policy's default version. For more information about policy
versions, see `Versioning for Managed Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-versions.html>`__
in the *IAM User Guide*.

For more information about managed policies in general, see `Managed Policies
and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/CreatePolicy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  create-policy
    --policy-name <value>
    [--path <value>]
    --policy-document <value>
    [--description <value>]
    [--cli-input-json <value>]

Options
-------

``--policy-name`` (string)

  The friendly name of the policy.

  IAM user, group, role, and policy names must be unique within the
  account. Names are not distinguished by case. For example, you cannot create
  resources named both "MyResource" and "myresource".

``--path`` (string)

  The path for the policy.

  For more information about paths, see `IAM Identifiers
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
  in the *IAM User Guide*.

  This parameter is optional. If it is not included, it defaults to a slash (/).

  This parameter allows (through its regex pattern)
  a string of characters consisting of
  either a forward slash (/) by itself or a string that must begin and end with
  forward slashes. In addition, it can contain any ASCII character from the "!"
  (\u0021) through the DEL character (\u007F), including most punctuation
  characters, digits, and upper and lowercased letters.

``--policy-document`` (string)

  The JSON policy document that you want to use as the content for the new policy.

  You must provide policies in JSON format in IAM. However, for AWS
  CloudFormation templates formatted in YAML, you can provide the policy in JSON
  or YAML format. AWS CloudFormation always converts a YAML policy to JSON
  format before submitting it to IAM.

  The regex pattern used to validate this
  parameter is a string of characters consisting of the following:

  * Any printable ASCII character ranging from the space character (\u0020)
    through the end of the ASCII character range

  * The printable characters in the Basic Latin and Latin-1 Supplement character
    set (through \u00FF)

  * The special characters tab (\u0009), line feed (\u000A), and carriage return
    (\u000D)

``--description`` (string)

  A friendly description of the policy.

  Typically used to store information about the permissions defined in the
  policy. For example, "Grants access to production DynamoDB tables."

  The policy description is immutable. After a value is assigned, it cannot be changed.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Examples
--------

The following command creates a customer managed policy named ``my-policy``::

  aws iam create-policy --policy-name my-policy --policy-document file://policy

Output::

  {
      "Policy": {
          "PolicyName": "my-policy",
          "CreateDate": "2015-06-01T19:31:18.620Z",
          "AttachmentCount": 0,
          "IsAttachable": true,
          "PolicyId": "ZXR6A36LTYANPAI7NJ5UV",
          "DefaultVersionId": "v1",
          "Path": "/",
          "Arn": "arn:aws:iam::0123456789012:policy/my-policy",
          "UpdateDate": "2015-06-01T19:31:18.620Z"
      }
  }

The file ``policy`` is a JSON document in the current folder that grants
read-only access to the ``shared`` folder in an S3 bucket named ``my-bucket``::

  {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "s3:Get*",
                  "s3:List*"
              ],
              "Resource": [
                  "arn:aws:s3:::my-bucket/shared/*"
              ]
          }
      ]
  }

For more information on using files as input for string parameters, see
`Specifying Parameter Values`_ in the *AWS CLI User Guide*.

.. _`Specifying Parameter Values`: http://docs.aws.amazon.com/cli/latest/userguide/cli-using-param.html

Output
------

Policy -> (structure)

  A structure containing details about the new policy.

  PolicyName -> (string)

    The friendly name (not ARN) identifying the policy.

  PolicyId -> (string)

    The stable and unique string identifying the policy.

    For more information about IDs, see `IAM Identifiers <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__ in the *Using IAM* guide.

  Arn -> (string)

    The Amazon Resource Name (ARN). ARNs are unique identifiers for AWS resources.

    For more information about ARNs, go to `Amazon Resource Names (ARNs) and AWS Service Namespaces <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__ in the *AWS General Reference*. 

  Path -> (string)

    The path to the policy.

    For more information about paths, see `IAM Identifiers
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html>`__
    in the *Using IAM* guide.

  DefaultVersionId -> (string)

    The identifier for the version of the policy that is set as the default version.

  AttachmentCount -> (integer)

    The number of entities (users, groups, and roles) that the policy is
    attached to.

  PermissionsBoundaryUsageCount -> (integer)

    The number of entities (users and roles) for which the policy is used to set
    the permissions boundary.

    For more information about permissions boundaries, see `Permissions
    Boundaries for IAM Identities
    <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html>`__
    in the *IAM User Guide*.

  IsAttachable -> (Boolean)

    Specifies whether the policy can be attached to an IAM user, group, or role.

  Description -> (string)

    A friendly description of the policy.

    This element is included in the response to the GetPolicy operation. It is
    not included in the response to the ListPolicies operation.

  CreateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the policy was created.

  UpdateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the policy was last updated.

    When a policy has only one version, this field contains the date and time
    when the policy was created. When a policy has more than one version, this
    field contains the date and time when the most recent policy version was
    created.
