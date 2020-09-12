.. _delete-object:

delete-object
=============

Removes the null version (if there is one) of an object and inserts a delete
marker, which becomes the latest version of the object. If there isn't a null
version, Zenko does not remove any objects.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/DeleteObject>`_.

Synopsis
--------

::

  delete-object
    --bucket <value>
    --key <value>
    [--mfa <value>]
    [--version-id <value>]
    [--bypass-governance-retention | --no-bypass-governance-retention]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--key`` (string)

``--mfa`` (string)

  The concatenation of the authentication device's serial number, a space, and
  the value that is displayed on your authentication device.

``--version-id`` (string)

  VersionId used to reference a specific version of the object.

``--bypass-governance-retention`` | ``--no-bypass-governance-retention`` (Boolean)

  Indicates whether S3 object lock should bypass governance-mode restrictions to
  process this operation.

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command deletes an object named "test.txt" from a bucket named
"my-bucket"::

  aws s3api delete-object --bucket my-bucket --key test.txt

If bucket versioning is enabled, the output will contain the version ID of the
delete marker::

  {
    "VersionId": "9_gKg5vG56F.TTEUdwkxGpJ3tNDlWlGq",
    "DeleteMarker": true
  }

For more information about deleting objects, see `Deleting Objects`_ in the
*Amazon S3 Developer Guide*.

.. _`Deleting Objects`: http://docs.aws.amazon.com/AmazonS3/latest/dev/DeletingObjects.html

Output
------

DeleteMarker -> (Boolean)

  Specifies whether the versioned object that was permanently deleted was (true)
  or was not (false) a delete marker.

VersionId -> (string)

  Returns the version ID of the delete marker created as a result of the DELETE
  operation.
