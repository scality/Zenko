.. _Copy Blob:

Copy Blob
=========

The Copy Blob operation copies a blob to a destination within the storage
account.

The source for a Copy Blob operation can be a committed blob or Azure file in
any Azure storage account.


Request
-------

A Copy Blob request may be constructed as follows. HTTPS is recommended. Replace
``myaccount`` with the name of your storage account, ``mycontainer`` with the
name of your container, and ``myblob`` with the name of your destination blob.

You may specify a shared access signature for the destination blob if it is in
the same account as the source blob. You may also specify a shared access
signature for the destination blob if it is in a different storage account.

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

   +-------------+--------------------------------------------------------------+
   | Parameter   | Description                                                  |
   +=============+==============================================================+
   | ``timeout`` | Optional. The ``timeout`` parameter is expressed in seconds. |
   |             | For more information, see Setting Timeouts for Blob Service  |
   |             | Operations.                                                  |
   +-------------+--------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::
   :class: longtable

   +-------------------------------------+---------------------------------------------+
   | Request Header                      | Description                                 |
   +=====================================+=============================================+
   | ``Authorization``                   | Required. Specifies the                     |
   |                                     | authorization scheme, account               |
   |                                     | name, and signature. For more               |
   |                                     | information, see |authorize-requests|.      |
   +-------------------------------------+---------------------------------------------+
   | ``Date`` or ``x-ms-date``           | Required. Specifies the                     |
   |                                     | Coordinated Universal Time (UTC)            |
   |                                     | for the request. For more                   |
   |                                     | information, see |authorize-requests|.      |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-version``                    | Required for all authorized                 |
   |                                     | requests. For more information,             |
   |                                     | see |azure-versioning|.                     |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-meta-name:value``            | Optional. Specifies a                       |
   |                                     | user-defined name-value pair                |
   |                                     | associated with the blob. If no             |
   |                                     | name-value pairs are specified,             |
   |                                     | the operation copies the                    |
   |                                     | metadata from the source blob or            |
   |                                     | file to the destination blob. If            |
   |                                     | one or more name-value pairs are            |
   |                                     | specified, the destination blob             |
   |                                     | is created with the specified               |
   |                                     | metadata, and metadata is not               |
   |                                     | copied from the source blob or              |
   |                                     | file.                                       |
   |                                     |                                             |
   |                                     | .. note::                                   |
   |                                     |                                             |
   |                                     |   Metadata names must adhere to the naming  |
   |                                     |   rules for C# identifiers. See             |
   |                                     |   |naming-referencing| for more information.|
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-source-if-modified-since``   | Optional. A ``DateTime`` value.             |
   |                                     | Specify this conditional header             |
   |                                     | to copy the blob only if the                |
   |                                     | source blob has been modified               |
   |                                     | since the specified date/time. If           |
   |                                     | the source blob has not been                |
   |                                     | modified, the Blob service                  |
   |                                     | returns status code 412                     |
   |                                     | (Precondition Failed). This                 |
   |                                     | header cannot be specified if the           |
   |                                     | source is an Azure File.                    |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-source-if-unmodified-since`` | Optional. A ``DateTime`` value.             |
   |                                     | Specify this conditional header             |
   |                                     | to copy the blob only if the                |
   |                                     | source blob has not been modified           |
   |                                     | since the specified date/time. If           |
   |                                     | the source blob has been                    |
   |                                     | modified, the Blob service                  |
   |                                     | returns status code 412                     |
   |                                     | (Precondition Failed). This                 |
   |                                     | header cannot be specified if the           |
   |                                     | source is an Azure File.                    |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-source-if-match``            | Optional. An ETag value. Specify            |
   |                                     | this conditional header to copy             |
   |                                     | the source blob only if its ETag            |
   |                                     | matches the value specified. If             |
   |                                     | the ETag values do not match, the           |
   |                                     | Blob service returns status code            |
   |                                     | 412 (Precondition Failed). This             |
   |                                     | header cannot be specified if the           |
   |                                     | source is an Azure File.                    |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-source-if-none-match``       | Optional. An ETag value. Specify            |
   |                                     | this conditional header to copy             |
   |                                     | the blob only if its ETag does              |
   |                                     | not match the value specified. If           |
   |                                     | the values are identical, the               |
   |                                     | Blob service returns status code            |
   |                                     | 412 (Precondition Failed). This             |
   |                                     | header cannot be specified if the           |
   |                                     | source is an Azure File.                    |
   +-------------------------------------+---------------------------------------------+
   | ``If-Modified-Since``               | Optional. A ``DateTime`` value.             |
   |                                     | Specify this conditional header             |
   |                                     | to copy the blob only if the                |
   |                                     | destination blob has been                   |
   |                                     | modified since the specified                |
   |                                     | date/time. If the destination               |
   |                                     | blob has not been modified, the             |
   |                                     | Blob service returns status code            |
   |                                     | 412 (Precondition Failed).                  |
   +-------------------------------------+---------------------------------------------+
   | ``If-Unmodified-Since``             | Optional. A ``DateTime`` value.             |
   |                                     | Specify this conditional header             |
   |                                     | to copy the blob only if the                |
   |                                     | destination blob has not been               |
   |                                     | modified since the specified                |
   |                                     | date/time. If the destination               |
   |                                     | blob has been modified, the Blob            |
   |                                     | service returns status code 412             |
   |                                     | (Precondition Failed).                      |
   +-------------------------------------+---------------------------------------------+
   | ``If-Match``                        | Optional. An ETag value. Specify            |
   |                                     | an ETag value for this                      |
   |                                     | conditional header to copy the              |
   |                                     | blob only if the specified ETag             |
   |                                     | value matches the ``ETag`` value            |
   |                                     | for an existing destination blob.           |
   |                                     | If the ETag for the destination             |
   |                                     | blob does not match the ETag                |
   |                                     | specified for ``If-Match``, the             |
   |                                     | Blob service returns status code            |
   |                                     | 412 (Precondition Failed).                  |
   +-------------------------------------+---------------------------------------------+
   | ``If-None-Match``                   | Optional. An ETag value, or the             |
   |                                     | wildcard character (\*).                    |
   |                                     | Specify an ETag value for this              |
   |                                     | conditional header to copy the              |
   |                                     | blob only if the specified ETag             |
   |                                     | value does not match the ETag               |
   |                                     | value for the destination blob.             |
   |                                     | Specify the wildcard character              |
   |                                     | (\*) to perform the operation only          |
   |                                     | if the destination blob does not            |
   |                                     | exist.                                      |
   |                                     | If the specified condition isn't            |
   |                                     | met, the Blob service returns               |
   |                                     | status code 412 (Precondition               |
   |                                     | Failed).                                    |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-copy-source:name``           | Required. Specifies the name of             |
   |                                     | the source blob or file.                    |
   |                                     | This value may be an up-to-2 KB long URL    |
   |                                     | that specifies a blob. The value            |
   |                                     | must be URL-encoded as it would             |
   |                                     | appear in a request URI. A source           |
   |                                     | blob in the same storage account            |
   |                                     | can be authorized via Shared Key.           |
   |                                     | However, if the source is a blob            |
   |                                     | in another account, the source              |
   |                                     | blob must either be public or               |
   |                                     | must be authorized via a shared             |
   |                                     | access signature. If the source             |
   |                                     | blob is public, no authorization            |
   |                                     | is required to perform the copy             |
   |                                     | operation.                                  |
   |                                     |                                             |
   |                                     | The source object may be a file in the      |
   |                                     | Azure File service. If the source object is |
   |                                     | a file that is to be copied to a            |
   |                                     | blob, then the source file must             |
   |                                     | be authorized using a shared                |
   |                                     | access signature, whether it                |
   |                                     | resides in the same account or in           |
   |                                     | a different account.                        |
   |                                     |                                             |
   |                                     | Here is an example of a source object URL:  |
   |                                     |                                             |
   |                                     | ``https://myaccount.blob.example.com/       |
   |                                     | mycontainer/myblob``                        |
   |                                     |                                             |
   |                                     | When the source object is a file            |
   |                                     | in the Azure File service, the              |
   |                                     | source URL uses the following               |
   |                                     | format; note that the URL must              |
   |                                     | include a valid SAS token for the           |
   |                                     | file:                                       |
   |                                     |                                             |
   |                                     | ``https://myaccount.file.example.com/       |
   |                                     | myshare/mydirectorypath/myfile?sastoken``   |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-lease-id``                   | Not applicable (Zenko version |version|     |
   |                                     | does not support leasing).                  |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-source-lease-id``            | Not applicable (Zenko version |version|     |
   |                                     | does not support leasing).                  |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``          | Optional. Provides a                        |
   |                                     | client-generated, opaque value              |
   |                                     | with a 1 KB character limit that            |
   |                                     | is recorded in the analytics logs           |
   |                                     | when storage analytics logging is           |
   |                                     | enabled. Using this header is               |
   |                                     | recommended for correlating client-side     |
   |                                     | activities with requests received           |
   |                                     | by the server. For more                     |
   |                                     | information, see |analytics-log|            |
   |                                     | and |storage-tracking|.                     |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-access-tier``                | Not applicable (tiering is not              |
   |                                     | supported in Zenko version |version|.)      |
   +-------------------------------------+---------------------------------------------+
   | ``x-ms-rehydrate-priority``         | Not applicable (tiering is not              |
   |                                     | supported in Zenko version |version|.)      |
   +-------------------------------------+---------------------------------------------+

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

   +-----------------------------------+-----------------------------------+
   | Response Header                   | Description                       |
   +===================================+===================================+
   | ``ETag``                          | If the copy is complete, contains |
   |                                   | the ETag of the destination blob. |
   |                                   | If the copy isn't complete,       |
   |                                   | contains the ETag of the empty    |
   |                                   | blob created at the start of the  |
   |                                   | copy. ETag values are returned in |
   |                                   | quotes.                           |
   +-----------------------------------+-----------------------------------+
   | ``Last-Modified``                 | Returns the date/time that the    |
   |                                   | copy operation to the destination |
   |                                   | blob completed.                   |
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
   |                                   | by the service that indicates the |
   |                                   | time at which the response was    |
   |                                   | initiated.                        |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-copy-id: <id>``            | String identifier for this copy   |
   |                                   | operation. Use with ``Get Blob``  |
   |                                   | or ``Get Blob Properties`` to     |
   |                                   | check the status of this copy     |
   |                                   | operation, or pass to             |
   |                                   | ``Abort Copy Blob`` to abort a    |
   |                                   | pending copy.                     |
   +-----------------------------------+-----------------------------------+
   | ``x-ms-copy-status: <success \|   | State of the copy operation, with |
   | pending>``                        | these values:                     |
   |                                   |                                   |
   |                                   | - ``success``: the copy           |
   |                                   |   completed successfully.         |
   |                                   | - ``pending``: the copy is in     |
   |                                   |   progress.                       |
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

