.. _create-login-profile:

create-login-profile
====================

Creates a password for the specified user, giving the user the ability to access
AWS services through the AWS Management Console. For more information about
managing passwords, see `Managing Passwords
<https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_ManagingLogins.html>`__
in the *IAM User Guide*.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/CreateLoginProfile>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

 create-login-profile
    --user-name <value>
    --password <value>
    [--password-reset-required | --no-password-reset-required]
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the IAM user to create a password for. The user must already
  exist.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--password`` (string)

  The new password for the user.

  The regex pattern that is used to
  validate this parameter is a string of characters. That string can include
  almost any printable ASCII character from the space (\u0020) through the end
  of the ASCII character range (\u00FF). You can also include the tab (\u0009),
  line feed (\u000A), and carriage return (\u000D) characters. Any of these
  characters are valid in a password. However, many tools, such as the AWS
  Management Console, might restrict the ability to type certain characters
  because they have special meaning within that tool.

``--password-reset-required`` | ``--no-password-reset-required`` (boolean)

  Specifies whether the user is required to set a new password on next sign-in.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To create a password for an IAM user**

To create a password for an IAM user, use the ``--cli-input-json`` parameter to
pass a JSON file that contains the password. Using this method, you can create a
strong password with non-alphanumeric characters. It can be difficult to create
a password with non-alphanumeric characters when you pass it as a command line
parameter.

.. tip::
   
   Go to the Amazon Web Services API and use the ``create-login-profile``
   command with the ``--generate-cli-skeleton`` parameter, as in the following
   example::

     aws iam create-login-profile --generate-cli-skeleton > create-login-profile.json

   This creates a file, create-login-profile.json, which you can use to fill in
   the information for a subsequent ``create-login-profile`` command. For example::

     {
       "UserName": "Bob",
       "Password": "&1-3a6u:RA0djs",
       "PasswordResetRequired": true
     }

Next, to create a password for an IAM user, use the ``create-login-profile``
command again, this time passing the ``--cli-input-json`` parameter to specify
your JSON file. The following ``create-login-profile`` command uses the
``--cli-input-json`` parameter with a JSON file called
create-login-profile.json::

  aws iam create-login-profile --cli-input-json file://create-login-profile.json

Output::

  {
      "LoginProfile": {
          "UserName": "Bob",
          "CreateDate": "2015-03-10T20:55:40.274Z",
          "PasswordResetRequired": true
      }
  }

If the new password violates the account password policy, the command returns a
``PasswordPolicyViolation`` error.

To change the password for a user that already has one, use
``update-login-profile``. To set a password policy for the account, use the
``update-account-password-policy`` command.

If the account password policy allows them to, IAM users can change their own
passwords using the ``change-password`` command.

For more information, see `Managing Passwords for IAM Users`_ in the *Using IAM*
guide.

.. _`Managing Passwords for IAM Users`: http://docs.aws.amazon.com/IAM/latest/UserGuide/credentials-add-pwd-for-user.html

Output
------

LoginProfile -> (structure)

  A structure containing the user name and password create date.

  UserName -> (string)

    The name of the user, which can be used for signing in to the AWS Management
    Console.

  CreateDate -> (timestamp)

    The date when the password for the user was created.

  PasswordResetRequired -> (boolean)

    Specifies whether the user is required to set a new password on next sign-in.
