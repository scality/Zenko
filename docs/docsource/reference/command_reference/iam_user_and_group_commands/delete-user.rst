.. _delete-user:

delete-user
===========

Deletes the specified IAM user. Unlike the AWS Management Console, when you
delete a user programmatically, you must delete the items attached to the user
manually, or the deletion fails. For more information, see `Deleting an IAM User
<https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_manage.html#id_users_deleting_cli>`__. Before
attempting to delete a user, remove the following items:

* Password (DeleteLoginProfile)

* Access keys (DeleteAccessKey)

* Signing certificate (DeleteSigningCertificate)

* SSH public key (DeleteSSHPublicKey)

* Git credentials (DeleteServiceSpecificCredential)

* Multi-factor authentication (MFA) device (DeactivateMFADevice,
  DeleteVirtualMFADevice)

* Inline policies (DeleteUserPolicy)

* Attached managed policies (DetachUserPolicy)

* Group memberships (RemoveUserFromGroup)

See also: :ref:`Delete User`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-user
    --user-name <value>
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  The name of the user to delete.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided.  If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To delete an IAM user**

The following ``delete-user`` command removes the IAM user named ``Bob`` from
the current account::

  aws iam delete-user --user-name Bob

For more information, see `Deleting a User from Your AWS Account`_ in the *Using
IAM* guide.

.. _`Deleting a User from Your AWS Account`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_DeletingUserFromAccount.html

Output
------

None
