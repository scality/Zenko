.. _List Blobs:

List Blobs
==========

The List Blobs operation returns a list of the blobs under the specified
container.

Request
-------

The List Blob request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+--------------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                                    | HTTP Version |
   +========+================================================================================+==============+
   | GET    | ``https://myaccount.blob.example.com/mycontainer?restype=container&comp=list`` | HTTP/1.1     |
   +--------+--------------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the URI.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +-----------------------------------+---------------------------------------+
   | Parameter                         | Description                           |
   +===================================+=======================================+
   | ``prefix``                        | Optional. Filters the results to      |
   |                                   | return only blobs whose names         |
   |                                   | begin with the specified prefix.      |
   +-----------------------------------+---------------------------------------+
   | ``delimiter``                     | Optional. When the request            |
   |                                   | includes this parameter, the          |
   |                                   | operation returns a                   |
   |                                   | ``BlobPrefix`` element in the         |
   |                                   | response body that acts as a          |
   |                                   | placeholder for all blobs whose       |
   |                                   | names begin with the same             |
   |                                   | substring up to the appearance of     |
   |                                   | the delimiter character. The          |
   |                                   | delimiter may be a single             |
   |                                   | character or a string.                |
   +-----------------------------------+---------------------------------------+
   | ``marker``                        | Optional. A string value that         |
   |                                   | identifies the portion of the         |
   |                                   | list to be returned with the next     |
   |                                   | list operation. The operation         |
   |                                   | returns a marker value within the     |
   |                                   | response body if the list             |
   |                                   | returned was not complete. The        |
   |                                   | marker value may then be used in      |
   |                                   | a subsequent call to request the      |
   |                                   | next set of list items.               |
   |                                   | The marker value is opaque to the     |
   |                                   | client.                               |
   +-----------------------------------+---------------------------------------+
   | ``maxresults``                    | Optional. Specifies the maximum       |
   |                                   | number of blobs to return,            |
   |                                   | including all ``BlobPrefix``          |
   |                                   | elements. If the request does not     |
   |                                   | specify ``maxresults`` or             |
   |                                   | specifies a value greater than        |
   |                                   | 5,000, the server will return up      |
   |                                   | to 5,000 items.                       |
   |                                   | Setting ``maxresults`` to a value     |
   |                                   | less than or equal to zero            |
   |                                   | results in error response code        |
   |                                   | 400 (Bad Request).                    |
   +-----------------------------------+---------------------------------------+
   | ``include={snapshots,metadata,    | Optional. Specifies one or more       |
   | uncommittedblobs,copy,deleted}``  | datasets to include in the            |
   |                                   | response:                             |
   |                                   |                                       |
   |                                   | - ``snapshots``: Not applicable       |
   |                                   |   (Zenko version |version| does not   |
   |                                   |   support snapshots).                 |
   |                                   | - ``metadata``: Specifies that        |
   |                                   |   blob metadata be returned in the    |
   |                                   |   response.                           |
   |                                   | - ``uncommittedblobs``:               |
   |                                   |   Specifies that blobs for which      |
   |                                   |   blocks have been uploaded, but      |
   |                                   |   which have not been committed       |
   |                                   |   using Put Block List, be            |
   |                                   |   included in the response.           |
   |                                   | - ``copy``: Specifies that            |
   |                                   |   metadata related to any current     |
   |                                   |   or previous ``Copy Blob``           |
   |                                   |   operation shall be included in the  |
   |                                   |   response.                           |
   |                                   | - ``deleted``: Specifies that soft-\  |
   |                                   |   deleted blobs should be included    |
   |                                   |   in the response.                    |
   |                                   |   (Zenko version |version| does not   |
   |                                   |   support soft deletes).              |
   |                                   |                                       |
   |                                   | To specify more than one of these     |
   |                                   | options on the URI, you must          |
   |                                   | separate each option with a           |
   |                                   | URL-encoded comma ("%82").            |
   +-----------------------------------+---------------------------------------+
   | ``timeout``                       | Optional. The ``timeout``             |
   |                                   | parameter is expressed in             |
   |                                   | seconds. For more information,        |
   |                                   | see |set-blob-timeouts|.              |
   +-----------------------------------+---------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns::  X{0.25\textwidth}X{0.70\textwidth}
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
   | ``x-ms-version``           | Required for all authorized requests, optional for     |
   |                            | anonymous requests. Specifies the version of the       |
   |                            | operation to use for this request. For more            |
   |                            | information, see |azure-versioning|.                   |
   +----------------------------+--------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value    |
   |                            | with a 1 KB character limit that is recorded in the    |
   |                            | analytics logs when storage analytics logging is       |
   |                            | enabled. Using this header is highly recommended for   |
   |                            | correlating client-side activities with requests       |
   |                            | received by the server. For more information, see      |
   |                            | |analytics-log| and |storage-tracking|.                |
   +----------------------------+--------------------------------------------------------+

