.. _get-policy-version:

get-policy-version
==================

Retrieves information about the specified version of the specified managed
policy, including the policy document.

.. note::

  Policies returned by this API are URL-encoded compliant with `RFC 3986
  <https://tools.ietf.org/html/rfc3986>`__. You can use a URL decoding method to
  convert the policy back to plain JSON text. For example, if you use Java, you
  can use the ``decode`` method of the ``java.net.URLDecoder`` utility class in
  the Java SDK. Other languages and SDKs provide similar functionality.

To list the available versions for a policy, use ListPolicyVersions.

This API retrieves information about managed policies. To retrieve information
about an inline policy that is embedded in a user, group, or role, use the
GetUserPolicy, GetGroupPolicy, or GetRolePolicy API.

For more information about the types of policies, see `Managed Policies and
Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

For more information about managed policy versions, see `Versioning for Managed
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-versions.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/GetPolicyVersion>`_.

Synopsis
--------

::

  get-policy-version
    --policy-arn <value>
    --version-id <value>
    [--cli-input-json <value>]

Options
-------

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the managed policy that you want information
  about.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--version-id`` (string)

  Identifies the policy version to retrieve.

  This parameter allows (through its regex pattern) a string of characters that
  consists of the lowercase letter 'v' followed by one or two digits, and
  optionally followed by a period '.' and a string of letters and digits.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To retrieve information about the specified version of the specified managed
policy**

This example returns the policy document for the v2 version of the policy whose
ARN is ``arn:aws:iam::123456789012:policy/MyManagedPolicy``::

  aws iam get-policy-version --policy-arn arn:aws:iam::123456789012:policy/MyPolicy --version-id v2

Output::

  {
    "PolicyVersion": {
      "CreateDate": "2015-06-17T19:23;32Z",
      "VersionId": "v2",
      "Document": {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "iam:*",
            "Resource": "*",
            "Effect": "Allow"
            }
          ]
        }
      "IsDefaultVersion": "false"
    }
  }

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

PolicyVersion -> (structure)

  A structure containing details about the policy version.

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

    Policy version identifiers always begin with ``v`` (always lowercase). When
    a policy is created, the first policy version is ``v1``.

  IsDefaultVersion -> (Boolean)

    Specifies whether the policy version is set as the policy's default version.

  CreateDate -> (timestamp)

    The date and time, in `ISO 8601 date-time format
    <http://www.iso.org/iso/iso8601>`__, when the policy version was created.
