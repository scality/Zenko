.. _detach-role-policy:

detach-role-policy
==================

Removes the specified managed policy from the specified role.

A role can also have inline policies embedded with it. To delete an inline
policy, use the DeleteRolePolicy API. For information about policies, see
`Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: :ref:`DetachRolePolicy`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  detach-role-policy
    --role-name <value>
    --policy-arn <value>
    [--cli-input-json <value>]

Options
-------

``--role-name`` (string)

  The name (friendly name, not ARN) of the IAM role to detach the policy from.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--policy-arn`` (string)

  The Amazon Resource Name (ARN) of the IAM policy you want to detach.

  For more information about ARNs, see `Amazon Resource Names (ARNs) and AWS
  Service Namespaces
  <https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html>`__
  in the *AWS General Reference*.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To detach a policy from a role**

This example removes the managed policy with the ARN
``arn:aws:iam::123456789012:policy/FederatedTesterAccessPolicy`` from the role
called ``FedTesterRole``::

  aws iam detach-role-policy --role-name FedTesterRole --policy-arn arn:aws:iam::123456789012:policy/FederatedTesterAccessPolicy 

For more information, see `Overview of IAM Policies`_ in the *Using IAM* guide.

.. _`Overview of IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html

Output
------

None
