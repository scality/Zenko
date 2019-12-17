.. _Get Blob Metadata:

Get Blob Metadata
=================

The Get Blob Metadata operation returns all user-defined metadata for the
specified blob.

Request
-------

The Get Blob Metadata request may be constructed as follows.  HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.15\textwidth}X{0.65\textwidth}X{0.15\textwidth}
.. table::

   +-------------+-------------------------------------------------------------------------+--------------+
   | Method      | Request URI                                                             | HTTP Version |
   +=============+=========================================================================+==============+
   | GET or HEAD | ``https://myaccount.blob.example.com/mycontainer/myblob?comp=metadata`` | HTTP/1.1     |
   +-------------+-------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +--------------+----------------------------------------------------------------+
   | Parameter    | Description                                                    |
   +==============+================================================================+
   | ``snapshot`` | Not applicable (Zenko version |version| does not support       |
   |              | snapshots).                                                    |
   +--------------+----------------------------------------------------------------+
   | ``timeout``  | Optional. The ``timeout`` parameter is expressed in seconds.   |
   |              | For more information, see |set-blob-timeouts|.                 |
   +--------------+----------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +-----------------------------------+---------------------------------------------+
   | Request Header                    | Description                                 |
   +===================================+=============================================+
   | ``Authorization``                 | Required. Specifies the                     |
   |                                   | authorization scheme, account               |
   |                                   | name, and signature. For more               |
   |                                   | information, see |authorize-requests|.      |
   +-----------------------------------+---------------------------------------------+
   | ``Date`` or ``x-ms-date``         | Required. Specifies the                     |
   |                                   | Coordinated Universal Time (UTC)            |
   |                                   | for the request. For more                   |
   |                                   | information, see |authorize-requests|.      |
   +-----------------------------------+---------------------------------------------+
   | ``x-ms-version``                  | Required for all authorized                 |
   |                                   | requests, optional for anonymous            |
   |                                   | requests. Specifies the version             |
   |                                   | of the operation to use for this            |
   |                                   | request. For more information,              |
   |                                   | see |azure-versioning|.                     |
   +-----------------------------------+---------------------------------------------+
   | ``x-ms-lease-id``                 | Not applicable. Zenko version |version|     |
   |                                   | does not support leasing).                  |
   +-----------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``        | Optional. Provides a                        |
   |                                   | client-generated, opaque value              |
   |                                   | with a 1 KB character limit that            |
   |                                   | is recorded in the analytics logs           |
   |                                   | when storage analytics logging is           |
   |                                   | enabled. Using this header is               |
   |                                   | highly recommended for correlating          |
   |                                   | client-side activities with requests        |
   |                                   | received by the server. For more            |
   |                                   | information, see |analytics-log| and        |
   |                                   | |storage-tracking|.                         |
   +-----------------------------------+---------------------------------------------+

This operation also supports the use of conditional headers to get the blob's
metadata operation only if a specified condition is met. For more information,
see |conditional-headers|.

Request Body
~~~~~~~~~~~~

None

Response
--------

The response includes an HTTP status code and a set of response headers.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 200 (OK).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.45\textwidth}X{0.50\textwidth}
.. table::

   +-----------------------------------+-----------------------------------+
   | Response Header                   | Description                       |
   +===================================+===================================+
   | ``x-ms-meta-name:value``          | Returns a metadata value for the  |
   |                                   | container.                        |
   +-----------------------------------+-----------------------------------+
   | ``Last-Modified``                 | The date/time that the blob was   |
   |                                   | last modified. The date format    |
   |                                   | follows RFC 1123. For more        |
   |                                   | information, see                  |
   |                                   | |date-time-headers|.              |
   |                                   | Any operation that modifies the   |
   |                                   | blob, including an update of the  |
   |                                   | blob's metadata or properties,    |
   |                                   | changes the last modified time of |
   |                                   | the blob.                         |
   +-----------------------------------+-----------------------------------+
   | ``ETag``                          | The ETag for the blob. The ETag   |
   |                                   | value will be in quotes.          |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-request-id``               | This header uniquely identifies   |
   |                                   | the request that was made and can |
   |                                   | be used for troubleshooting the   |
   |                                   | request. For more information,    |
   |                                   | see |api-troubleshoot|.           |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-version``                  | Indicates the version of the Blob |
   |                                   | service used to execute the       |
   |                                   | request.                          |
   +-----------------------------------+-----------------------------------+
   | ``Date``                          | A UTC date/time value generated   |
   |                                   | by the service that indicates     |
   |                                   | when the response was initiated.  |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-client-request-id``        | This header can be used to        |
   |                                   | troubleshoot requests and         |
   |                                   | corresponding responses. The      |
   |                                   | value of this header is equal to  |
   |                                   | the value of the                  |
   |                                   | ``x-ms-client-request-id`` header |
   |                                   | if it is present in the request   |
   |                                   | and the value is at most 1024     |
   |                                   | visible ASCII characters. If the  |
   |                                   | ``x-ms-client-request-id`` header |
   |                                   | is not present in the request,    |
   |                                   | this header will not be present   |
   |                                   | in the response.                  |
   +-----------------------------------+-----------------------------------+

Response Body
~~~~~~~~~~~~~

None

Authorization
~~~~~~~~~~~~~

This operation can be performed by the account owner or by anyone using a Shared
Access Signature that has permission to read the blob. If the container's ACL
is set to allow anonymous access, any client may call this operation.
