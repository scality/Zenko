.. _set-default-policy-version:

set-default-policy-version
==========================

Sets the specified version of the specified policy as the policy's default
(operative) version.

This operation affects all users, groups, and roles that the policy is attached
to. To list the users, groups, and roles that the policy is attached to, use the
ListEntitiesForPolicy API.

For information about managed policies, see `Managed Policies and Inline
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/SetDefaultPolicyVersion>`_.

Synopsis
--------

::

  set-default-policy-version
    --policy-arn <value>
    --version-id <value>
    [--cli-input-json <value>]

Options
-------

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the IAM policy whose default version you
  want to set.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--version-id`` (string)

  The version of the policy to set as the default (operative) version.

  For more information about managed policy versions, see `Versioning for
  Managed Policies
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-versions.html>`__
  in the *IAM User Guide*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Examples
--------

**To set the specified version of the specified policy as the policy's default
version.**

This example sets the ``v2`` version of the policy whose ARN is
``arn:aws:iam::123456789012:policy/MyPolicy`` as the default active version::

  aws iam set-default-policy-version --policy-arn arn:aws:iam::123456789012:policy/MyPolicy --version-id v2

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

None
