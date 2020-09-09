.. _`Get Failed Operations by Object`:

Get Failed Operations by Object
===============================

This GET request retrieves a listing of all failed operations for a specific
object version. Use this operation to monitor a specific object’s replication
status.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /_/backbeat/api/crr/failed/<bucket>/<key>?versionId=<version-id>

Responses
---------

.. code::

  {
    IsTruncated: false,
    Versions: [{
      Bucket: <bucket>,
      Key: <key>,
      VersionId: <version-id>,
        StorageClass: <site>,
        Size: <size>,
        LastModified: <last-modified>,
    }]
  }

.. note::

   The marker query parameter is not supported for this route because
   replication rules including more than 1,000 sites are not anticipated.

