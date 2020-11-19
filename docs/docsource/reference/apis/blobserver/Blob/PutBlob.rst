.. _Put Blob:

Put Blob
========

The Put Blob operation creates a new block blob or updates the content of an
existing block blob.

Updating an existing block blob overwrites any existing metadata on the
blob. Partial updates are not supported with Put Blob; the content of the
existing blob is overwritten with the content of the new blob. To perform a
partial update of the content of a block blob, use the Put Block List operation.

Request
-------

Construct the Put Blob request as follows. HTTPS is recommended. Replace
``myaccount`` with the name of your storage account, and ``example.com`` with
your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+-----------------------------------------------------------+--------------+
   | Method | Request URI                                               | HTTP Version |
   +========+===========================================================+==============+
   | PUT    | ``https://myaccount.blob.example.com/mycontainer/myblob`` | HTTP/1.1     |
   +--------+-----------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +-------------+----------------------------------------------------------+
   | Parameter   | Description                                              |
   +=============+==========================================================+
   | ``timeout`` | Optional. The timeout parameter is expressed in seconds. |
   |             | For more information, see |set-blob-timeouts|.           |
   +-------------+----------------------------------------------------------+

Request Headers (All Blob Types)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following table describes required and optional request headers for all blob
types.

.. tabularcolumns:: X{0.45\textwidth}X{0.50\textwidth}
.. table::
   :class: longtable

   +-----------------------------------+-----------------------------------+
   | Request header                    | Description                       |
   +===================================+===================================+
   | ``Authorization``                 | Required. Specifies the           |
   |                                   | authorization scheme, account     |
   |                                   | name, and signature. For more     |
   |                                   | information, see Authorize        |
   |                                   | requests to Azure Storage.        |
   +-----------------------------------+-----------------------------------+
   | ``Date`` or ``x-ms-date``         | Required. Specifies the           |
   |                                   | Coordinated Universal Time (UTC)  |
   |                                   | for the request. For more         |
   |                                   | information, see Authorize        |
   |                                   | requests to Azure Storage.        |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-version``                  | Required for all authorized       |
   |                                   | requests. Specifies the version   |
   |                                   | of the operation to use for this  |
   |                                   | request. For more information,    |
   |                                   | see Versioning for the Azure      |
   |                                   | Storage Services.                 |
   +-----------------------------------+-----------------------------------+
   | ``Content-Length``                | Required. The length of the       |
   |                                   | request.                          |
   +-----------------------------------+-----------------------------------+
   | ``Content-Type``                  | Optional. The MIME content type   |
   |                                   | of the blob. The default type is  |
   |                                   | ``application/octet-stream``.     |
   +-----------------------------------+-----------------------------------+
   | ``Content-Encoding``              | Optional. Specifies which content |
   |                                   | encodings have been applied to    |
   |                                   | the blob. This value is returned  |
   |                                   | to the client when the Get Blob   |
   |                                   | operation is performed on the     |
   |                                   | blob resource. The client can use |
   |                                   | this value when returned to       |
   |                                   | decode the blob content.          |
   +-----------------------------------+-----------------------------------+
   | ``Content-Language``              | Optional. Specifies the natural   |
   |                                   | languages used by this resource.  |
   +-----------------------------------+-----------------------------------+
   | ``Content-MD5``                   | Optional. An MD5 hash of the blob |
   |                                   | content. This hash is used to     |
   |                                   | verify the integrity of the blob  |
   |                                   | during transport. When this       |
   |                                   | header is specified, the storage  |
   |                                   | service checks the hash that has  |
   |                                   | arrived with the one that was     |
   |                                   | sent. If the two hashes do not    |
   |                                   | match, the operation will fail    |
   |                                   | with error code 400 (Bad          |
   |                                   | Request).                         |
   |                                   | When omitted, the Blob            |
   |                                   | service generates an MD5 hash.    |
   |                                   | Results from Get Blob, Get Blob   |
   |                                   | Properties, and List Blobs        |
   |                                   | include the MD5 hash.             |
   +-----------------------------------+-----------------------------------+
   | ``Cache-Control``                 | Optional. The Blob service stores |
   |                                   | this value but does not use or    |
   |                                   | modify it.                        |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-type``        | Optional. Sets the blob's         |
   |                                   | content type.                     |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-encoding``    | Optional. Sets the blob's         |
   |                                   | content encoding.                 |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-language``    | Optional. Sets the blob's content |
   |                                   | language.                         |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-md5``         | Optional. Sets the blob's MD5     |
   |                                   | hash.                             |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-cache-control``       | Optional. Sets the blob's cache   |
   |                                   | control.                          |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-type: BlockBlob``     | Required. Specifies the type of   |
   |                                   | blob to create: block blob, page  |
   |                                   | blob, or append blob.             |
   |                                   |                                   |
   |                                   | .. note::                         |
   |                                   |                                   |
   |                                   |    XDM   version |version|        |
   |                                   |    supports block blobs only. Set |
   |                                   |    this value to ``BlockBlob``.   |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-meta-name:value``          | Optional. Name-value pairs        |
   |                                   | associated with the blob as       |
   |                                   | metadata. Metadata names must     |
   |                                   | adhere to the naming rules for C# |
   |                                   | identifiers.                      |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-lease-id``                 | Not applicable (XDM   |version|   |
   |                                   | does not support leasing).        |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-disposition`` | Optional. Sets the blob's         |
   |                                   | ``Content-Disposition`` header.   |
   |                                   | The ``Content-Disposition``       |
   |                                   | response header field conveys     |
   |                                   | additional information about how  |
   |                                   | to process the response payload,  |
   |                                   | and also can be used to attach    |
   |                                   | additional metadata. For example, |
   |                                   | if set to ``attachment``, it      |
   |                                   | indicates that the user-agent     |
   |                                   | should not display the response,  |
   |                                   | but instead show a **Save As**    |
   |                                   | dialog with a filename other than |
   |                                   | the blob name specified.          |
   |                                   | The response from the Get Blob    |
   |                                   | and Get Blob Properties           |
   |                                   | operations includes the           |
   |                                   | ``content-disposition`` header.   |
   +-----------------------------------+-----------------------------------+
   | ``Origin``                        | Optional. Specifies the origin    |
   |                                   | from which the request is issued. |
   |                                   | The presence of this header       |
   |                                   | results in cross-origin resource  |
   |                                   | sharing headers on the response.  |
   |                                   | See |cors-support| for details.   |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-client-request-id``        | Optional. Provides a              |
   |                                   | client-generated, opaque value    |
   |                                   | with a 1 KB character limit that  |
   |                                   | is recorded in the analytics logs |
   |                                   | when storage analytics logging is |
   |                                   | enabled. Using this header is     |
   |                                   | highly recommended for            |
   |                                   | correlating client-side           |
   |                                   | activities with requests received |
   |                                   | by the server. For more           |
   |                                   | information, see |analytics-log|  |
   |                                   | and |storage-tracking|.           |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-access-tier``              | Not applicable (XDM   version     |
   |                                   | |version| does not support        |
   |                                   | tiering).                         |
   +-----------------------------------+-----------------------------------+

