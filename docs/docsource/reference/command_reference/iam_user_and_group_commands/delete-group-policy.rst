.. _delete-group-policy:

delete-group-policy
===================

Deletes the specified inline policy that is embedded in the specified IAM group.

A group can also have managed policies attached to it. To detach a managed
policy from a group, use DetachGroupPolicy. For more information about
policies, refer to `Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/DeleteGroupPolicy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-group-policy
    --group-name <value>
    --policy-name <value>
    [--cli-input-json <value>]

Options
-------

``--group-name`` (string)

  The name (friendly name, not ARN) identifying the group that the policy is embedded in.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--policy-name`` (string)

  The name identifying the policy document to delete.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided.  If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To delete a policy from an IAM group**

The following ``delete-group-policy`` command deletes the policy named
``ExamplePolicy`` from the group named ``Admins``::

  aws iam delete-group-policy --group-name Admins --policy-name ExamplePolicy

To see the policies attached to a group, use the ``list-group-policies``
command.

For more information, see `Managing IAM Policies`_ in the *Using IAM* guide.

.. _`Managing IAM Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingPolicies.html

Output
------

None
