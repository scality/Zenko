.. _delete-access-key:

delete-access-key
=================

Deletes the access key pair associated with the specified user.

If you do not specify a user name, the user name is determined implicitly based
on the access key ID signing the request. This operation works for access keys
under the account. Consequently, you can use this operation to manage account
root user credentials even if the account has no associated users.

See also: :ref:`DeleteAccessKey`.

Synopsis
--------

::

  delete-access-key
    [--user-name <value>]
    --access-key-id <value>
    [--cli-input-json <value>]
    [--generate-cli-skeleton <value>]

Options
-------

``--user-name`` (string)

  The name of the user whose access key pair you will delete.

  This parameter allows a string of characters consisting of
  upper and lowercase alphanumeric characters with no spaces. You can also
  include any of the characters "_", "+", "=", ",", ".", "@", and "-".

``--access-key-id`` (string)

  The access key ID for the access key ID and secret access key to delete.

  This parameter allows a string of characters that can consist of any upper- or
  lower-case letter or digit.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values override the
  JSON-provided values. You cannot pass arbitrary binary values using a
  JSON-provided value as the string will be taken literally.

Examples
--------

.. note::

   If the ``user-name`` option is not specified, the user name is determined based
   on the AccessKeyId used to sign the request.
   
**To delete a user's access key**

The following ``delete-access-key`` command deletes the specified access key
(access key ID and secret access key) for the IAM user named ``Bob``::

  aws iam delete-access-key --access-key AKIDPMS9RO4H3FEXAMPLE --user-name Bob

To list the access keys defined for an IAM user, use the ``list-access-keys`` command.

Output
------

None
