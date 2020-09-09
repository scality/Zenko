.. _delete-role:

delete-role
===========

Deletes the specified role. The role must not have any policies attached. For
more information about roles, go to `Working with Roles
<https://docs.aws.amazon.com/IAM/latest/UserGuide/WorkingWithRoles.html>`__.

.. warning::

  Make sure that you do not have any Amazon EC2 instances running with the role
  you are about to delete. Deleting a role or instance profile that is
  associated with a running instance will break any applications running on the
  instance.

See also: :ref:`DeleteRole`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-role
    --role-name <value>
    [--cli-input-json <value>]

Options
-------

``--role-name`` (string)

  The name of the role to delete.

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

**To delete an IAM role**

The following ``delete-role`` command removes the role named ``Test-Role``::

  aws iam delete-role --role-name Test-Role

Before you can delete a role, you must remove the role from any instance profile
(``remove-role-from-instance-profile``), detach any managed policies
(``detach-role-policy``) and delete any inline policies that are attached to the
role (``delete-role-policy``).

For more information, see `Creating a Role`_ and `Instance Profiles`_ in the
*Using IAM* guide.

.. _`Creating a Role`: http://docs.aws.amazon.com/IAM/latest/UserGuide/creating-role.html
.. _Instance Profiles: http://docs.aws.amazon.com/IAM/latest/UserGuide/instance-profiles.html

Output
------

None
