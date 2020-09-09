.. _attach-group-policy:

attach-group-policy
===================

Attaches the specified managed policy to the specified IAM group.

You use this API to attach a managed policy to a group. To embed an inline
policy in a group, use PutGroupPolicy.

For more information about policies, see `Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/AttachGroupPolicy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

   attach-group-policy
     --group-name <value>
     --policy-arn <value>
     [--cli-input-json <value>]

Options
-------

``--group-name`` (string)

  The name (friendly name, not ARN) of the group to attach the policy to.

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

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To attach a managed policy to an IAM group**

The following ``attach-group-policy`` command attaches the AWS managed policy
named ``ReadOnlyAccess`` to the IAM group named ``Finance``::

  aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess --group-name Finance

For more information, see `Managed Policies and Inline Policies`_ in the *Using
IAM* guide.

.. _`Managed Policies and Inline Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html

Output
------

None
