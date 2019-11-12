.. _Get Blob Properties:

Get Blob Properties
===================

The Get Blob Properties operation returns all user-defined
metadata, standard HTTP properties, and system properties for the
blob. It does not return the content of the blob.

Request
-------

The Get Blob Properties request may be constructed as follows.  HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: ll
.. table::

   +------------------------------------------------------------------------------------+--------------+
   |  HEAD Method Request URI                                                           | HTTP Version |
   +====================================================================================+==============+
   | ``https://myaccount.blob.core.windows.net/mycontainer/myblob``                     | HTTP/1.1     |
   +------------------------------------------------------------------------------------+--------------+

Emulated Storage Service URI
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When making a request against the emulated storage service, specify the emulator
hostname and Blob service port as ``127.0.0.1:10000``, followed by the emulated
storage account name:

.. tabularcolumns:: ll
.. table::

   +----------------------------------------------------------------+--------------+
   | HEAD Method Request URI                                        | HTTP Version |
   +================================================================+==============+
   | ``http://127.0.0.1:10000/devstoreaccount1/mycontainer/myblob`` | HTTP/1.1     |
   +----------------------------------------------------------------+--------------+

For more information, see |emulator-dev-test|.

URI parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: ll
.. table::

   +--------------+-----------------------------------------------------------------------+
   | Parameter    | Description                                                           |
   +==============+=======================================================================+
   | ``snapshot`` | Not applicable (Zenko version |version| does not support snapshots).  |
   +--------------+-----------------------------------------------------------------------+
   | ``timeout``  | Optional. The ``timeout`` parameter is expressed in seconds. For more |
   |              | information, see |set-blob-timeouts|.                                 |
   +--------------+-----------------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: ll
.. table::

   +----------------------------+---------------------------------------------+
   | Request Header             | Description                                 |
   +============================+=============================================+
   | ``Authorization``          | Required. Specifies the authorization       |
   |                            | scheme, account name, and signature. For    |
   |                            | more information, see |authorize-requests|. |
   +----------------------------+---------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the                     |
   |                            | Coordinated Universal Time (UTC)            |
   |                            | for the request. For more                   |
   |                            | information, see |authorize-requests|.      |
   +----------------------------+---------------------------------------------+
   | ``x-ms-version``           | Required for all authorized                 |
   |                            | requests, optional for anonymous            |
   |                            | requests. Specifies the version             |
   |                            | of the operation to use for this            |
   |                            | request. For more information,              |
   |                            | see |azure-versioning|.                     |
   +----------------------------+---------------------------------------------+
   | ``x-ms-lease-id: <ID>``    | Optional. If this header is                 |
   |                            | specified, the Get Blob Properties          |
   |                            | operation will be performed only if both of |
   |                            | the following conditions are met:           |
   |                            |                                             |
   |                            | - The blob's lease is currently             |
   |                            |   active.                                   |
   |                            | - The lease ID specified in the             |
   |                            |   request matches that of the blob.         |
   |                            |                                             |
   |                            | If either condition is not met, the request |
   |                            | will fails and the Get Blob Properties      |
   |                            | operation fails with status code 412        |
   |                            | (Precondition Failed).                      |
   +----------------------------+---------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated,      |
   |                            | opaque value with a 1 KB character limit    |
   |                            | that is recorded in the analytics logs      |
   |                            | when storage analytics logging is           |
   |                            | enabled. Using this header is               |
   |                            | highly recommended for                      |
   |                            | correlating client-side                     |
   |                            | activities with requests received           |
   |                            | by the server. For more                     |
   |                            | information, see |analytics-log| and        |
   |                            | |storage-tracking|.                         |
   +----------------------------+---------------------------------------------+

This operation also supports conditional headers for returning blob properties
and metadata only if a specified condition is met. For more information, see
|conditional-headers|.

Request Body
~~~~~~~~~~~~

None.

Response
--------

The response includes an HTTP status code and a set of response headers.

Status Code
~~~~~~~~~~~

A successful operation returns status code 200 (OK).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 specification.

