.. _update-login-profile:

update-login-profile
====================

Changes the password for the specified IAM user.

IAM users can change their own passwords by calling ChangePassword. For more
information about modifying passwords, see `Managing Passwords
<https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_ManagingLogins.html>`__
in the *IAM User Guide* .

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/UpdateLoginProfile>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  update-login-profile
    --user-name <value>
    [--password <value>]
    [--password-reset-required | --no-password-reset-required]
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the user whose password you want to update.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--password`` (string)

  The new password for the specified IAM user.

  The regex pattern used to validate this
  parameter is a string of characters consisting of the following:

  * Any printable ASCII character ranging from the space character (\u0020)
    through the end of the ASCII character range

  * The printable characters in the Basic Latin and Latin-1 Supplement character
    set (through \u00FF)

  * The special characters tab (\u0009), line feed (\u000A), and carriage return
    (\u000D)

  However, the format can be further restricted by the account administrator by
  setting a password policy on the AWS account. For more information, see
  UpdateAccountPasswordPolicy .

``--password-reset-required`` | ``--no-password-reset-required`` (boolean)

  Allows this new password to be used only once by requiring the specified IAM
  user to set a new password on next sign-in.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To update the password for an IAM user**

The following ``update-login-profile`` command creates a new password for the
IAM user named ``Bob``::

  aws iam update-login-profile --user-name Bob --password <password>

To set a password policy for the account, use the
``update-account-password-policy`` command. If the new password violates the
account password policy, the command returns a ``PasswordPolicyViolation``
error.

If the account password policy allows them to, IAM users can change their own
passwords using the ``change-password`` command.

Store the password in a secure place. If the password is lost, it cannot be
recovered, and you must create a new one using the ``create-login-profile``
command.

For more information, see `Managing Passwords`_ in the *Using IAM* guide.

.. _`Managing Passwords`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_ManagingLogins.html

Output
------

None
