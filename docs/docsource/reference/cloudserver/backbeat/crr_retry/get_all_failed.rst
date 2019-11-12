.. _`Get All Failed Operations`:

Get All Failed Operations
=========================

This GET request retrieves a listing of failed operations at a site. Use this
operation to learn if any CRR operations have failed at the site, and to
retrieve the entire listing.

Requests 
---------

Syntax
~~~~~~

.. code::

   GET /_/backbeat/api/crr/failed?sitename=<site>&marker=<next-marker>

Responses
---------

Non-Truncated
~~~~~~~~~~~~~

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

Truncated
~~~~~~~~~

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