Request Body
~~~~~~~~~~~~

None

Sample Request
~~~~~~~~~~~~~~

See |list-blob-storage| for a sample request.

Response
--------

The response includes an HTTP status code, a set of response headers, and a
response body in XML format.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 200 (OK).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns::  X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+-------------------------------------------+
   | Response Header            | Description                               |
   +============================+===========================================+
   | ``Content-Type``           | Specifies the format in which the results |
   |                            | are returned. Currently this value is     |
   |                            | ``application/xml``.                      |
   +----------------------------+-------------------------------------------+
   | ``x-ms-request-id``        | This header uniquely identifies           |
   |                            | the request that was made and can         |
   |                            | be used for troubleshooting the           |
   |                            | request. For more information,            |
   |                            | see |api-troubleshoot|.                   |
   +----------------------------+-------------------------------------------+
   | ``x-ms-version``           | Indicates the version of the Blob         |
   |                            | service used to execute the               |
   |                            | request.                                  |
   +----------------------------+-------------------------------------------+
   | ``Date``                   | A UTC date/time value generated by the    |
   |                            | service that indicates when the response  |
   |                            | was initiated.                            |
   +----------------------------+-------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to                |
   |                            | troubleshoot requests and                 |
   |                            | corresponding responses. The              |
   |                            | value of this header is equal to          |
   |                            | the value of the                          |
   |                            | ``x-ms-client-request-id`` header         |
   |                            | if it is present in the request           |
   |                            | and the value is at most 1024             |
   |                            | visible ASCII characters. If the          |
   |                            | ``x-ms-client-request-id`` header         |
   |                            | is not present in the request,            |
   |                            | this header will not be present           |
   |                            | in the response.                          |
   +----------------------------+-------------------------------------------+

Response Body
~~~~~~~~~~~~~

The format of the XML response is as follows.

The ``Prefix``, ``Marker``, ``MaxResults``, and ``Delimiter`` elements are only
present if specified in the request URI. The ``NextMarker`` element only takes a
value if the list results are not complete.

Blob metadata and uncommitted blobs are included in the response only if they
are specified with the ``include`` parameter on the request URI.  The blob's
properties are encapsulated within a ``Properties`` element.

The Blob service calculates the ``Content-MD5`` value when you upload a blob
using Put Blob, but does not calculate this when you create a blob using Put
Block List. You can explicitly set the ``Content-MD5`` value when you create the
blob, or by calling Put Block List or Set Blob Properties operations.

``CopyId``, ``CopyStatus``, ``CopySource``, ``CopyProgress``,
``CopyCompletionTime``, and ``CopyStatusDescription`` only appear when this
operation includes the ``include={copy}`` parameter. These elements do not
appear if this blob has never been the destination in a ``Copy Blob`` operation,
or if this blob has been modified after a concluded ``Copy Blob`` operation
using ``Set Blob Properties``, ``Put Blob``, or ``Put Block List``.

The ``EnumerationResults`` element contains a ``ServiceEndpoint`` attribute
specifying the blob endpoint, and a ``ContainerName`` field specifying the name
of the container.

``List Blobs`` returns all blobs, as well as the ``ServerEncrypted``
element. This element is set to ``true`` if the blob and application metadata
are completely encrypted, and ``false`` otherwise.

``List Blobs`` also returns the ``IncrementalCopy`` element for incremental copy
blobs with the value set to ``true``.