This operation also supports the use of conditional headers to write the blob
only if a specified condition is met. For more information, see |conditional-headers|.

Request Body
~~~~~~~~~~~~

The request body contains the content of the blob.

Sample Request
~~~~~~~~~~~~~~

The following example shows a request to create a block blob:

   ::

      Request Syntax:
      PUT https://myaccount.blob.example.com/mycontainer/myblockblob HTTP/1.1

      Request Headers:
      x-ms-version: 2015-02-21
      x-ms-date: <date>
      Content-Type: text/plain; charset=UTF-8
      x-ms-blob-content-disposition: attachment; filename="fname.ext"
      x-ms-blob-type: BlockBlob
      x-ms-meta-m1: v1
      x-ms-meta-m2: v2
      Authorization: SharedKey myaccount:YhuFJjN4fAR8/AmBrqBz7MG2uFinQ4rkh4dscbj598g=
      Content-Length: 11

      Request Body:
      hello world


Response
--------

The response includes an HTTP status code and a set of response headers.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 201 (Created).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response can
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.45\textwidth}X{0.50\textwidth}
.. table::
   :class: longtable

   +-----------------------------------------------+---------------------------------------------+
   | Response Header                               | Description                                 |
   +===============================================+=============================================+
   | ``ETag``                                      | The ETag contains a value that              |
   |                                               | the client can use to perform               |
   |                                               | conditional ``PUT`` operations by           |
   |                                               | using the ``If-Match`` request              |
   |                                               | header. The ETag value will be in           |
   |                                               | quotes.                                     |
   +-----------------------------------------------+---------------------------------------------+
   | ``Last-Modified``                             | The date/time that the blob was             |
   |                                               | last modified. The date format              |
   |                                               | follows RFC 1123. For more                  |
   |                                               | information, see                            |
   |                                               | |date-time-headers|. Any write              |
   |                                               | operation on the blob                       |
   |                                               | (including updates on the blob's            |
   |                                               | metadata or properties) changes             |
   |                                               | the blob's last-modified time.              |
   +-----------------------------------------------+---------------------------------------------+
   | ``Content-MD5``                               | This header is returned for a               |
   |                                               | block blob so the client can                |
   |                                               | check the integrity of message              |
   |                                               | content. The ``Content-MD5``                |
   |                                               | value returned is computed by the           |
   |                                               | Blob service. This header                   |
   |                                               | is returned even when the request           |
   |                                               | does not include ``Content-MD5``            |
   |                                               | or ``x-ms-blob-content-md5``                |
   |                                               | headers.                                    |
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
   | ``Access-Control-Allow-Origin``               | Returned if the request includes            |
   |                                               | an ``Origin`` header and CORS is            |
   |                                               | enabled with a matching rule.               |
   |                                               | This header returns the value of            |
   |                                               | the origin request header in case           |
   |                                               | of a match.                                 |
   +-----------------------------------------------+---------------------------------------------+
   | ``Access-Control-Expose-Headers``             | Returned if the request includes            |
   |                                               | an ``Origin`` header and CORS is            |
   |                                               | enabled with a matching rule.               |
   |                                               | Returns the list of response                |
   |                                               | headers that are to be exposed to           |
   |                                               | the client or issuer of the                 |
   |                                               | request.                                    |
   +-----------------------------------------------+---------------------------------------------+
   | ``Access-Control-Allow-Credentials``          | Returned if the request includes            |
   |                                               | an ``Origin`` header and CORS is            |
   |                                               | enabled with a matching rule that           |
   |                                               | does not allow all origins. This            |
   |                                               | header will be set to true.                 |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-request-server-encrypted: true/false`` | The value of this header is set             |
   |                                               | to ``true`` if the contents of              |
   |                                               | the request are successfully                |
   |                                               | encrypted using the specified               |
   |                                               | algorithm, and ``false``                    |
   |                                               | otherwise.                                  |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-encryption-key-sha256``                | This header is returned if the              |
   |                                               | request used a customer-provided            |
   |                                               | encryption key, so the client can           |
   |                                               | ensure the contents of the                  |
   |                                               | request are successfully                    |
   |                                               | encrypted using the provided key.           |
   +-----------------------------------------------+---------------------------------------------+

