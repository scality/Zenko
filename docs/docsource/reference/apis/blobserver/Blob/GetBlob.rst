.. _Get Blob:

Get Blob
========

The Get Blob operation reads or downloads a blob from the system, including
its metadata and properties.

Request
-------

The Get Blob request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+-----------------------------------------------------------+--------------+
   | Method | Request URI                                               | HTTP Version |
   +========+===========================================================+==============+
   | GET    | ``https://myaccount.blob.example.com/mycontainer/myblob`` | HTTP/1.0     |
   +--------+-----------------------------------------------------------+--------------+

URI parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +--------------+---------------------------------------------------------------+
   | Parameter    | Description                                                   |
   +==============+===============================================================+
   | ``snapshot`` | Not applicable (|product| version |version| does not support  |
   |              | snapshots).                                                   |
   +--------------+---------------------------------------------------------------+
   | ``timeout``  | Optional. The ``timeout`` parameter is expressed in seconds.  |
   |              | For more information, see |set-blob-timeouts|.                |
   +--------------+---------------------------------------------------------------+


Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.40\textwidth}X{0.55\textwidth}
.. table::
   :class: longtable

   +----------------------------------------+-----------------------------------+
   | Request Header                         | Description                       |
   +========================================+===================================+
   | ``Authorization``                      | Required. Specifies the           |
   |                                        | authorization scheme, account     |
   |                                        | name, and signature. For more     |
   |                                        | information, see                  |
   |                                        | |authorize-requests|.             |
   +----------------------------------------+-----------------------------------+
   | ``Date`` or ``x-ms-date``              | Required. Specifies the           |
   |                                        | Coordinated Universal Time (UTC)  |
   |                                        | for the request. For more         |
   |                                        | information, see                  |
   |                                        | |authorize-requests|.             |
   +----------------------------------------+-----------------------------------+
   | ``x-ms-version``                       | Required for all authorized       |
   |                                        | requests, optional for anonymous  |
   |                                        | requests. Specifies the version   |
   |                                        | of the operation to use for this  |
   |                                        | request. For more information,    |
   |                                        | see |azure-versioning|.           |
   +----------------------------------------+-----------------------------------+
   | ``Range``                              | Optional. Return only the bytes   |
   |                                        | of the blob in the specified      |
   |                                        | range.                            |
   +----------------------------------------+-----------------------------------+
   | ``x-ms-range``                         | Optional. Return only the bytes   |
   |                                        | of the blob in the specified      |
   |                                        | range. If both ``Range`` and      |
   |                                        | ``x-ms-range`` are specified, the |
   |                                        | service uses the value of         |
   |                                        | ``x-ms-range``. If neither are    |
   |                                        | specified, the entire blob        |
   |                                        | contents are returned. See        |
   |                                        | |range-header| for more           |
   |                                        | information.                      |
   +----------------------------------------+-----------------------------------+
   | ``x-ms-lease-id``                      | Not applicable (|product| version |
   |                                        | |version| does not support        |
   |                                        | leasing).                         |
   +----------------------------------------+-----------------------------------+
   | ``x-ms-range-get-content-md5: true``   | Optional. When this header is set |
   |                                        | to ``true`` and specified         |
   |                                        | together with the ``Range``       |
   |                                        | header, the service returns the   |
   |                                        | MD5 hash for the range, as long   |
   |                                        | as the range is less than or      |
   |                                        | equal to 4 MB in size.            |
   |                                        | If this header is specified       |
   |                                        | without the ``Range`` header, the |
   |                                        | service returns status code 400   |
   |                                        | (Bad Request).                    |
   |                                        | If this header is set to ``true`` |
   |                                        | when the range exceeds 4 MB in    |
   |                                        | size, the service returns status  |
   |                                        | code 400 (Bad Request).           |
   +----------------------------------------+-----------------------------------+
   | ``Origin``                             | Optional. Specifies the origin    |
   |                                        | from which the request is issued. |
   |                                        | The presence of this header       |
   |                                        | results in cross-origin resource  |
   |                                        | sharing (CORS) headers on the     |
   |                                        | response.                         |
   +----------------------------------------+-----------------------------------+
   | ``x-ms-client-request-id``             | Optional. Provides a              |
   |                                        | client-generated, opaque value    |
   |                                        | with a 1 KB character limit that  |
   |                                        | is recorded in the analytics logs |
   |                                        | when storage analytics logging is |
   |                                        | enabled. Using this header is     |
   |                                        | highly recommended for            |
   |                                        | correlating client-side           |
   |                                        | activities with requests received |
   |                                        | by the server. For more           |
   |                                        | information, see |analytics-log|  |
   |                                        | and |storage-tracking|.           |
   +----------------------------------------+-----------------------------------+

