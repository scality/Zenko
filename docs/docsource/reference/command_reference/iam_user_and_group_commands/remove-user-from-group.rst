.. _remove-user-from-group:

remove-user-from-group
======================

Removes the specified user from the specified group.

See also: :ref:`RemoveUserFromGroup`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  remove-user-from-group
    --group-name <value>
    --user-name <value>
    [--cli-input-json <value>]

Options
-------

``--group-name`` (string)

  The name of the group to update.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--user-name`` (string)

  The name of the user to remove.

  This parameter allows (through its regex pattern) a string of characters
  consisting of upper and lowercase alphanumeric characters with no spaces. You
  can also include any of the following characters: ``_``, ``+``, ``=``, ``,``,
  ``.``, ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To remove a user from an IAM group**

The following ``remove-user-from-group`` command removes the user named ``Bob``
from the IAM group named ``Admins``::

  aws iam remove-user-from-group --user-name Bob --group-name Admins

For more information, see `Adding Users to and Removing Users from a Group`_ in
the *Using IAM* guide.

.. _`Adding Users to and Removing Users from a Group`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_AddOrRemoveUsersFromGroup.html

Output
------

None
