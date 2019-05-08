CRR Retry
=========

The CRR Retry feature lets users monitor and retry failed CRR operations,
enabling them to retrieve a list of failed operations and to retry
specific CRR operations.

CRR Retry API
-------------

Get All Failed Operations
~~~~~~~~~~~~~~~~~~~~~~~~~

This GET request retrieves a listing of failed operations at a site. Use
this operation to learn if any CRR operations have failed at the site,
and to retrieve the entire listing.

**Request:** GET /_/backbeat/api/_/crr/failed?sitename=<site>&marker=<next-marker>

**Non-Truncated Response**

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

**Truncated Response**

.. code::

  {
    IsTruncated: true,
    NextMarker: <next-marker>,
    Versions: [{
      Bucket: <bucket>,
      Key: <key>,
      VersionId: <version-id>,
      StorageClass: <site>,
      Size: <size>,
      LastModified: <last-modified>,
    },
    ...
    ]
  }

Get Failed Operations by Objects
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This GET request retrieves a listing of all failed operations for a
specific object version. Use this operation to monitor a specific
object’s replication status.

**Request:** GET /_/backbeat/api/_/crr/failed/<bucket>/<key>?versionId=<version-id>

**Response**

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

  The marker query parameter is not supported for this route because we do
  not foresee any replication rule including more than 1,000 sites.

Retry Failed Operations
~~~~~~~~~~~~~~~~~~~~~~~

This POST request retries a set of failed operations.

**Request:** POST /_/backbeat/api/_/crr/failed

**Request Body**

.. code::

  [{
    Bucket: <bucket>,
    Key: <key>,
    VersionId: <version-id>,
    StorageClass: <site>,
  }]

**Response**

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
