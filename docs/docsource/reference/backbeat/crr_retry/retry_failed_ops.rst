.. _`Retry Failed Operations`:

Retry Failed Operations
=======================

This POST request retries a set of failed operations.

Requests
--------

Header
~~~~~~

.. code::

   POST /_/backbeat/api/crr/failed

Body
~~~~

.. code::

  [{
    Bucket: <bucket>,
    Key: <key>,
    VersionId: <version-id>,
    StorageClass: <site>,
  }]

Response
--------

.. code::

  [{
    Bucket: <bucket>,
    Key: <key>,
    VersionId: <version-id>,
    StorageClass: <site>,
    Size: <size>,
    LastModified: <last-modified>,
    ReplicationStatus: 'PENDING',
  }]