``Deleted``, ``DeletedTime`` and ``RemainingRetentionDays`` appear when this
operation includes the ``include={deleted}`` parameter. These elements do not
appear if this blob was not deleted. These elements appear for blobs that are
deleted with ``DELETE`` operation when soft delete feature was
enabled. ``Deleted`` element is set to true for blobs that are
soft-deleted. ``Deleted-Time`` corresponds to the time the blob was
deleted. ``RemainingRetentionDays`` indicates the number of days after which the
blob service permanently deletes soft-deleted blobs.

   ::

      <?xml version="1.0" encoding="utf-8"?>
      <EnumerationResults ServiceEndpoint="http://myaccount.blob.example.com/"  ContainerName="mycontainer">
        <Prefix>string-value</Prefix>
        <Marker>string-value</Marker>
        <MaxResults>int-value</MaxResults>
        <Delimiter>string-value</Delimiter>
        <Blobs>
          <Blob>
            <Name>blob-name</name>
            <Deleted>true</Deleted>
            <Properties>
              <Creation-Time>date-time-value</Creation-Time>
              <Last-Modified>date-time-value</Last-Modified>
              <Etag>etag</Etag>
              <Content-Length>size-in-bytes</Content-Length>
              <Content-Type>blob-content-type</Content-Type>
              <Content-Encoding />
              <Content-Language />
              <Content-MD5 />
              <Cache-Control />
              <BlobType>BlockBlob</BlobType>
              <LeaseStatus>unlocked</LeaseStatus>
              <LeaseState>available</LeaseState>
              <CopyId>id</CopyId>
              <CopyStatus>pending | success | aborted | failed </CopyStatus>
              <CopySource>source url</CopySource>
              <CopyProgress>bytes copied/bytes total</CopyProgress>
              <CopyCompletionTime>datetime</CopyCompletionTime>
              <CopyStatusDescription>error string</CopyStatusDescription>
              <ServerEncrypted>true</ServerEncrypted>
              <IncrementalCopy>true</IncrementalCopy>
              <DeletedTime>datetime</DeletedTime>
              <RemainingRetentionDays>no-of-days</RemainingRetentionDays>
            </Properties>
            <Metadata>
              <Name>value</Name>
            </Metadata>
          </Blob>
          <BlobPrefix>
            <Name>blob-prefix</Name>
          </BlobPrefix>
        </Blobs>
        <NextMarker />
      </EnumerationResults>

Sample Response
~~~~~~~~~~~~~~~

See |list-blob-storage| for a sample response.

Authorization
~~~~~~~~~~~~~

If the container's access control list (ACL) is set to allow anonymous access to
the container, any client may call this operation. Otherwise, this operation can
be called by the account owner and by anyone with a Shared Access Signature that
has permission to list blobs in a container.

Remarks
-------

Blob Properties in the Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you have requested uncommitted blobs to be included in the enumeration, some
properties are not set until the blob is committed, and are therefore not
returned in the response.

The ``Content-MD5`` element appears in the response body only if it has been set
on the blob. You can set the ``Content-MD5`` property when the blob is created
or by calling Set Blob Properties. ``Put Blob`` sets a block blob's MD5 value
even when the ``Put Blob`` request doesn't include an MD5 header.

Metadata in the Response
~~~~~~~~~~~~~~~~~~~~~~~~

The ``Metadata`` element is present only if the ``include=metadata`` parameter
was specified on the URI. Within the ``Metadata`` element, the value of each
name-value pair is listed within an element corresponding to the pair's name.

Metadata requested with this parameter must be stored in accordance with the
naming conventions for C# identifiers.

If a metadata name-value pair violates naming restrictions, the response body
indicates the problematic name within an ``x-ms-invalid-name`` element, as shown
in the following XML fragment:

   ::

      <Metadata>
        <MyMetadata1>first value</MyMetadata1>
        <MyMetadata2>second value</MyMetadata2>
        <x-ms-invalid-name>invalid-metadata-name</x-ms-invalid-name>
      </Metadata>

Uncommitted Blobs in the Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Uncommitted blobs are listed in the response only if the
``include=uncommittedblobs`` parameter was specified on the URI. Uncommitted
blobs listed in the response do not include any of the following elements:

  -  ``Last-Modified``
  -  ``Etag``
  -  ``Content-Type``
  -  ``Content-Encoding``
  -  ``Content-Language``
  -  ``Content-MD5``
  -  ``Cache-Control``
  -  ``Metadata``

Deleted Blobs in the Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Deleted blobs are listed in the response only if the ``include=deleted``
parameter was specified on the the URI.

Returning Result Sets Using a Marker Value
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If the number of blobs to return exceeds either a specified or default
``maxresults`` value, the response body will contain a ``NextMarker`` element
that indicates the next blob to return on a subsequent request. To return the
next set of items, specify the value of ``NextMarker`` as the marker parameter
on the URI for the subsequent request.

Treat the value of ``NextMarker`` as opaque.

Using a Delimiter to Traverse the Blob Namespace
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``delimiter`` parameter enables the caller to traverse the blob namespace
using a user-configured delimiter. In this way, you can traverse a virtual
hierarchy of blobs as though it were a file system. The delimiter may be a
single character or a string. When the request includes this parameter, the
operation returns a ``BlobPrefix`` element. The ``BlobPrefix`` element is
returned in place of all blobs whose names begin with the same substring up to
the appearance of the delimiter character. The value of the ``BlobPrefix``
element is ``substring+delimiter``, where ``substring`` is the common substring
that begins one or more blob names, and ``delimiter`` is the value of the
``delimiter`` parameter.

