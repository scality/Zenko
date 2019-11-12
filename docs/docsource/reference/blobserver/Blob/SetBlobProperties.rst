.. _Set Blob Properties:

Set Blob Properties
===================

The Set Blob Properties operation sets system properties on the blob.

Request
-------

The Set Blob Properties request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+---------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                               | HTTP Version |
   +========+===========================================================================+==============+
   | PUT    | ``https://myaccount.blob.example.com/mycontainer/myblob?comp=properties`` | HTTP/1.1     |
   +--------+---------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +-------------+--------------------------------------------------------------+
   | Parameter   | Description                                                  |
   +=============+==============================================================+
   | ``timeout`` | Optional. The ``timeout`` parameter is expressed in seconds. |
   |             | For more information, see |set-blob-timeouts|.               |
   +-------------+--------------------------------------------------------------+


Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.35\textwidth}X{0.60\textwidth}
.. table::
   :class: longtable

   +-----------------------------------+-----------------------------------+
   | Request Header                    | Description                       |
   +===================================+===================================+
   | ``Authorization``                 | Required. Specifies the           |
   |                                   | authorization scheme, account     |
   |                                   | name, and signature. For more     |
   |                                   | information, see                  |
   |                                   | |authorize-requests|.             |
   +-----------------------------------+-----------------------------------+
   | ``Date`` or ``x-ms-date``         | Required. Specifies the           |
   |                                   | Coordinated Universal Time (UTC)  |
   |                                   | for the request. For more         |
   |                                   | information, see                  |
   |                                   | |authorize-requests|.             |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-version``                  | Required for all authorized       |
   |                                   | requests. Specifies the version   |
   |                                   | of the operation to use for this  |
   |                                   | request. For more information,    |
   |                                   | see |azure-versioning|.           |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-cache-control``       | Optional. Modifies the cache      |
   |                                   | control string for the blob.      |
   |                                   | If this property is not specified |
   |                                   | in the request, the property is   |
   |                                   | cleared for the blob. Subsequent  |
   |                                   | Get Blob Properties calls cannot  |
   |                                   | return this property until it is  |
   |                                   | explicitly set on the blob again. |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-type``        | Optional. Sets the blob's         |
   |                                   | content type. If this property is |
   |                                   | not specified in the request, the |
   |                                   | property is cleared for the blob. |
   |                                   | Subsequent calls to Get Blob      |
   |                                   | Properties cannot return this     |
   |                                   | property until it is explicitly   |
   |                                   | set on the blob again.            |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-md5``         | Optional. Sets the blob's MD5     |
   |                                   | hash.                             |
   |                                   | If this property is not specified |
   |                                   | in the request, the property is   |
   |                                   | cleared for the blob. Subsequent  |
   |                                   | calls to Get Blob Properties      |
   |                                   | cannot return this property until |
   |                                   | is explicitly set on the blob     |
   |                                   | again.                            |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-encoding``    | Optional. Sets the blob's content |
   |                                   | encoding.                         |
   |                                   | If this property is not specified |
   |                                   | in the request, the property is   |
   |                                   | cleared for the blob. Subsequent  |
   |                                   | calls to Get Blob Properties      |
   |                                   | cannot return this property,      |
   |                                   | until it is explicitly set on the |
   |                                   | blob again.                       |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-blob-content-language``    | Optional. Sets the blob's content |
   |                                   | language.                         |
   |                                   | If this property is not specified |
   |                                   | in the request, the property is   |
   |                                   | cleared for the blob. Subsequent  |
   |                                   | calls to Get Blob Properties      |
   |                                   | cannot return this property until |
   |                                   | it is explicitly set on the blob  |
   |                                   | again.                            |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-lease-id``                 | Not applicable (Zenko version     |
   |                                   | |version| does not support        |
   |                                   | leasing).                         |
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

This operation also supports the use of conditional headers to set blob
properties only if a specified condition is met. For more information, see
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

