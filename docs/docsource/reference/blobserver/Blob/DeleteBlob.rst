Delete Blob
===========

The Delete Blob operation marks the specified blob for deletion. The blob is
later deleted during garbage collection.

Request
-------

The Delete Blob request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.15\textwidth}X{0.65\textwidth}X{0.15\textwidth}
.. table::

   +--------+-----------------------------------------------------------+--------------+
   | Method | Request URI                                               | HTTP Version |
   +========+===========================================================+==============+
   | DELETE | ``https://myaccount.blob.example.com/mycontainer/myblob`` | HTTP/1.1     |
   +--------+-----------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +--------------+------------------------------------------------------------+
   | Parameter    | Description                                                |
   +==============+============================================================+
   | ``snapshot`` | Not applicable (Zenko version |version| does not support   |
   |              | snapshots).                                                |
   +--------------+------------------------------------------------------------+
   | ``timeout``  | Optional. The ``timeout`` parameter is expressed in        |
   |              | seconds. For more information, see |set-blob-timeouts|.    |
   +--------------+------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.40\textwidth}X{0.55\textwidth}
.. table::

   +--------------------------------------------+---------------------------------------------+
   | Request Header                             | Description                                 |
   +============================================+=============================================+
   | ``Authorization``                          | Required. Specifies the                     |
   |                                            | authorization scheme, account               |
   |                                            | name, and signature. For more               |
   |                                            | information, see |authorize-requests|.      |
   +--------------------------------------------+---------------------------------------------+
   | ``Date`` or ``x-ms-date``                  | Required. Specifies the                     |
   |                                            | Coordinated Universal Time (UTC)            |
   |                                            | for the request. For more                   |
   |                                            | information, see |authorize-requests|.      |
   +--------------------------------------------+---------------------------------------------+
   | ``x-ms-version``                           | Required for all authorized                 |
   |                                            | requests. For more information,             |
   |                                            | see |azure-versioning|.                     |
   +--------------------------------------------+---------------------------------------------+
   | ``x-ms-lease-id``                          | Not applicable (Zenko version |version|     |
   |                                            | does not support leasing).                  |
   +--------------------------------------------+---------------------------------------------+
   | ``x-ms-delete-snapshots``                  | Not applicable (Zenko version |version|     |
   |                                            | does not support snapshots).                |
   +--------------------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``                 | Optional. Provides a client-generated,      |
   |                                            | opaque value  with a 1 KB character limit   |
   |                                            | that is recorded in the analytics logs      |
   |                                            | when storage analytics logging is enabled.  |
   |                                            | Use this header for correlating client-side |
   |                                            | activities with requests received           |
   |                                            | by the server. For more information, see    |
   |                                            | |analytics-log| and |storage-tracking|.     |
   +--------------------------------------------+---------------------------------------------+

This operation also supports the use of conditional headers to delete the blob
only if a specified condition is met. For more information, see
|conditional-headers|.

Request Body
~~~~~~~~~~~~

None

Response
--------

The response includes an HTTP status code and a set of response headers.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 202 (Accepted).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +--------------------------------+---------------------------------------------------------------+
   | Response Header                | Description                                                   |
   +================================+===============================================================+
   | ``x-ms-request-id``            | This header uniquely identifies the request that was made and |
   |                                | can be used for troubleshooting the request. For more         |
   |                                | information, see |api-troubleshoot|.                          |
   +--------------------------------+---------------------------------------------------------------+
   | ``x-ms-version``               | Indicates the version of the Blob service used to execute the |
   |                                | request.                                                      |
   +--------------------------------+---------------------------------------------------------------+
   | ``x-ms-delete-type-permanent`` | Blob Service returns true when blob is permanently deleted.   |
   +--------------------------------+---------------------------------------------------------------+
   | ``Date``                       | A UTC date/time value generated by the service that indicates |
   |                                | the time at which the response was initiated.                 |
   +--------------------------------+---------------------------------------------------------------+
   | ``x-ms-client-request-id``     | This header can be used to troubleshoot requests and          |
   |                                | corresponding responses. The value of this header is equal to |
   |                                | the value of the ``x-ms-client-request-id`` header if it is   |
   |                                | present in the request and the value is at most 1024 visible  |
   |                                | ASCII characters. If the ``x-ms-client-request-id`` header is |
   |                                | not present in the request, this header will not be present   |
   |                                | in the response.                                              |
   +--------------------------------+---------------------------------------------------------------+

Authorization
~~~~~~~~~~~~~

This operation can be performed by the account owner or by anyone using a Shared
Access Signature that has permission to delete the blob.

Remarks
-------

The client may call Delete Blob to delete uncommitted blobs. An uncommitted blob
is a blob created with calls to the Put Block operation but never committed
using the Put Block List operation.

Soft Delete Feature Disabled
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When a blob is successfully deleted, it is immediately removed from the storage
account's index and is no longer accessible to clients. The blob's data is
later removed from the service during garbage collection.

Soft Delete Feature Enabled
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. note::

   Zenko version |version| does not support the soft-delete feature.

When a blob is successfully deleted, it is soft-deleted and is no longer
accessible to clients. The Blob service retains the blob for the number of days
specified in the Blob service's ``DeleteRetentionPolicy`` property. For
information about reading Blob service properties, see :ref:`Set Blob Service
Properties`.

After the specified number of days, the blob's data is removed from the service
during garbage collection. A soft-deleted blob is accessible by calling the List
Blobs operation and specifying the ``include=deleted`` option.

For any other blob soft-delete operations, Blob Service returns error 404
(ResourceNotFound).
