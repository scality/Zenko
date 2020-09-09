.. _create-policy-version:

create-policy-version
=====================

Creates a new version of the specified managed policy. To update a managed
policy, you create a new policy version. A managed policy can have up to five
versions. If the policy has five versions, you must delete an existing version
using DeletePolicyVersion before you create a new version.

Optionally, you can set the new version as the policy's default version. The
default version is the version that is in effect for the IAM users, groups, and
roles to which the policy is attached.

For more information about managed policy versions, see `Versioning for Managed
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-versions.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/CreatePolicyVersion>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  create-policy-version
    --policy-arn <value>
    --policy-document <value>
    [--set-as-default | --no-set-as-default]
    [--cli-input-json <value>]

Options
-------

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the IAM policy to which you want to add a new version.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--policy-document`` (string)

  The JSON policy document that you want to use as the content for this new
  version of the policy.

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

``--set-as-default`` | ``--no-set-as-default`` (Boolean)

  Specifies whether to set this version as the policy's default version.

  When this parameter is ``true``, the new policy version becomes the operative
  version. That is, it becomes the version that is in effect for the IAM users,
  groups, and roles that the policy is attached to.

  For more information about managed policy versions, see `Versioning for
  Managed Policies
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-versions.html>`__
  in the *IAM User Guide*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To create a new version of a managed policy**

This example creates a new ``v2`` version of the IAM policy whose ARN is
``arn:aws:iam::123456789012:policy/MyPolicy`` and makes it the default version::

  aws iam create-policy-version --policy-arn arn:aws:iam::123456789012:policy/MyPolicy\
  --policy-document file://NewPolicyVersion.json --set-as-default

Output::

  {
      "PolicyVersion": {
          "CreateDate": "2015-06-16T18:56:03.721Z",
          "VersionId": "v2",
          "IsDefaultVersion": true
      }
  }

For more information, see `Versioning for Managed Policies`_ in the *Using IAM*
guide.

.. _`Versioning for Managed Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_managed-versioning.html

Output
------

PolicyVersion -> (structure)

  A structure containing details about the new policy version.

  Document -> (string)

    The policy document.

    The policy document is returned in the response to the GetPolicyVersion and
    GetAccountAuthorizationDetails operations. It is not returned in the
    response to the CreatePolicyVersion or ListPolicyVersions operations.

    The policy document returned in this structure is URL-encoded compliant with
    `RFC 3986 <https://tools.ietf.org/html/rfc3986>`__. You can use a URL
    decoding method to convert the policy back to plain JSON text. For example,
    if you use Java, you can use the ``decode`` method of the
    ``java.net.URLDecoder`` utility class in the Java SDK. Other languages and
    SDKs provide similar functionality.

  VersionId -> (string)

    The identifier for the policy version.

    Policy version identifiers always begin with ``v`` (lowercase). When a
    policy is created, the first policy version is ``v1``.

  IsDefaultVersion -> (Boolean)

    Specifies whether the policy version is set as the policy's default version.

  CreateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the policy version was created.

