.. _delete-access-key:

delete-access-key
=================

Deletes the access key pair associated with the specified IAM user.

If you do not specify a user name, IAM determines the user name implicitly based
on the AWS access key ID signing the request. This operation works for access
keys under the AWS account. Consequently, you can use this operation to manage
AWS account root user credentials even if the AWS account has no associated
users.

See also: :ref:`DeleteAccessKey`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-access-key
    [--user-name <value>]
    --access-key-id <value>
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the user whose access key pair you want to delete.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--access-key-id`` (string)

  The access key ID for the access key ID and secret access key you want to delete.

  This parameter allows (through its regex pattern) a string of characters that
  can consist of any upper or lowercased letter or digit.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided.  If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To delete an access key for an IAM user**

The following ``delete-access-key`` command deletes the specified access key
(access key ID and secret access key) for the IAM user named ``Bob``::

  aws iam delete-access-key --access-key AKIDPMS9RO4H3FEXAMPLE --user-name Bob

To list the access keys defined for an IAM user, use the ``list-access-keys``
command.

For more information, see `Creating, Modifying, and Viewing User Security
Credentials`_ in the *Using IAM* guide.

.. _`Creating, Modifying, and Viewing User Security Credentials`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_CreateAccessKey.html

Output
------

None
