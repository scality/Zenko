.. _delete-login-profile:

delete-login-profile
====================

Deletes the password for the specified IAM user, which terminates the user's
ability to access AWS services through the AWS Management Console.

.. warning::

  Deleting a user's password does not prevent a user from accessing AWS through
  the command-line interface or the API. To prevent all user access, you must
  also either make any access keys inactive or delete them. For more information
  about making keys inactive or deleting them, see
  `UpdateAccessKey <https://docs.aws.amazon.com/IAM/latest/APIReference/API_UpdateAccessKey.html>`_
  and `DeleteAccessKey <https://docs.aws.amazon.com/IAM/latest/APIReference/API_DeleteAccessKey.html>`_.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/DeleteLoginProfile>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-login-profile
    --user-name <value>
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the user whose password you want to delete.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To delete a password for an IAM user**

The following ``delete-login-profile`` command deletes the password for the IAM
user named ``Bob``::

  aws iam delete-login-profile --user-name Bob

For more information, see `Managing Passwords`_ in the *Using IAM* guide.

.. _`Managing Passwords`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_ManagingLogins.html

Output
------

None
