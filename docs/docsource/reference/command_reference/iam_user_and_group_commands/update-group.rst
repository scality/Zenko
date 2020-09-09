.. _update-group:

update-group
============

Updates the name and/or the path of the specified IAM group.

.. important::

  Changing a group's path or name can carry unforeseen consequences. Study
  Amazon's description of `Identities (Users, Groups, and Roles)
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_WorkingWithGroupsAndUsers.html>`__
  and `Renaming an IAM Group`_ in the *IAM User Guide* before changing a group's
  path or name.

.. note::

  The person making the request (the principal) must have permission to change
  the role group with the old name and the new name. For example, to change the
  group named "Managers" to "MGRs", the principal must have a policy that allows
  them to update both groups. If the principal has permission to update the
  "Managers" group, but not the "MGRs" group, the update fails. For more on
  permissions, see `Access Management
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/access.html>`__ .

See also: :ref:`UpdateGroup`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

   update-group
     --group-name <value>
     [--new-path <value>]
     [--new-group-name <value>]
     [--cli-input-json <value>]

Options
-------

``--group-name`` (string)

  Name of the IAM group to update. If you are changing the name of the group,
  this is the original name.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper- and lower-case alphanumeric characters with no
  spaces. You can also include any of the following characters: "_", "+", "=",
  ",", ".", "@", and "-".

``--new-path`` (string)

  New path for the IAM group. Only include this if changing the group's path.

  This parameter allows (through its regex pattern) a string of characters
  consisting of either a forward slash (/) by itself or a string that must begin
  and end with forward slashes. In addition, it can contain any ASCII character
  from "!" (\u0021) through the DEL character (\u007F), including most
  punctuation characters, digits, and upper- and lower-cased letters.

``--new-group-name`` (string)

  New name for the IAM group. Only include this if changing the group's name.

  IAM user, group, role, and policy names must be unique within the
  account. Names are not distinguished by case. For example, you cannot create
  resources named both "MyResource" and "myresource".

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.


See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To rename an IAM group**

The following ``update-group`` command changes the name of the IAM group
``Test`` to ``Test-1``::

  aws iam update-group --group-name Test --new-group-name Test-1

For more information, see `Renaming an IAM Group`_ in the *AWS Identity and
Access Management* user guide.

.. _`Renaming an IAM Group`: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups_manage_rename.html


Output
------

None