Response Body
~~~~~~~~~~~~~

None

Sample Response
~~~~~~~~~~~~~~~

   ::

      Response Status:
      HTTP/1.1 201 Created

      Response Headers:
      Transfer-Encoding: chunked
      Content-MD5: sQqNsWTgdUEFt6mb5y4/5Q==
      x-ms-content-crc64: 77uWZTolTHU
      Date: <date>
      ETag: "0x8CB171BA9E94B0B"
      Last-Modified: <date>
      Access-Control-Allow-Origin: http://contoso.com
      Access-Control-Expose-Headers: Content-MD5
      Access-Control-Allow-Credentials: True
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0

Authorization
~~~~~~~~~~~~~

This operation can be called by the account owner and by any client with a
shared access signature that has permission to write to this blob or its
container.

Remarks
-------

When you create a blob, you must specify the block blob type using the
``x-ms-blob-type`` header. Blobserver only supports the block blob type.

The maximum size for a block blob created via Put Blob is 256 MB. If your
blob is larger than 256 MB, you must upload it as a set of blocks. For more
information, see :ref:`Put Block` and :ref:`Put Block List`. Calling ``Put
Blob`` is unnecessary if you upload the blob as a set of blocks.

If you attempt to upload a block blob that is larger than 256 MB, the service
returns status code 413 (Request Entity Too Large). The Blob service also
returns additional information about the error in the response, including the
maximum blob size permitted in bytes.

A blob has custom properties (set via headers) that you can use to store values
associated with standard HTTP headers. These values can subsequently be read by
calling :ref:`Get Blob Properties`, or modified by calling :ref:`Set Blob
Properties`. The custom property headers and corresponding standard HTTP header
are listed in the following table:

.. tabularcolumns:: ll
.. table::

   +----------------------+--------------------------------+
   | HTTP Header          | Custom Blob Property Header    |
   +======================+================================+
   | ``Content-Type``     | ``x-ms-blob-content-type``     |
   +----------------------+--------------------------------+
   | ``Content-Encoding`` | ``x-ms-blob-content-encoding`` |
   +----------------------+--------------------------------+
   | ``Content-Language`` | ``x-ms-blob-content-language`` |
   +----------------------+--------------------------------+
   | ``Content-MD5``      | ``x-ms-blob-content-md5``      |
   +----------------------+--------------------------------+
   | ``Cache-Control``    | ``x-ms-blob-cache-control``    |
   +----------------------+--------------------------------+

The semantics for setting persisting these property values with the blob as
follows:

-  If the client specifies a custom property header, as indicated by the
   ``x-ms-blob`` prefix, this value is stored with the blob.

-  If the client specifies a standard HTTP header, but not the custom property
   header, the value is stored in the corresponding custom property associated
   with the blob, and is returned by a call to Get Blob Properties. For
   example, if the client sets the ``Content-Type`` header on the request, that
   value is stored in the blob's ``x-ms-blob-content-type`` property.

-  If the client sets both the standard HTTP header and the corresponding
   property header on the same request, the PUT request uses the value provided
   for the standard HTTP header, but the value specified for the custom property
   header is persisted with the blob and returned by subsequent GET requests.

A Put Blob operation is permitted 10 minutes per MB to complete. If the
operation takes longer than 10 minutes per MB on average, the operation
times out.