.. tabularcolumns:: ll
.. table::
   
   +--------------------------------------------------+----------------------------------------------+
   | Response Header                                  | Description                                  |
   +==================================================+==============================================+
   | ``Last-Modified``                                | The date/time that the blob was              |
   |                                                  | last modified. The date format               |
   |                                                  | follows RFC 1123. For more                   |
   |                                                  | information, see |date-time-headers|.        |
   |                                                  | Any operation that modifies the              |
   |                                                  | blob, including an update of the             |
   |                                                  | blob's metadata or properties,               |
   |                                                  | changes the last modified time of the blob.  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-creation-time``                           | The date/time when the blob was              |
   |                                                  | created. The date format follows             |
   |                                                  | RFC 1123. For more information,              |
   |                                                  | see |date-time-headers|.                     |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-meta-name:value``                         | A set of name-value pairs that               |
   |                                                  | correspond to the user-defined               |
   |                                                  | metadata associated with this blob.          |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-blob-type: <BlockBlob|PageBlob|``         | The blob type. Zenko version |version| only  |
   | ``AppendBlob>``                                  | supports the BlockBlob (Block) blob type.    |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-copy-completion-time: <date time>``       | Conclusion time of the last attempted Copy   |
   |                                                  | Blob operation where this blob was the       |
   |                                                  | destination blob. This value can specify the |
   |                                                  | time of a completed, aborted, or failed copy |
   |                                                  | attempt. This header does not appear if a    |
   |                                                  | copy is pending, if this blob has never been |
   |                                                  | the destination in a Copy Blob operation, or |
   |                                                  | if this blob has been modified after a       |
   |                                                  | concluded Copy Blob operation using Set Blob |
   |                                                  | Properties, Put Blob, or Put Block List.     |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-copy-status-description: <error string>`` | Only appears when ``x-ms-copy-status`` is    |
   |                                                  | ``failed`` or ``pending``.  Describes the    |
   |                                                  | cause of a fatal or non-fatal copy operation |
   |                                                  | failure. This header does not appear if      |
   |                                                  | this blob has never been the destination in  |
   |                                                  | a Copy Blob operation, or if this blob has   |
   |                                                  | been modified after a concluded Copy Blob    |
   |                                                  | operation using Set Blob Properties, Put     |
   |                                                  | Blob, or Put Block List.                     |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-copy-id: <id>``                           | String identifier for the last               |
   |                                                  | attempted Copy Blob operation                |
   |                                                  | where this blob was the                      |
   |                                                  | destination blob. This header                |
   |                                                  | does not appear if this blob has             |
   |                                                  | never been the destination in a              |
   |                                                  | Copy Blob operation, or if                   |
   |                                                  | this blob has been modified after            |
   |                                                  | a concluded Copy Blob operation using        |
   |                                                  | Set Blob Properties, Put Blob, or            |
   |                                                  | Put Block List.                              |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-copy-progress: <bytes copied/bytes        | Contains the number of bytes                 |
   | total>``                                         | copied and the total bytes in the            |
   |                                                  | source in the last attempted                 |
   |                                                  | Copy Blob operation where                    |
   |                                                  | this blob was the destination                |
   |                                                  | blob. Can show between 0 and                 |
   |                                                  | ``Content-Length`` bytes copied.             |
   |                                                  | This header does not appear if               |
   |                                                  | this blob has never been the                 |
   |                                                  | destination in a Copy Blob                   |
   |                                                  | operation, or if this blob has               |
   |                                                  | been modified after a concluded              |
   |                                                  | Copy Blob operation using Set Blob           |
   |                                                  | Properties, Put Blob, or Put Block List.     |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-copy-source: url``                        | URL up to 2 KB in length that                |
   |                                                  | specifies the source blob used in            |
   |                                                  | the last attempted Copy Blob                 |
   |                                                  | operation where this blob was the            |
   |                                                  | destination blob. This header                |
   |                                                  | does not appear if this blob has             |
   |                                                  | never been the destination in a              |
   |                                                  | Copy Blob operation, or if                   |
   |                                                  | this blob has been modified after            |
   |                                                  | a concluded Copy Blob operation using        |
   |                                                  | Set Blob Properties, Put Blob, or            |
   |                                                  | Put Block List.                              |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-copy-status: <pending | success |``       | State of the copy operation                  |
   | ``aborted | failed>``                            | identified by x-ms-copy-id, with             |         
   |                                                  | these values:                                |
   |                                                  |                                              |
   |                                                  | - ``success``: Copy completed                |
   |                                                  |   successfully.                              |
   |                                                  | - ``pending``: Copy is in                    |
   |                                                  |   progress. Check                            |
   |                                                  |   ``x-ms-copy-status-description``           |
   |                                                  |   if intermittent, non-fatal errors          |
   |                                                  |   impede copy progress but do not            |
   |                                                  |   cause failure.                             |
   |                                                  | - ``aborted``: Copy was ended by             |
   |                                                  |   ``Abort Copy Blob``.                       |
   |                                                  | - ``failed``: Copy failed. See               |
   |                                                  |   ``x-ms-copy-status-description``           |
   |                                                  |   for failure details.                       |
   |                                                  |                                              |
   |                                                  | This header does not appear if               |
   |                                                  | this blob has never been the                 |
   |                                                  | destination in a Copy Blob                   |
   |                                                  | operation, or if this blob has               |
   |                                                  | been modified after a completed              |
   |                                                  | Copy Blob operation using Set Blob           |
   |                                                  | Properties, Put Blob, or Put Block List.     | 
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-incremental-copy: true``                  | Not applicable (Zenko version |version| does |
   |                                                  | not support incremental copy).               |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-copy-destination-snapshot: <datetime>``   | Not applicable (Zenko version |version| does |
   |                                                  | not support incremental copy or snapshots).  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-lease-duration: <infinite | fixed>``      | When a blob is leased, specifies             |
   |                                                  | whether the lease is of infinite             |
   |                                                  | or fixed duration.                           |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-lease-state: <available | leased |        | Lease state of the blob.                     | 
   | expired | breaking | broken>``                   |                                              |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-lease-status: <locked|unlocked>``         | The lease status of the blob.                |
   +--------------------------------------------------+----------------------------------------------+
   | ``Content-Length``                               | The size of the blob in bytes.               |
   +--------------------------------------------------+----------------------------------------------+
   | ``Content-Type``                                 | The content type specified for               |
   |                                                  | the blob. If no content type was             |
   |                                                  | specified, the default content               |
   |                                                  | type is ``application/octet-stream``.        |
   +--------------------------------------------------+----------------------------------------------+
   | ``Etag``                                         | The ETag contains a value you can use to     |
   |                                                  | perform operations conditionally. See        |
   |                                                  | |conditional-headers| for more information.  |
   |                                                  | The ETag value will be in quotes.            |
   +--------------------------------------------------+----------------------------------------------+
   | ``Content-MD5``                                  | If the ``Content-MD5`` header has            |
   |                                                  | been set for the blob, this                  |
   |                                                  | response header is returned so               |
   |                                                  | that the client can check for                |
   |                                                  | message content integrity.                   |
   |                                                  | Put Blob sets a block                        |
   |                                                  | blob's MD5 value even when the               |
   |                                                  | Put Blob request does not                    |
   |                                                  | include an MD5 header.                       |
   +--------------------------------------------------+----------------------------------------------+
   | ``Content-Encoding``                             | If the ``Content-Encoding``                  |
   |                                                  | request header has previously                |
   |                                                  | been set for the blob, that value            |
   |                                                  | is returned in this header.                  |
   +--------------------------------------------------+----------------------------------------------+
   | ``Content-Language``                             | If the ``Content-Language``                  |
   |                                                  | request header has previously                |
   |                                                  | been set for the blob, that value            |
   |                                                  | is returned in this header.                  |
   +--------------------------------------------------+----------------------------------------------+
   | ``Content-Disposition``                          | If the ``Content-Disposition``               |
   |                                                  | request header has previously                |
   |                                                  | been set for the blob, that value            |
   |                                                  | is returned in this header.                  |
   |                                                  | The ``Content-Disposition``                  |
   |                                                  | response header field conveys                |
   |                                                  | additional information about how             |
   |                                                  | to process the response payload,             |
   |                                                  | and also can be used to attach               |
   |                                                  | additional metadata. For example,            |
   |                                                  | if set to ``attachment``, it                 |
   |                                                  | indicates that the user-agent                |
   |                                                  | should not display the response,             |
   |                                                  | but instead show a Save As                   |
   |                                                  | dialog.                                      |
   +--------------------------------------------------+----------------------------------------------+
   | ``Cache-Control``                                | If the ``Cache-Control`` request             |
   |                                                  | header has previously been set               |
   |                                                  | for the blob, that value is                  |
   |                                                  | returned in this header.                     |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-blob-sequence-number``                    | Not applicable.                              |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-request-id``                              | This header uniquely identifies              |
   |                                                  | the request that was made and can            |
   |                                                  | be used for troubleshooting the              |
   |                                                  | request. For more information,               |
   |                                                  | see |api-troubleshoot|.                      |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-version``                                 | Indicates the version of the Blob            |
   |                                                  | service used to execute the                  |
   |                                                  | request.                                     |
   +--------------------------------------------------+----------------------------------------------+
   | ``Date``                                         | A UTC date/time value generated              |
   |                                                  | by the service that indicates the            |
   |                                                  | time at which the response was               |
   |                                                  | initiated.                                   |
   +--------------------------------------------------+----------------------------------------------+
   | ``Accept-Ranges: bytes``                         | Indicates that the service                   |
   |                                                  | supports requests for partial blob content.  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-blob-committed-block-count``              | Not applicable (Zenko version |version| does |
   |                                                  | not support append blobs).                   |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-server-encrypted: true/false``            | The value of this header is set to           |
   |                                                  | ``true`` if the blob data and                |
   |                                                  | application metadata are                     |
   |                                                  | completely encrypted using the               |
   |                                                  | specified algorithm. Otherwise,              |
   |                                                  | the value is set to ``false``                |
   |                                                  | (when the blob is unencrypted, or            |
   |                                                  | if only parts of the                         |
   |                                                  | blob/application metadata are                |
   |                                                  | encrypted).                                  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-access-tier``                             | Not applicable (Zenko version |version| does |
   |                                                  | not support service tiers).                  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-access-tier-inferred: true``              | Not applicable (Zenko version |version| does |
   |                                                  | not support service tiers).                  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-archive-status``                          | Not applicable (Zenko version |version| does |
   |                                                  | not support service tiers).                  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-access-tier-change-time``                 | Not applicable (Zenko version |version| does |
   |                                                  | not support service tiers).                  |
   +--------------------------------------------------+----------------------------------------------+
   | ``x-ms-client-request-id``                       | This header can be used to                   |
   |                                                  | troubleshoot requests and                    |
   |                                                  | corresponding responses. The                 |
   |                                                  | value of this header is equal to             |
   |                                                  | the value of the                             |
   |                                                  | ``x-ms-client-request-id`` header            |
   |                                                  | if it is present in the request              |
   |                                                  | and the value is at most 1024                |
   |                                                  | visible ASCII characters. If the             |
   |                                                  | ``x-ms-client-request-id`` header            |
   |                                                  | is not present in the request,               |
   |                                                  | this header will not be present              |
   |                                                  | in the response.                             |
   +--------------------------------------------------+----------------------------------------------+

