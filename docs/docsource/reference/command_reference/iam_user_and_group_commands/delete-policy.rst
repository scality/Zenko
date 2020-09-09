.. _delete-policy:

delete-policy
=============

Deletes the specified managed policy.

Before you can delete a managed policy, you must first detach the policy from
all users, groups, and roles that it is attached to. In addition, you must
delete all the policy's versions. The following steps describe the process for
deleting a managed policy:

* Detach the policy from all users, groups, and roles that the policy is
  attached to, using the DetachUserPolicy, DetachGroupPolicy, or
  DetachRolePolicy API operations. To list all the users, groups, and roles that
  a policy is attached to, use ListEntitiesForPolicy.

* Delete all versions of the policy using DeletePolicyVersion. To list the
  policy's versions, use ListPolicyVersions. You cannot use DeletePolicyVersion
  to delete the version that is marked as the default version. You delete the
  policy's default version in the next step of the process.

* Delete the policy (this automatically deletes the policy's default version)
  using this API.

For information about managed policies, see `Managed Policies and Inline
Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/DeletePolicy>`_.

Synopsis
--------

::

  delete-policy
    --policy-arn <value>
    [--cli-input-json <value>]

Options
-------

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the IAM policy you want to delete.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

Examples
--------

**To delete an IAM policy**

This example deletes the policy whose ARN is
``arn:aws:iam::123456789012:policy/MySamplePolicy``::

  aws iam delete-policy --policy-arn arn:aws:iam::123456789012:policy/MySamplePolicy

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

None
