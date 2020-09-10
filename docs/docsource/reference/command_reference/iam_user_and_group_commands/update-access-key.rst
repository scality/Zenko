.. _update-access-key:

update-access-key
=================

Changes the specified access key's status from active to inactive or
vice-versa. You can use this operation to disable a user's key as part of a
key-rotation workflow.

If ``UserName`` is not specified, the user name is assumed based on the AWS
access key ID used to sign the request. This operation works for access keys
under the AWS account. Consequently, you can use this operation to manage AWS
account root user credentials even if the AWS account has no associated users.

For information about rotating keys, see `Managing Keys and Certificates
<https://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingCredentials.html>`__
in the *IAM User Guide*.

See also: :ref:`UpdateAccessKey`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  update-access-key
    [--user-name <value>]
    --access-key-id <value>
    --status <value>
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the user whose key you want to update.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper- and lower-case alphanumeric characters with no spaces. You
  can also include any of the following characters: "_", "+", "=", ",", ".",
  "@", and "-".

``--access-key-id`` (string)

  The access key ID of the secret access key you want to update.

  This parameter allows (through its regex pattern) a string of characters that
  can consist of any upper- or lower-cased letter or digit.

``--status`` (string)

  The status you want to assign to the secret access key. ``Active`` means that
  the key can be used for API calls to Zenko, while ``Inactive`` means
  that the key cannot be used.

  Possible values:
  
  *   ``Active``
  
  *   ``Inactive``

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To activate or deactivate an access key for an IAM user**

The following ``update-access-key`` command deactivates the specified access key
(access key ID and secret access key) for the IAM user named ``Bob``::

  aws iam update-access-key --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive --user-name Bob

Deactivating a key means that it cannot be used for access to AWS. However, the
key remains available and can be reactivated.

Output
------

None