Response Body
~~~~~~~~~~~~~

None.

Sample Response
~~~~~~~~~~~~~~~

   ::

      Response Status:  
      HTTP/1.1 200 OK  
        
      Response Headers:  
      x-ms-meta-Name: myblob.txt  
      x-ms-meta-DateUploaded: <date>  
      x-ms-blob-type: AppendBlob  
      x-ms-lease-status: unlocked  
      x-ms-lease-state: available  
      Content-Length: 11  
      Content-Type: text/plain; charset=UTF-8  
      Date: <date>  
      ETag: "0x8CAE97120C1FF22"  
      Accept-Ranges: bytes  
      x-ms-blob-committed-block-count: 1  
      x-ms-version: 2015-02-21  
      Last-Modified: <date>  
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0  
      x-ms-copy-id: 36650d67-05c9-4a24-9a7d-a2213e53caf6  
      x-ms-copy-source: <url>  
      x-ms-copy-status: success  
      x-ms-copy-progress: 11/11  
      x-ms-copy-completion-time: <date>  
        

Authorization
~~~~~~~~~~~~~

If the container's access control list (ACL) is set to allow
anonymous access to the blob, any client may call this operation. If
the container is private, this operation can be performed by the
account owner and by anyone with a Shared Access Signature that has
permission to read the blob.

