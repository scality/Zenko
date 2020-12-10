.. _Set Blob Metadata:

Set Blob Metadata
=================

The ``Set Blob Metadata`` operation sets user-defined metadata for the specified
blob as one or more name-value pairs.

Request
-------

The ``Set Blob Metadata`` request may be constructed as follows.  HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+-------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                             | HTTP Version |
   +========+=========================================================================+==============+
   | PUT    | ``https://myaccount.blob.example.com/mycontainer/myblob?comp=metadata`` | HTTP/1.1     |
   +--------+-------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +-------------+-----------------------------------------------------------------------+
   | Parameter   | Description                                                           |
   +=============+=======================================================================+
   | ``timeout`` | Optional. The ``timeout`` parameter is expressed in seconds. For more |
   |             | information, see |set-blob-timeouts|.                                 |
   +-------------+-----------------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+--------------------------------------------------------+
   | Request Header             | Description                                            |
   +============================+========================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, account  |
   |                            | name, and signature. For more information, see         |
   |                            | |authorize-requests|.                                  |
   +----------------------------+--------------------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the Coordinated Universal Time     |
   |                            | (UTC) for the request. For more information, see       |
   |                            | |authorize-requests|.                                  |
   +----------------------------+--------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests. Specifies the    |
   |                            | version of the operation to use for this request. For  |
   |                            | more information, see |azure-versioning|.              |
   +----------------------------+--------------------------------------------------------+
   | ``x-ms-meta-name:value``   | Optional. Sets a name-value pair for the blob.         |
   |                            | Each call to this operation replaces all existing      |
   |                            | metadata attached to the blob. To remove all metadata  |
   |                            | from the blob, call this operation with no metadata    |
   |                            | headers. Metadata names must adhere to the naming      |
   |                            | rules for C# identifiers.                              |
   +----------------------------+--------------------------------------------------------+
   | ``x-ms-lease-id``          | Not applicable (|product| |version| does not support   |
   |                            | leasing).                                              |
   +----------------------------+--------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value    |
   |                            | with a 1 KB character limit that is recorded in the    |
   |                            | analytics logs when storage analytics logging is       |
   |                            | enabled. This header is useful for correlating         |
   |                            | client-side activities with requests received by the   |
   |                            | server. For more information, see |analytics-log| and  |
   |                            | |storage-tracking|.                                    |
   +----------------------------+--------------------------------------------------------+

This operation also supports the use of conditional headers to set blob metadata
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

A successful operation returns status code 200 (OK).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.45\textwidth}X{0.50\textwidth}
.. table::
   :class: longtable

   +-----------------------------------------------+---------------------------------------------+
   | Response Header                               | Description                                 |
   +===============================================+=============================================+
   | ``ETag``                                      | The ETag contains a value that              |
   |                                               | you can use to perform operations           |
   |                                               | conditionally. See                          |
   |                                               | |conditional-headers| for more              |
   |                                               | information. The ETag value will            |
   |                                               | be in quotes.                               |
   +-----------------------------------------------+---------------------------------------------+
   | ``Last-Modified``                             | The date/time that the blob was             |
   |                                               | last modified. The date format              |
   |                                               | follows RFC 1123. For more                  |
   |                                               | information, see                            |
   |                                               | |date-time-headers|. Any write              |
   |                                               | operation on the blob (including            |
   |                                               | updates on the blob's metadata              |
   |                                               | or properties) changes the last             |
   |                                               | modified time of the blob.                  |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-request-id``                           | This header uniquely identifies             |
   |                                               | the request that was made and can           |
   |                                               | be used for troubleshooting the             |
   |                                               | request. For more information,              |
   |                                               | see |api-troubleshoot|.                     |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-version``                              | Indicates the version of the Blob           |
   |                                               | service used to execute the                 |
   |                                               | request.                                    |
   +-----------------------------------------------+---------------------------------------------+
   | ``Date``                                      | A UTC date/time value generated             |
   |                                               | by the service that indicates the           |
   |                                               | time at which the response was              |
   |                                               | initiated.                                  |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-request-server-encrypted: true/false`` | The value of this header is set             |
   |                                               | to ``true`` if the contents of              |
   |                                               | the request are successfully                |
   |                                               | encrypted using the specified               |
   |                                               | algorithm, and ``false``                    |
   |                                               | otherwise.                                  |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``                    | This header can be used to                  |
   |                                               | troubleshoot requests and                   |
   |                                               | corresponding responses. The                |
   |                                               | value of this header is equal to            |
   |                                               | the value of the                            |
   |                                               | ``x-ms-client-request-id`` header           |
   |                                               | if it is present in the request             |
   |                                               | and the value is at most 1024               |
   |                                               | visible ASCII characters. If the            |
   |                                               | ``x-ms-client-request-id`` header           |
   |                                               | is not present in the request,              |
   |                                               | this header will not be present             |
   |                                               | in the response.                            |
   +-----------------------------------------------+---------------------------------------------+

Response Body
~~~~~~~~~~~~~

None

Authorization
~~~~~~~~~~~~~

This operation can be called by the account owner and by anyone with a Shared
Access Signature that has permission to write to this blob or its container.