This operation also supports the use of conditional headers to read the blob
only if a specified condition is met. For more information, see |conditional-headers|.

Request Body
~~~~~~~~~~~~

None

Response
--------

The response includes an HTTP status code, a set of response headers, and the
response body, which contains the contents of the blob.

Status Code
~~~~~~~~~~~

A successful operation to read the full blob returns status code 200 (OK).

A successful operation to read a specified range returns status code 206
(Partial Content).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.40\textwidth}X{0.55\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +-------------------------------------------------+---------------------------------------------------------+
   | Syntax                                          | Description                                             |
   +=================================================+=========================================================+
   | ``Last-Modified``                               | The date/time that the blob was last                    |
   |                                                 | modified. The date format follows RFC 1123.             |
   |                                                 | Any operation that modifies the blob,                   |
   |                                                 | including an update of the blob's metadata or           |
   |                                                 | properties, changes the last-modified time of           |
   |                                                 | the blob.                                               |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-creation-time``                          | The date and time the blob was created. The             |
   |                                                 | date format follows RFC 1123.                           |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-meta-name:value``                        | A set of name-value pairs associated with               |
   |                                                 | this blob as user-defined metadata.                     |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Content-Length``                              | The number of bytes present in the response             |
   |                                                 | body.                                                   |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Content-Type``                                | The content type specified for the blob. The            |
   |                                                 | default content type is ``application/octet-stream``.   |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Content-Range``                               | Indicates the range of bytes returned if the            |
   |                                                 | client requested a subset of the blob by                |
   |                                                 | setting the ``Range`` request header.                   |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``ETag``                                        | Contains a value you can use to perform operations      |
   |                                                 | conditionally. See |conditional-headers| for more       |
   |                                                 | information. The ETag value will be in quotes.          |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Content-MD5``                                 | If the blob has an MD5 hash and this                    |
   |                                                 | Get Blob operation is to read the full blob,            |
   |                                                 | this response header is returned so that the            |
   |                                                 | client can check for message content                    |
   |                                                 | integrity. Put Blob sets a block blob's MD5             |
   |                                                 | hash value even when the Put Blob request               |
   |                                                 | doesn't include an MD5 header. If the request           |
   |                                                 | is to read a specified range and the                    |
   |                                                 | ``x-ms-range-get-content-md5`` is set to                |
   |                                                 | ``true``, the request returns an MD5 hash for           |
   |                                                 | the range, as long as the range is less than            |
   |                                                 | or equal to 4 MB.                                       |
   |                                                 | If neither of these sets of conditions is               |
   |                                                 | true, then no value is returned for the                 |
   |                                                 | ``Content-MD5`` header. If                              |
   |                                                 | ``x-ms-range-get-content-md5`` is specified             |
   |                                                 | without the ``Range`` header, the service               |
   |                                                 | returns status code 400 (Bad Request).                  |
   |                                                 | If ``x-ms-range-get-content-md5`` is set to             |
   |                                                 | ``true`` when the range exceeds 4 MB, the               |
   |                                                 | service returns status code 400 (Bad Request).          |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Content-Encoding``                            | This header returns the value that was specified for    |
   |                                                 | the ``Content-Encoding`` request header                 |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Content-Language``                            | This header returns the value that was                  |
   |                                                 | specified for the ``Content-Language`` request header.  |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Cache-Control``                               | This header is returned if it was previously            |
   |                                                 | specified for the blob.                                 |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Content-Disposition``                         | This header returns the value specified for             |
   |                                                 | the ``x-ms-blob-content-disposition`` header.           |
   |                                                 | The ``Content-Disposition`` response header             |
   |                                                 | field conveys additional information about              |
   |                                                 | how to process the response payload, and also           |
   |                                                 | can be used to attach additional metadata.              |
   |                                                 | For example, when set to ``attachment``, the            |
   |                                                 | user-agent does not display the response, but           |
   |                                                 | instead shows a **Save As** dialog with a               |
   |                                                 | filename other than the blob name specified.            |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-blob-sequence-number``                   | Not applicable (|product| version |version| does not    |
   |                                                 | support Page blob operations).                          |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-blob-type: BlockBlob``                   | Returns the blob's type. |product| version |version|    |
   |                                                 | only supports the Block blob type.                      |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-copy-completion-time: <datetime>``       | Conclusion time of the last attempted Copy Blob         |
   |                                                 | operation where this blob was the destination blob.     |
   |                                                 | This value can specify the time of a                    |
   |                                                 | completed, aborted, or failed copy attempt.             |
   |                                                 | This header does not appear if a copy is                |
   |                                                 | pending, if this blob has never been the                |
   |                                                 | destination in a Copy Blob operation, or if this blob   |
   |                                                 | has been modified after a concluded Copy Blob operation |
   |                                                 | using Set Blob Properties, Put Blob, or Put Block List. |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-copy-status-description:<error string>`` | Only appears when ``x-ms-copy-status`` is ``failed``    |
   |                                                 | or ``pending``. Describes the cause of the last         |
   |                                                 | fatal or non-fatal copy operation failure.              |
   |                                                 | This header does not appear if this blob has            |
   |                                                 | never been the destination in a Copy Blob operation, or |
   |                                                 | if this blob has been modified after a concluded Copy   |
   |                                                 | Blob operation using Set Blob Properties, Put Blob,     |
   |                                                 | or Put Block List.                                      |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-copy-id: <id>``                          | String identifier for the last attempted                |
   |                                                 | Copy Blob operation where this blob was                 |
   |                                                 | the destination blob. This header does not              |
   |                                                 | appear if this blob has never been the                  |
   |                                                 | destination in a Copy Blob operation, or                |
   |                                                 | if this blob has been modified after a                  |
   |                                                 | concluded Copy Blob operation using                     |
   |                                                 | Set Blob Properties, Put Blob, or Put Block List.       |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-copy-progress: <bytes copied/``          | Contains the number of bytes copied and the total bytes |
   | ``bytes total>``                                | in the source in the last attempted Copy Blob operation |
   |                                                 | where this blob was the destination blob. Can show      |
   |                                                 | between 0 and ``Content-Length`` bytes copied. This     |
   |                                                 | header does not appear if this blob has never been      |
   |                                                 | the destination in a Copy Blob operation, or if this    |
   |                                                 | blob has been modified after a concluded Copy Blob      |
   |                                                 | operation using Set Blob Properties, Put Blob, or       |
   |                                                 | Put Block List.                                         |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-copy-source: url``                       | URL up to 2 KB, specifying the source blob or file      |
   |                                                 | used in the last attempted Copy Blob                    |
   |                                                 | operation where this blob was the destination           |
   |                                                 | blob. This header does not appear if this               |
   |                                                 | blob has never been the destination in a                |
   |                                                 | Copy Blob operation, or if this blob has                |
   |                                                 | been modified after a concluded Copy Blob               |
   |                                                 | operation using Set Blob Properties,                    |
   |                                                 | Put Blob, or Put Block List.                            |
   |                                                 | The URL returned in this header contains any            |
   |                                                 | request parameters used in the copy operation           |
   |                                                 | on the source blob, including the SAS token             |
   |                                                 | used to access the source blob.                         |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-copy-status:<pending | success |``       | State of the copy operation identified by x-ms-copy-id, |
   | ``aborted | failed>``                           | with these values:                                      |
   |                                                 |                                                         |
   |                                                 | - ``success``: Copy completed successfully.             |
   |                                                 | - ``pending``: Copy is in progress. Check               |
   |                                                 |   ``x-ms-copy-status-description`` if                   |
   |                                                 |   intermittent, non-fatal errors slow copy              |
   |                                                 |   progress but don't cause failure.                     |
   |                                                 | - ``aborted``: Copy was ended by                        |
   |                                                 |   ``Abort Copy Blob``.                                  |
   |                                                 | - ``failed``: Copy failed. See                          |
   |                                                 |   x-ms-copy-status-description for failure              |
   |                                                 |   details.                                              |
   |                                                 |                                                         |
   |                                                 | This header does not appear if this blob has            |
   |                                                 | never been the destination in a Copy Blob               |
   |                                                 | operation, or if this blob has been modified            |
   |                                                 | after a completed Copy Blob operation                   |
   |                                                 | using Set Blob Properties, Put Blob,                    |
   |                                                 | or Put Block List.                                      |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-lease-duration:``                        | Not applicable (|product| version |version| does not    |
   |                                                 | support leasing).                                       |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-lease-state: available``                 | Not applicable (|product| version |version| does not    |
   |                                                 | support leasing). Blobserver returns the "available"    |
   |                                                 | lease state only.                                       |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-lease-status: unlocked``                 | Not applicable (|product| version |version| does not    |
   |                                                 | support leasing). Blobserver returns the "unlocked"     |
   |                                                 | lease status only.                                      |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-request-id``                             | This header uniquely identifies the request             |
   |                                                 | that was made and can be used to troubleshoot           |
   |                                                 | the request. For more information, see                  |
   |                                                 | |api-troubleshoot|.                                     |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-version``                                | Indicates the version of the Blob service used to       |
   |                                                 | execute the request.                                    |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Accept-Ranges: bytes``                        | Indicates that the service supports requests            |
   |                                                 | for partial blob content.                               |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Date``                                        | A UTC date/time value generated by the service,         |
   |                                                 | indicating when the response was initiated.             |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Access-Control-Allow-Origin``                 | Returned if the request includes an                     |
   |                                                 | ``Origin`` header and CORS is enabled with a            |
   |                                                 | matching rule. This header returns the value            |
   |                                                 | of the origin request header in case of a               |
   |                                                 | match.                                                  |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Access-Control-Expose-Headers``               | Returned if the request includes an                     |
   |                                                 | ``Origin`` header and CORS is enabled with a            |
   |                                                 | matching rule. Returns the list of response             |
   |                                                 | headers to be exposed to the client or issuer           |
   |                                                 | of the request.                                         |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Vary``                                        | Returned with the value of the ``Origin``               |
   |                                                 | header when CORS rules are specified. See               |
   |                                                 | |cors-support| for details.                             |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``Access-Control-Allow-Credentials``            | Returned if the request includes an                     |
   |                                                 | ``Origin`` header and CORS is enabled with a            |
   |                                                 | matching rule that doesn't allow all origins.           |
   |                                                 | This header will be set to ``true``.                    |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-blob-committed-block-count``             | Not supported.                                          |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-server-encrypted: true/false``           | This header is set to ``true`` if the blob              |
   |                                                 | data and application metadata are completely            |
   |                                                 | encrypted using the specified algorithm.                |
   |                                                 | Otherwise, the value is set to ``false``                |
   |                                                 | (when the blob is unencrypted, or if only               |
   |                                                 | parts of the blob/application metadata are              |
   |                                                 | encrypted).                                             |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-encryption-key-sha256``                  | This header is returned if the blob is encrypted with a |
   |                                                 | customer-provided key.                                  |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-blob-content-md5``                       | If the blob has an MD5 hash, and if the request         |
   |                                                 | contains a range header (Range or x-ms-range), this     |
   |                                                 | response header is returned with the value of           |
   |                                                 | the whole blob's MD5 value. This value may or           |
   |                                                 | may not be equal to the value returned in               |
   |                                                 | Content-MD5 header, with the latter                     |
   |                                                 | calculated from the requested range.                    |
   +-------------------------------------------------+---------------------------------------------------------+
   | ``x-ms-client-request-id``                      | This header can be used to troubleshoot                 |
   |                                                 | requests and corresponding responses. The               |
   |                                                 | value of this header is equal to the value of           |
   |                                                 | the ``x-ms-client-request-id`` header if it             |
   |                                                 | is present in the request and the value is at           |
   |                                                 | most 1024 visible ASCII characters. If the              |
   |                                                 | ``x-ms-client-request-id`` header is not                |
   |                                                 | present in the request, this header is not              |
   |                                                 | present in the response.                                |
   +-------------------------------------------------+---------------------------------------------------------+

Response Body
~~~~~~~~~~~~~

The response body contains the content of the blob.


Sample Response
~~~~~~~~~~~~~~~

   ::

      Status Response:
      HTTP/1.1 200 OK

      Response Headers:
      x-ms-blob-type: BlockBlob
      x-ms-lease-status: unlocked
      x-ms-lease-state: available
      x-ms-meta-m1: v1
      x-ms-meta-m2: v2
      Content-Length: 11
      Content-Type: text/plain; charset=UTF-8
      Date: <date>
      ETag: "0x8CB171DBEAD6A6B"
      Vary: Origin
      Last-Modified: <date>
      x-ms-version: 2015-02-21
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
      x-ms-copy-id: 36650d67-05c9-4a24-9a7d-a2213e53caf6
      x-ms-copy-source: <url>
      x-ms-copy-status: success
      x-ms-copy-progress: 11/11
      x-ms-copy-completion-time: <date>


Authorization
~~~~~~~~~~~~~

If the container's access control list (ACL) is set to allow anonymous access to
the blob, any client may call this operation. If the container is private, this
operation can be performed by the account owner and by anyone with a Shared
Access Signature that has permission to read the blob.

Remarks
-------

A Get Blob operation is allowed 2 minutes per MB to complete. If the operation
is taking longer than 2 minutes per MB on average, the operation times out.

The ``x-ms-version`` header is required to retrieve a blob that belongs to a
private container. If the blob belongs to a container that is available for full
or partial public access, any client can read it without specifying a version;
the service version is not required for retrieving a blob that belongs to a
public container. See |manage-access| for more information.

Get Blob fails on archived block blobs.

Copy Operations
~~~~~~~~~~~~~~~

To determine if a Copy Blob operation has completed, first check that the
``x-ms-copy-id`` header value of the destination blob matches the copy ID
provided by the original call to Copy Blob.  A match assures that another
application did not abort the copy and start a new Copy Blob operation. Then
check for the ``x-ms-copy-status: success`` header.

.. note::

   All write operations on a blob except ``Put Block`` operations remove all
   ``x-ms-copy-*`` properties from the blob.

.. important::

   The URL returned in the ``x-ms-copy-source`` header contains any
   request parameters used in the copy operation on the source blob.
   If a SAS token is used to access the source blob, then that SAS
   token will appear in the the ``x-ms-copy-source`` header when
   Get Blob is called on the destination blob.

When ``x-ms-copy-status: failed`` appears in the response,
``x-ms-copy-status-description`` contains more information about the ``Copy
Blob`` failure.

The following table describes the three fields of every
``x-ms-copy-status-description`` value.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +------------------+-----------------------------------------------------------------+
   | Component        | Description                                                     |
   +==================+=================================================================+
   | HTTP status code | Standard 3-digit integer specifying the failure.                |
   +------------------+-----------------------------------------------------------------+
   | Error code       | Keyword describing error that is provided by Azure in the       |
   |                  | <ErrorCode> element. If no <ErrorCode> element appears, a       |
   |                  | keyword containing standard error text associated with the      |
   |                  | 3-digit HTTP status code in the HTTP specification is used.     |
   |                  | See :ref:`Error Codes`.                                         |
   +------------------+-----------------------------------------------------------------+
   | Information      | Detailed description of failure, in quotes.                     |
   +------------------+-----------------------------------------------------------------+

The following table describes the ``x-ms-copy-status`` and
``x-ms-copy-status-description`` values of common failure scenarios.

.. important::

   Description text shown here can change without warning. Do not rely on
   matching this exact text.

.. tabularcolumns:: X{0.30\textwidth}X{0.30\textwidth}X{0.35\textwidth}
.. table::

   +-----------------------+------------------+-------------------------------+
   | Scenario              | x-ms-copy-status | x-ms-copy-status-description  |
   |                       | value            | value                         |
   +=======================+==================+===============================+
   | Copy operation        | success          | empty                         |
   | completed             |                  |                               |
   | successfully.         |                  |                               |
   +-----------------------+------------------+-------------------------------+
   | User aborted copy     | aborted          | empty                         |
   | operation before it   |                  |                               |
   | completed.            |                  |                               |
   +-----------------------+------------------+-------------------------------+
   | A failure occurred    | pending          | 502 BadGateway                |
   | when reading from the |                  |                               |
   | source blob during a  |                  | "Encountered a                |
   | copy operation, but   |                  | retryable error when          |
   | the operation will be |                  | reading the source.           |
   | retried.              |                  | Will retry. Time of           |
   |                       |                  | failure: <time>"              |
   +-----------------------+------------------+-------------------------------+
   | A failure occurred    | pending          | 500 InternalServerError       |
   | when writing to the   |                  |                               |
   | destination blob of a |                  | "Encountered a                |
   | copy operation, but   |                  | retryable error. Will         |
   | the operation will be |                  | retry. Time of                |
   | retried.              |                  | failure: <time>"              |
   +-----------------------+------------------+-------------------------------+
   | An unrecoverable      | failed           | 404 ResourceNotFound          |
   | failure occurred when |                  |                               |
   | reading from the      |                  | "Copy failed when reading the |
   | source blob of a copy |                  | source."                      |
   | operation.            |                  |                               |
   |                       |                  | .. note::                     |
   |                       |                  |                               |
   |                       |                  |    When reporting this        |
   |                       |                  |    underlying error,          |
   |                       |                  |    Blobserver returns         |
   |                       |                  |    ``ResourceNotFound``       |
   |                       |                  |    in the ``ErrorCode``       |
   |                       |                  |    element. If no             |
   |                       |                  |    ``ErrorCode`` element      |
   |                       |                  |    appears in the response,   |
   |                       |                  |    a standard string          |
   |                       |                  |    representation of the HTTP |
   |                       |                  |    status such as             |
   |                       |                  |    ``NotFound`` appears.      |
   +-----------------------+------------------+-------------------------------+
   | The timeout period    | failed           | 500 OperationCancelled        |
   | limiting all copy     |                  |                               |
   | operations elapsed.   |                  | "The copy exceeded the        |
   | (Currently the        |                  | maximum allowed time."        |
   | timeout period is 2   |                  |                               |
   | weeks.)               |                  |                               |
   +-----------------------+------------------+-------------------------------+
   | The copy operation    | failed           | 500 OperationCancelled        |
   | failed too often when |                  |                               |
   | reading from the      |                  | "The copy failed when         |
   | source, and didn't    |                  | reading the source."          |
   | meet a minimum ratio  |                  |                               |
   | of attempts to        |                  |                               |
   | successes. (This      |                  |                               |
   | timeout prevents      |                  |                               |
   | retrying a very poor  |                  |                               |
   | source over 2 weeks   |                  |                               |
   | before failing).      |                  |                               |
   +-----------------------+------------------+-------------------------------+
