.. _delete-policy-version:

delete-policy-version
=====================

Deletes the specified version from the specified managed policy.

You cannot delete the default version from a policy using this API. To delete
the default version from a policy, use DeletePolicy. To find out which version
of a policy is marked as the default version, use ListPolicyVersions.

For information about versions for managed policies, see `Versioning for Managed
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-versions.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/DeletePolicyVersion>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-policy-version
    --policy-arn <value>
    --version-id <value>
    [--cli-input-json <value>]

Options
-------

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the IAM policy from which you want to delete
  a version.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--version-id`` (string)

  The policy version to delete.

  This parameter allows (through its regex pattern) a string of characters that
  consists of the lowercase letter 'v' followed by one or two digits, and
  optionally followed by a period '.' and a string of letters and digits.

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

**To delete a version of a managed policy**

This example deletes the version identified as ``v2`` from the policy whose ARN
is ``arn:aws:iam::123456789012:policy/MySamplePolicy``::

  aws iam delete-policy-version --policy-arn arn:aws:iam::123456789012:policy/MyPolicy --version-id v2

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

None
