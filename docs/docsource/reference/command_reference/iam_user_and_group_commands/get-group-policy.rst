.. _get-group-policy:

get-group-policy
================

Retrieves the specified inline policy document that is embedded in the
specified IAM group.

.. note::

  Policies returned by this API are URL-encoded compliant with `RFC 3986
  <https://tools.ietf.org/html/rfc3986>`__. You can use a URL decoding method to
  convert the policy back to plain JSON text. For example, if you use Java, you
  can use the ``decode`` method of the ``java.net.URLDecoder`` utility class in
  the Java SDK. Other languages and SDKs provide similar functionality.

An IAM group can also have managed policies attached to it. To retrieve a
managed policy document that is attached to a group, use GetPolicy to determine
the policy's default version, then use GetPolicyVersion to retrieve the policy
document.

For more information about policies, see `Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/GetGroupPolicy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-group-policy
    --group-name <value>
    --policy-name <value>
    [--cli-input-json <value>]

Options
-------

``--group-name`` (string)

  The name of the group the policy is associated with.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--policy-name`` (string)

  The name of the policy document to get.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To get information about a policy attached to an IAM group**

The following ``get-group-policy`` command gets information about the specified
policy attached to the group named ``Test-Group``::

  aws iam get-group-policy --group-name Test-Group --policy-name S3-ReadOnly-Policy

Output::

    {
        "GroupName": "Test-Group",
        "PolicyDocument": {
            "Statement": [
                {
                    "Action": [
                        "s3:Get*",
                        "s3:List*"
                    ],
                    "Resource": "*",
                    "Effect": "Allow"
                }
            ]
        },
        "PolicyName": "S3-ReadOnly-Policy"
    }

For more information, see `Managing IAM Policies`_ in the *Using IAM* guide.

.. _`Managing IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingPolicies.html

Output
------

GroupName -> (string)

  The group the policy is associated with.

PolicyName -> (string)

  The name of the policy.

PolicyDocument -> (string)

  The policy document.

  IAM stores policies in JSON format. However, resources that were created using
  AWS CloudFormation templates can be formatted in YAML. AWS CloudFormation
  always converts a YAML policy to JSON format before submitting it to IAM.