Remarks
-------

To determine if a Copy Blob operation has completed, first check that the
``x-ms-copy-id`` header value matches the copy ID provided by the original call
to Copy Blob. A match assures that another application did not abort the copy
and start a new Copy Blob operation. Then check for the ``x-ms-copy-status:
success`` header.  However, all write operations on a blob except Put Block
remove all ``x-ms-copy-*`` properties from the blob.

``x-ms-copy-status-description`` contains more information about the Copy Blob
failure. The following table shows ``x-ms-copy-status-description`` values and
their meaning.

The following table describes the three fields of every
``x-ms-copy-status-description`` value.

.. tabularcolumns:: ll
.. table::

   +------------------+--------------------------------------------------------------------------------+
   | Component        | Description                                                                    |
   +==================+================================================================================+
   | HTTP status code | Standard 3-digit integer specifying the failure.                               |
   +------------------+--------------------------------------------------------------------------------+   
   | Error code       | Keyword describing error that is provided by Azure in the <ErrorCode> element. |
   |                  | If no <ErrorCode> element appears, a keyword containing standard error text    |
   |                  | associated with the 3-digit HTTP status code in the HTTP specification is      |
   |                  | used. See :ref:`Status and Error Codes`.                                       |
   +------------------+--------------------------------------------------------------------------------+
   | Information      | Detailed description of failure, in quotes.                                    |
   +------------------+--------------------------------------------------------------------------------+

