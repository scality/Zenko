.. _get-login-profile:

get-login-profile
=================

Retrieves the user name and password-creation date for the specified IAM
user. If the user has not been assigned a password, the operation returns a 404
(``NoSuchEntity`` ) error.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/iam-2010-05-08/GetLoginProfile>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-login-profile
    --user-name <value>
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the user whose login profile you want to retrieve.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper- and lower-case alphanumeric characters with no
  spaces. You can also include any of the following characters: ``_``, ``+``,
  ``=``, ``,``, ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To get password information for an IAM user**

The following ``get-login-profile`` command gets information about the password
for the IAM user named ``Bob``::

  aws iam get-login-profile --user-name Bob

Output::

  {
      "LoginProfile": {
          "UserName": "Bob",
          "CreateDate": "2012-09-21T23:03:39Z"
      }
  }

The ``get-login-profile`` command can be used to verify that an IAM user has a
password. The command returns a ``NoSuchEntity`` error if no password is defined
for the user.

You cannot view a password using this command. If the password is lost, you can
reset the password (``update-login-profile``) for the user. Alternatively, you
can delete the login profile (``delete-login-profile``) for the user and then
create a new one (``create-login-profile``).

For more information, see `Managing Passwords`_ in the *Using IAM* guide.

.. _`Managing Passwords`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_ManagingLogins.html

Output
------

LoginProfile -> (structure)

  A structure containing the user name and password create date for the user.

  UserName -> (string)

    The name of the user, which can be used for signing in to the AWS Management
    Console.

  CreateDate -> (timestamp)

    The date when the password for the user was created.

  PasswordResetRequired -> (boolean)

    Specifies whether the user is required to set a new password on next sign-in.
