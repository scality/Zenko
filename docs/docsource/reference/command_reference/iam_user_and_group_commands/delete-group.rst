.. _delete-group:

delete-group
============

Deletes the specified IAM group. The group must not contain any users or have
any attached policies.

See also: :ref:`DeleteGroup`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-group
    --group-name <value>
    [--cli-input-json <value>]

Options
-------

``--group-name`` (string)

  The name of the IAM group to delete.

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

**To delete an IAM group**

The following ``delete-group`` command deletes an IAM group named ``MyTestGroup``::

  aws iam delete-group --group-name MyTestGroup

For more information, see `Deleting an IAM Group`_ in the *Using IAM* guide.

.. _`Deleting an IAM Group`: http://docs.aws.amazon.com/IAM/latest/UserGuide/Using_DeleteGroup.html

Output
------

None
