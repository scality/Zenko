.. _delete-object-tagging:

delete-object-tagging
=====================

Removes the tag-set from an existing object.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/DeleteObjectTagging>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  delete-object-tagging
    --bucket <value>
    --key <value>
    [--version-id <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--key`` (string)

``--version-id`` (string)

  The versionId of the object that the tag-set will be removed from.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Output
------

VersionId -> (string)

  The versionId of the object the tag-set was removed from.