Sample Response
~~~~~~~~~~~~~~~

The following is a sample response for a request to copy a blob:

   ::

      Response Status:
      HTTP/1.1 202 Accepted

      Response Headers:
      Last-Modified: <date>
      ETag: "0x8CEB669D794AFE2"
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
      x-ms-request-id: cc6b209a-b593-4be1-a38a-dde7c106f402
      x-ms-version: 2015-02-21
      x-ms-copy-id: 1f812371-a41d-49e6-b123-f4b542e851c5
      x-ms-copy-status: pending
      Date: <date>

Authorization
~~~~~~~~~~~~~

This operation can be called by the account owner. A shared access signature
that has permission to write to the destination blob or its container is
supported for copy operations within the same account. The shared access
signature specified on the request applies only to the destination blob.

Access to the source blob or file is authorized separately, as described in the
details for the ``x-ms-copy-source`` request header.

The following table describes how the destination and source objects for a Copy
Blob operation may be authorized.

.. tabularcolumns:: X{0.30\textwidth}X{0.20\textwidth}X{0.20\textwidth}X{0.20\textwidth}
.. table::

   +---------------------------------+--------------------+--------------------+--------------------+
   |                                 | Authorization with | Authorization with | Public Object Not  |
   |                                 | Shared Key/Shared  | Shared Access      | Requiring          |
   |                                 | Key Lite           | Signature          | Authorization      |
   +=================================+====================+====================+====================+
   | Destination blob                | Yes                | Yes                | No                 |
   +---------------------------------+--------------------+--------------------+--------------------+
   | Source blob in same account     | Yes                | Yes                | Yes                |
   +---------------------------------+--------------------+--------------------+--------------------+
   | Source blob in another account  | No                 | Yes                | Yes                |
   +---------------------------------+--------------------+--------------------+--------------------+
   | Source file in the same account | No                 | Yes                | N/A                |
   | or another account              |                    |                    |                    |
   +---------------------------------+--------------------+--------------------+--------------------+