You can use the value of ``BlobPrefix`` to make a subsequent call listing
blobs beginning with this prefix, by specifying the value of ``BlobPrefix`` for
the ``prefix`` parameter on the request URI.

Each ``BlobPrefix`` element returned counts toward the maximum result, just as
each ``Blob`` element does.

Blobs are listed in alphabetical order in the response body, with upper-case
letters listed first.

Copy Errors in CopyStatusDescription
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``CopyStatusDescription`` contains more information about the ``Copy Blob``
failure.

-  When a copy attempt fails and the Blob service is still retrying the
   operation, ``CopyStatus`` is set to ``pending``, and the
   ``CopyStatusDescription`` text describes the failure that may have occurred
   during the last copy attempt.

-  When ``CopyStatus`` is set to ``failed``, the ``CopyStatusDescription`` text
   describes the error that caused the copy operation to fail.

The following table describes the three fields of every
``CopyStatusDescription`` value.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +------------------+--------------------------------------------------------------------------------+
   | Component        | Description                                                                    |
   +==================+================================================================================+
   | HTTP status code | Standard 3-digit integer specifying the failure.                               |
   +------------------+--------------------------------------------------------------------------------+
   | Error code       | Keyword describing error that is provided by Azure in the <ErrorCode> element. |
   |                  | If no <ErrorCode> element appears, a keyword containing standard error text    |
   |                  | associated with the 3-digit HTTP status code in the HTTP specification is      |
   |                  | used. See :ref:`Error Codes`.                                                  |
   +------------------+--------------------------------------------------------------------------------+
   | Information      | Detailed description of failure, in quotes.                                    |
   +------------------+--------------------------------------------------------------------------------+

The following table describes the ``CopyStatus`` and ``CopyStatusDescription``
values of common failure scenarios.

.. important::

   Description text shown here can change without warning, even without a
   version change. Do not rely on matching this exact text.

.. tabularcolumns:: X{0.40\textwidth}X{0.15\textwidth}X{0.40\textwidth}
.. table::

   +----------------------------------------+------------+----------------------------------------------+
   |                                        | CopyStatus |                                              |
   | Scenario                               | Value      | CopyStatusDescription Value                  |
   +========================================+============+==============================================+
   | Copy operation completed successfully. | success    | empty                                        |
   +----------------------------------------+------------+----------------------------------------------+
   | User aborted copy operation before it  | aborted    | empty                                        |
   | completed.                             |            |                                              |
   +----------------------------------------+------------+----------------------------------------------+
   | A failure occurred when reading from   | pending    | 502 BadGateway "Encountered a retryable      |
   | the source blob during a copy          |            | error when reading the source. Will retry.   |
   | operation, but the operation will be   |            | Time of failure: <time>"                     |
   | retried.                               |            |                                              |
   +----------------------------------------+------------+----------------------------------------------+
   | A failure occurred when writing to the | pending    | 500 InternalServerError "Encountered a       |
   | destination blob of a copy operation,  |            | retryable error. Will retry. Time of         |
   | but the operation will be retried.     |            | failure: <time>"                             |
   +----------------------------------------+------------+----------------------------------------------+
   | An unrecoverable failure occurred when | failed     | 404 ResourceNotFound "Copy failed when       |
   | reading from the source blob of a copy |            | reading the source."                         |
   | operation.                             |            |                                              |
   |                                        |            | .. note::                                    |
   |                                        |            |                                              |
   |                                        |            |    When reporting this underlying error,     |
   |                                        |            |    Azure returns ``ResourceNotFound`` in the |
   |                                        |            |    <ErrorCode> element. If no <ErrorCode>    |
   |                                        |            |    element appeared in the response, a       |
   |                                        |            |    standard string representation of the     |
   |                                        |            |    HTTP status such as ``NotFound`` appears. |
   +----------------------------------------+------------+----------------------------------------------+
   | The timeout period limiting all copy   | failed     | 500 OperationCancelled "The copy exceeded    |
   | operations elapsed. (Currently the     |            | the maximum allowed time."                   |
   | timeout period is 2 weeks.)            |            |                                              |
   +----------------------------------------+------------+----------------------------------------------+
   | The copy operation failed too often    | failed     | 500 OperationCancelled "The copy failed when |
   | when reading from the source, and      |            | reading the source."                         |
   | didn't meet a minimum ratio of         |            |                                              |
   | attempts to successes. (This timeout   |            |                                              |
   | prevents retrying a very poor source   |            |                                              |
   | over 2 weeks before failing).          |            |                                              |
   +----------------------------------------+------------+----------------------------------------------+
