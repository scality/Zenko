.. _attach-role-policy:

attach-role-policy
==================

Attaches the specified managed policy to the specified IAM role. When you attach
a managed policy to a role, the managed policy becomes part of the role's
permission (access) policy.

.. note::

  You cannot use a managed policy as the role's trust policy. The role's trust
  policy is created at the same time as the role, using CreateRole. You can
  update a role's trust policy using UpdateAssumeRolePolicy.

Use this API to attach a *managed* policy to a role. To embed an inline policy
in a role, use PutRolePolicy. For more information about policies, see `Managed
Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: :ref:`AttachRolePolicy`.

Synopsis
--------

::

  attach-role-policy
    --role-name <value>
    --policy-arn <value>
    [--cli-input-json <value>]

Options
-------

``--role-name`` (string)

  The name (friendly name, not ARN) of the role to attach the policy to.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the IAM policy you want to attach.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

Examples
--------

**To attach a managed policy to an IAM role**

The following ``attach-role-policy`` command attaches the AWS managed policy
named ``ReadOnlyAccess`` to the IAM role named ``ReadOnlyRole``::

  aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess --role-name ReadOnlyRole

For more information, see `Managed Policies and Inline Policies`_ in the *Using
IAM* guide.

.. _`Managed Policies and Inline Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html

Output
------

None