Remarks
-------

The Copy Blob operation can complete asynchronously. This operation returns a
copy ID you can use to check or abort the copy operation. The Blob service
copies blobs on a best-effort basis.

The source blob for a copy operation must be a block blob. If the destination
blob already exists, it must be of the same blob type as the source blob. Any
existing destination blob will be overwritten. The destination blob cannot be
modified while a copy operation is in progress.

The source for the copy operation may also be a file in the Azure File
service. If the source is a file, the destination must be a block blob.

Multiple pending Copy Blob operations within an account might be processed
sequentially. A destination blob can only have one outstanding copy blob
operation. In other words, a blob cannot be the destination for multiple pending
Copy Blob operations. An attempt to Copy Blob to a destination blob that already
has a copy pending fails with status code 409 (Conflict).

The Copy Blob operation can copy from another storage account.

The Copy Blob operation always copies the entire source blob or file;
copying a range of bytes or set of blocks is not supported.

A Copy Blob operation can take any of the following forms:

-  You can copy a source blob to a destination blob with a different name. The
   destination blob can be an existing blob of the same blob type (only block
   blob types are supported in Zenko version |version|), or can be a new blob
   created by the copy operation.

-  You can copy a source blob to a destination blob with the same name,
   effectively replacing the destination blob. Such a copy operation removes any
   uncommitted blocks and overwrites the blob's metadata.