The following table describes the ``x-ms-copy-status`` and
``x-ms-copy-status-description`` values of common failure scenarios.

.. tabularcolumns:: lll
.. table::

   +----------------------------------------+------------------------+---------------------------------------+
   | Scenario                               | x-ms-copy-status value | x-ms-copy-status-description value    |
   +========================================+========================+=======================================+
   | Copy operation completed successfully. | success                | empty                                 |
   +----------------------------------------+------------------------+---------------------------------------+
   | User aborted copy operation before it  | aborted                | empty                                 |
   | completed.                             |                        |                                       |
   +----------------------------------------+------------------------+---------------------------------------+
   | A failure occurred when reading from   | pending                | 502 BadGateway                        |
   | the source blob during a               |                        |                                       |
   | copy operation, but the operation will |                        | "Encountered a retryable error when   |
   | be retried.                            |                        | reading the source. Will retry. Time  |
   |                                        |                        | of failure: <time>"                   |
   +----------------------------------------+------------------------+---------------------------------------+
   | A failure occurred when writing to the | pending                | 500 InternalServerError               |
   | destination blob of a copy operation,  |                        |                                       |
   | but the operation will be retried.     |                        | "Encountered a retryable error. Will  |
   |                                        |                        | retry. Time of failure: <time>"       |
   +----------------------------------------+------------------------+---------------------------------------+
   | An unrecoverable failure occurred when |  failed                | 404 ResourceNotFound                  | 
   | reading from the source blob of a copy |                        |                                       |
   | operation.                             |                        | "Copy failed when reading the         |
   |                                        |                        | source."                              |
   |                                        |                        |                                       |
   |                                        |                        | .. note::                             |
   |                                        |                        |                                       |
   |                                        |                        |    When reporting this underlying     |
   |                                        |                        |    error, Azure returns               |
   |                                        |                        |    ``ResourceNotFound`` in the        |
   |                                        |                        |    <ErrorCode> element. If no         |
   |                                        |                        |    <ErrorCode> element appeared in    |
   |                                        |                        |    the response, a standard string    |
   |                                        |                        |    representation of the HTTP status, |
   |                                        |                        |    such as ``NotFound`` appears.      |
   +----------------------------------------+------------------------+---------------------------------------+
   | The timeout period limiting all copy   | failed                 | 500 OperationCancelled                |
   | operations elapsed. (Currently the     |                        |                                       |
   | timeout period is 2 weeks.)            |                        | "The copy exceeded the maximum        |
   |                                        |                        | allowed time."                        |
   +----------------------------------------+------------------------+---------------------------------------+
   | The copy operation failed too often    | failed                 | 500 OperationCancelled                |
   | when reading from the source, and      |                        |                                       |
   | did not meet a minimum ratio of        |                        | "The copy failed when reading the     |
   | attempts to successes. (This timeout   |                        | source."                              |
   | prevents retrying a very poor source   |                        |                                       |
   | over 2 weeks before failing).          |                        |                                       |
   +----------------------------------------+------------------------+---------------------------------------+
