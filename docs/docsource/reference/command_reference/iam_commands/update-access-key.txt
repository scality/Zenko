.. _update-access-key:

update-access-key
=================

Changes the status of the specified access key from Active to Inactive, or vice
versa. This operation can be used to disable a user's key as part of a key
rotation workflow.

If the ``UserName`` is not specified, the user name is determined implicitly
based on the access key ID used to sign the request. This operation works for
access keys under the account. Consequently, you can use this operation to
manage the account root user's credentials even if the account has no
associated users.

For information about rotating keys, see `Managing Keys and Certificates
<https://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingCredentials.html>`__
in the *IAM User Guide*.

See also: :ref:`UpdateAccessKey`

Synopsis
--------

::

  update-access-key
    [--user-name <value>]
    --access-key-id <value>
    --status <value>
    [--cli-input-json <value>]
    [--generate-cli-skeleton <value>]

Options
-------

``--user-name`` (string)

  The name of the user whose key you will update.

  This parameter accepts a string of characters consisting of
  upper- and lower-case alphanumeric characters with no spaces. You can also
  include any of the characters "_", "+", "=", ",", ".", "@", and "-".

``--access-key-id`` (string)

  The access key ID of the secret access key you will update.

  This parameter allows a string of characters that can consist
  of any upper- or lower-case letter or digit.

``--status`` (string)

  The status to assign to the secret access key. ``Active`` means the key can be
  used for API calls to AWS; ``Inactive`` means the key cannot be used.

  Possible values:
  
  *   ``Active``
  *   ``Inactive``

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values override the
  JSON-provided values. You cannot pass arbitrary binary values using a
  JSON-provided value as the string is taken literally.

Examples
--------

**To activate or deactivate an access key for a user**

The following ``update-access-key`` command deactivates the specified access
key (access key ID and secret access key) for the IAM user named ``Bob``::

  aws iam update-access-key --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive --user-name Bob

Deactivating the key means it cannot be used for programmatic access to
AWS. However, the key is still available and can be reactivated.

For more information, see `Creating, Modifying, and Viewing User Security
Credentials`_ in the *Using IAM* guide.

.. _`Creating, Modifying, and Viewing User Security Credentials`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_CreateAccessKey.html

Output
------

None