-  You can copy a source file in the Azure File service to a destination
   blob. The destination blob can be an existing block blob, or can be a new
   block blob created by the copy operation.

For a block blob, the Blob service creates a committed blob of zero length
before returning from this operation.

When copying from a block blob, all committed blocks and their block IDs are
copied. Uncommitted blocks are not copied. At the end of the copy operation, the
destination blob will have the same committed block count as the source.

You can call Get Blob or Get Blob Properties on the destination blob to check
the status of the copy operation. The final blob will be committed when the copy
completes.

When the source of a copy operation provides ETags, if there are any changes to
the source while the copy is in progress, the copy will fail. An attempt to
change the destination blob while a copy is in progress will fail with 409
Conflict.

The ETag for a block blob changes when the Copy Blob operation is initiated and
when the copy finishes. The contents of a block blob are only visible using a
GET after the full copy completes.

Copying Blob Properties and Metadata
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When a blob is copied, the following system properties are copied to the
destination blob with the same values:

-  ``Content-Type``
-  ``Content-Encoding``
-  ``Content-Language``
-  ``Content-Length``
-  ``Cache-Control``
-  ``Content-MD5``
-  ``Content-Disposition``

The source blob's committed block list is also copied to the destination blob,
if the blob is a block blob. Any uncommitted blocks are not copied.

The destination blob is always the same size as the source blob, so the value of
the ``Content-Length`` header for the destination blob matches that for the
source blob.

When the source blob and destination blob are the same, Copy Blob removes
any uncommitted blocks. If metadata is specified in this case, the existing
metadata is overwritten with the new metadata.

Working with a Pending Copy
~~~~~~~~~~~~~~~~~~~~~~~~~~~

If the Copy Blob operation completes the copy asynchronously, use the
following table to determine the next step based on the status code returned by
Copy Blob:

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +---------------------------+----------------------------------------------------------+
   | Status Code               | Meaning                                                  |
   +===========================+==========================================================+
   | 202 (Accepted),           | Copy completed successfully.                             |
   | x-ms-copy-status: success |                                                          |
   +---------------------------+----------------------------------------------------------+
   | 202 (Accepted),           | Copy has not completed. Poll the destination blob using  |
   | x-ms-copy-status: pending | ``Get Blob Properties`` to examine the x-ms-copy-status  |
   |                           | until copy completes or fails.                           |
   +---------------------------+----------------------------------------------------------+
   | 4xx, 500, or 503          | Copy failed.                                             |
   +---------------------------+----------------------------------------------------------+

During and after a Copy Blob operation, the properties of the destination
blob contain the copy ID of the Copy Blob operation and URL of the source
blob. When the copy completes, the Blob service writes the time and outcome
value (``success``, ``failed``, or ``aborted``) to the destination blob
properties. If the operation ``failed``, the ``x-ms-copy-status-description``
header contains an error detail string.

A pending Copy Blob operation has a two-week timeout. A copy attempt that has
not completed after two weeks times out and leaves an empty blob with the
``x-ms-copy-status`` field set to ``failed`` and the
``x-ms-copy-status-description`` set to 500 (OperationCancelled).  Intermittent,
non-fatal errors that can occur during a copy might impede progress of the copy
but not cause it to fail. In these cases, ``x-ms-copy-status-description``
describes the intermittent errors.

If the Copy Blob operation completes synchronously, use the following table
to determine the status of the copy operation:

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +---------------------------+----------------------------------+
   | Status Code               | Meaning                          |
   +===========================+==================================+
   | 202 (Accepted),           | Copy completed successfully.     |
   | x-ms-copy-status: success |                                  |
   +---------------------------+----------------------------------+
   | 4xx, 500, or 503          | Copy failed.                     |
   +---------------------------+----------------------------------+
