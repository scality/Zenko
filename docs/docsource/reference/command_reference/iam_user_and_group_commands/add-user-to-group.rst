.. _add-user-to-group:

add-user-to-group
=================

Adds the specified user to the specified group.

See :ref:`AddUserToGroup` for API information

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

   add-user-to-group
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

  The name of the user to add.

  This parameter allows (through its regex pattern)
  a string of characters consisting of
  upper and lowercase alphanumeric characters with no spaces. You can also
  include any of the following characters: ``_``, ``+``, ``=``, ``,``, ``.``,
  ``@``, and ``-``.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

**To add a user to an IAM group**

The following ``add-user-to-group`` command adds an IAM user named ``Bob`` to
the IAM group named ``Admins``::

  aws iam add-user-to-group --user-name Bob --group-name Admins

For more information, see `Adding and Removing Users in an IAM Group`_ in the
*Using IAM* guide.

.. _`Adding and Removing Users in an IAM Group`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_AddOrRemoveUsersFromGroup.html

Output
------

None
