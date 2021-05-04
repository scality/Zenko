.. _create-access-key:

create-access-key
=================

Creates a new secret access key and corresponding access key ID for the
specified user. The default status for new keys is ``Active``.

If you do not specify a user name, the user name is determined implicitly based
on the access key ID signing the request. This operation works for access keys
under the |product| account. Consequently, you can use this operation to manage
|product| account root user credentials. This is true even if the account
has no associated users.

For information about limits on the number of keys you can create, see
`Limitations on IAM Entities
<https://docs.aws.amazon.com/IAM/latest/UserGuide/LimitationsOnEntities.html>`__
in the *IAM User Guide* .

.. warning::

   To ensure account security, the secret access key is accessible only during
   key and user creation. You must save the key (for example, in a text file) if
   to access it again. If you lose a secret key, you can delete the access keys
   for the associated user and create new keys.

See also: :ref:`CreateAccessKey` for documentation on the associated API.


Synopsis
--------

::

  create-access-key
    [--user-name <value>]
    [--cli-input-json <value>]
    [--generate-cli-skeleton <value>]

Options
-------

``--user-name`` (string)

  The name of the IAM user the new key will belong to.

  This parameter allows a string of characters consisting of upper and lowercase
  alphanumeric characters with no spaces. You can also include any of the
  following characters: "_", "+", "=", ",", ".", "@", and "-".

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values overrides the
  JSON-provided values. You cannot pass arbitrary binary values using a
  JSON-provided value as the string will be taken literally.

Examples
--------

.. note::

   If the ``user-name`` option is not specified, the user name is determined based
   on the AccessKeyId used to sign the request.
   
**To create an access key**

The following ``create-access-key`` command creates an access key (access key ID
and secret access key) for the user named ``Bob``

::

  aws iam create-access-key --user-name Bob

Output::

  {
      "AccessKey": {
          "UserName": "Bob",
          "Status": "Active",
          "CreateDate": "2015-03-09T18:39:23.411Z",
          "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY",
          "AccessKeyId": "AKIAIOSFODNN7EXAMPLE"
      }
  }

Store the secret access key securely. If you lose it, it cannot be recovered,
and you must create a new access key.

Output
------

AccessKey -> (structure)

  A structure with details about the access key.

UserName -> (string)

  The name of the user the access key is associated with.

AccessKeyId -> (string)

  The ID for this access key.

Status -> (string)

  The access key's status. ``Active`` means the key is valid for API
  calls. An ``Inactive`` key status means the key is not.

SecretAccessKey -> (string)

  The secret key used to sign requests.

CreateDate -> (timestamp)

  The date the access key was created.