.. tabularcolumns:: X{0.40\textwidth}X{0.55\textwidth}
.. table::
   :class: longtable

   +---------------------------------------+---------------------------------------------+
   | Syntax                                | Description                                 |
   +=======================================+=============================================+
   | ``ETag``                              | ETag contains a value that you              |
   |                                       | can use to perform operations               |
   |                                       | conditionally. See                          |
   |                                       | |conditional-headers| for more              |
   |                                       | information. The ETag value will            |
   |                                       | be in quotes.                               |
   +---------------------------------------+---------------------------------------------+
   | ``Last-Modified``                     | The date/time that the blob was             |
   |                                       | last modified. The date format              |
   |                                       | follows RFC 1123. For more                  |
   |                                       | information, see |date-time-headers|.       |
   |                                       | Any write operation on the blob             |
   |                                       | (including updates on the blob's            |
   |                                       | metadata or properties) changes             |
   |                                       | the last modified time of the               |
   |                                       | blob.                                       |
   +---------------------------------------+---------------------------------------------+
   | ``x-ms-blob-sequence-number``         | Not applicable.                             |
   +---------------------------------------+---------------------------------------------+
   | ``x-ms-request-id``                   | This header uniquely identifies             |
   |                                       | the request that was made and can           |
   |                                       | be used for troubleshooting the             |
   |                                       | request. For more information,              |
   |                                       | see |api-troubleshoot|.                     |
   +---------------------------------------+---------------------------------------------+
   | ``x-ms-version``                      | Indicates the version of the Blob           |
   |                                       | service used to execute the                 |
   |                                       | request.                                    |
   +---------------------------------------+---------------------------------------------+
   | ``Date``                              | A UTC date/time value generated             |
   |                                       | by the service that indicates when          |
   |                                       | the response was initiated.                 |
   +---------------------------------------+---------------------------------------------+
   | ``Access-Control-Allow-Origin``       | Returned if the request includes            |
   |                                       | an ``Origin`` header and CORS is            |
   |                                       | enabled with a matching rule.               |
   |                                       | This header returns the value of            |
   |                                       | the origin request header in case           |
   |                                       | of a match.                                 |
   +---------------------------------------+---------------------------------------------+
   | ``Access-Control-Expose-Headers``     | Returned if the request includes            |
   |                                       | an ``Origin`` header and CORS is            |
   |                                       | enabled with a matching rule.               |
   |                                       | Returns the list of response                |
   |                                       | headers that are to be exposed to           |
   |                                       | the client or issuer of the                 |
   |                                       | request.                                    |
   +---------------------------------------+---------------------------------------------+
   | ``Access-Control-Allow-\Credentials`` | Returned if the request includes            |
   |                                       | an ``Origin`` header and CORS is            |
   |                                       | enabled with a matching rule that           |
   |                                       | does not allow all origins. This            |
   |                                       | header will be set to true.                 |
   +---------------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``            | This header can be used to                  |
   |                                       | troubleshoot requests and                   |
   |                                       | corresponding responses. The                |
   |                                       | value of this header is equal to            |
   |                                       | the value of the                            |
   |                                       | ``x-ms-client-request-id`` header           |
   |                                       | if it is present in the request             |
   |                                       | and the value is at most 1024               |
   |                                       | visible ASCII characters. If the            |
   |                                       | ``x-ms-client-request-id`` header           |
   |                                       | is not present in the request,              |
   |                                       | this header will not be present             |
   |                                       | in the response.                            |
   +---------------------------------------+---------------------------------------------+

Response Body
~~~~~~~~~~~~~

None

Authorization
~~~~~~~~~~~~~

This operation can only be called by the account owner and by anyone with a
Shared Access Signature that has permission to write to this blob or its
container.

Remarks
-------

The semantics for updating a blob's properties are as follows:

-  If a request sets only ``x-ms-blob-sequence-number`` and/or
   ``x-ms-content-length``, and no other properties, then none of
   the blob's other properties are modified.

- If any of the following properties is set in the request, then all of these
   properties are set together. If a value is not provided for a given property
   when at least one of the properties listed below is set, then that property
   is cleared for the blob.

   -  ``x-ms-blob-cache-control``

   -  ``x-ms-blob-content-type``

   -  ``x-ms-blob-content-md5``

   -  ``x-ms-blob-content-encoding``

   -  ``x-ms-blob-content-language``

   -  ``x-ms-blob-content-disposition``

.. note::

   For a shared access signature, you can override certain properties stored for
   the blob by specifying query parameters as part of the shared access
   signature. These properties include the ``cache-control``, ``content-type``,
   ``content-encoding``, ``content-language``, and ``content-disposition``
   properties. For more information, see |create-sas|.
