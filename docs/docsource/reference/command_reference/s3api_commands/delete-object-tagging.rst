.. _delete-object-tagging:

delete-object-tagging
=====================

Removes the tag-set from an existing object.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/DeleteObjectTagging>`_.

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

  .. include:: ../../../include/cli-input-json.txt

Output
------

VersionId -> (string)

  The versionId of the object the tag-set was removed from.
