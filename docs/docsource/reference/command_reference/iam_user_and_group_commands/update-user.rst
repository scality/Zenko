.. _update-user:

update-user
===========

Updates the name and/or the path of the specified IAM user.

.. important::

   Changing an IAM user's path or name can carry unforeseen consequences. Study
   Amazon's description of `Renaming an IAM User
   <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_manage.html#id_users_renaming>`_
   and `Renaming an IAM Group
   <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups_manage_rename.html>`_
   before changing a user's name.

.. note::

  To change a user name, the requester must have appropriate permissions on both
  the source object and the target object. For example, to change "Bob" to
  "Robert", the entity making the request must have permissions for both Bob and
  Robert, or must have permission on all users (*). For more information about
  permissions, see `Policies and Permissions
  <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html>`_.

See also: :ref:`UpdateUser`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  update-user
    --user-name <value>
    [--new-path <value>]
    [--new-user-name <value>]
    [--cli-input-json <value>]

Options
-------

``--user-name`` (string)

  Name of the user to update. If you are changing the name of the user, this is
  the original user name.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: "_", "+", "=", ",", ".",
  "@", and "-".

``--new-path`` (string)

  New path for the IAM user. Include this parameter only when changing the
  user's path.

  This parameter allows (through its regex pattern) a string of characters
  consisting of either a forward slash (/) by itself or a string that must begin
  and end with forward slashes. In addition, it can contain any ASCII character
  from "!" (\u0021) through the DEL character (\u007F), including most
  punctuation marks, digits, and upper- and lower-cased letters.

``--new-user-name`` (string)

  New name for the user. Include this parameter only when changing the
  user name.

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

**To change an IAM user's name**

The following update-user command changes the name of the IAM user "Bob"
to "Robert"::

  aws iam update-user --user-name Bob --new-user-name Robert

Output
------

None
