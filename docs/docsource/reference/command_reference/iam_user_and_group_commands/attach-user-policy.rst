.. _attach-user-policy:

attach-user-policy
==================

Attaches the specified managed policy to the specified user.

Use this API to attach a *managed* policy to a user. To embed an inline policy
in a user, use PutUserPolicy.

For more information about policies, see `Managed Policies and Inline Policies
<https://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/AttachUserPolicy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  attach-user-policy
    --user-name <value>
    --policy-arn <value>
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name (friendly name, not ARN) of the IAM user to attach the policy to.

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

**To attach a managed policy to an IAM user**

The following ``attach-user-policy`` command attaches the AWS managed policy
named ``AdministratorAccess`` to the IAM user named ``Alice``::

  aws iam attach-user-policy --policy-arn arn:aws:iam:ACCOUNT-ID:aws:policy/AdministratorAccess --user-name Alice

For more information, see `Managed Policies and Inline Policies`_ in the *Using
IAM* guide.

.. _`Managed Policies and Inline Policies`: http://docs.aws.amazon.com/IAM/latest/UserGuide/policies-managed-vs-inline.html

Output
------

None
