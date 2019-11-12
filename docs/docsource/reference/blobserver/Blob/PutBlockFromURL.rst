.. _Put Block From URL:

Put Block From URL
==================

The Put Block From URL operation creates a new block to be committed as part
of a blob where the contents are read from a URL. 

Request
-------

The Put Block From URL request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: ll
.. table::   

   +---------------------------------------------------------------------------------+--------------+
   | PUT Method Request URI                                                          | HTTP Version |
   +=================================================================================+==============+
   | ``https://myaccount.blob.example.com/mycontainer/myblob?comp=block&blockid=id`` | HTTP/1.1     |
   +---------------------------------------------------------------------------------+--------------+


Emulated Storage Service URI
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When making a request against the emulated storage service, specify the emulator
hostname and Blob service port as ``127.0.0.1:10000``, followed by the emulated
storage account name:

.. tabularcolumns:: ll
.. table::   

   +--------------------------------------------------------------------------------------+--------------+
   | PUT Method Request URI                                                               | HTTP Version |
   +======================================================================================+==============+
   | ``http://127.0.0.1:10000/devstoreaccount1/mycontainer/myblob?comp=block&blockid=id`` | HTTP/1.1     |
   +--------------------------------------------------------------------------------------+--------------+

For more information, see |emulator-dev-test|.

URI Parameters
~~~~~~~~~~~~~~

.. tabularcolumns:: ll
.. table::

   +-------------+---------------------------------------------------------+
   | Parameter   | Description                                             |
   +=============+=========================================================+
   | ``blockid`` | Required. A valid Base64 string                         |
   |             | value that identifies the block.                        |
   |             | Before encoding, the string                             |
   |             | must be less than or equal to 64 bytes.                 |
   |             | For a given blob, the value specified for the           |
   |             | ``blockid`` parameter must be the                       |
   |             | same length for each block.                             |
   |             | The Base64 string must be URL-encoded.                  |
   +-------------+---------------------------------------------------------+
   | ``timeout`` | Optional. The ``timeout`` parameter is expressed in     |
   |             | seconds. For more information, see |set-blob-timeouts|. |
   +-------------+---------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: ll
.. table::

   +-------------------------------+---------------------------------------------+
   | Request Header                | Description                                 |
   +===============================+=============================================+
   | ``Authorization``             | Required. Specifies the                     |
   |                               | authorization scheme, account               |
   |                               | name, and signature. See                    |
   |                               | |authorize-requests| for more               |
   |                               | information.                                |
   +-------------------------------+---------------------------------------------+
   | ``Date`` or ``x-ms-date``     | Required. Specifies the                     |
   |                               | Coordinated Universal Time (UTC)            |
   |                               | for the request. For more                   |
   |                               | information, see |authorize-requests|.      |
   +-------------------------------+---------------------------------------------+
   | ``x-ms-version``              | Required for all authorized                 |
   |                               | requests. Specifies the version             |
   |                               | of the operation to use for this            |
   |                               | request. For more information,              |
   |                               | see |azure-versioning|.                     |
   +-------------------------------+---------------------------------------------+
   | ``Content-Length``            | Required. Specifies the number of           |
   |                               | bytes being transmitted in the              |
   |                               | request body. The value of this             |
   |                               | header must be set to zero, or the          |
   |                               | operation fails with status code 400        |
   |                               | (Bad Request).                              |
   +-------------------------------+---------------------------------------------+
   | ``x-ms-copy-source:name``     | Required. Specifies the URL of              |
   |                               | the source blob. The value may be           |
   |                               | an up-to-2 KB-long URL                      |
   |                               | that specifies a blob. The value            |
   |                               | should be URL-encoded as it would           |
   |                               | appear in a request URI. The                |
   |                               | source blob must either be public           |
   |                               | or must be authorized via a                 |
   |                               | shared access signature. If the             |
   |                               | source blob is public, no                   |
   |                               | authorization is required to                |
   |                               | perform the operation. Here is an           |
   |                               | example source object URL:                  |
   |                               |                                             |
   |                               | - ``https://myaccount.blob.example.com/     |
   |                               |   mycontainer/myblob``                      |
   |                               |                                             |
   +-------------------------------+---------------------------------------------+
   | ``x-ms-source-range``         | Optional. Uploads only the bytes            |
   |                               | of the blob in the source URL in            |
   |                               | the specified range. If this is             |
   |                               | not specified, the entire contents of the   |
   |                               | source blob are uploaded as a single block. |
   |                               | See |range-header| for more information.    |
   +-------------------------------+---------------------------------------------+
   | ``x-ms-source-content-md5``   | Optional. An MD5 hash of the                |
   |                               | block content from the URI. This            |
   |                               | hash is used to verify the                  |
   |                               | integrity of the block during data          |
   |                               | transport from the URI. When this header is |
   |                               | specified, the storage service              |
   |                               | compares the hash of the content            |
   |                               | that has arrived from the                   |
   |                               | copy-source with this header value.         |
   |                               | This MD5 hash is not stored with the blob.  |
   |                               | If the two hashes do not match,             |
   |                               | the operation fails with error code 400     |
   |                               | (Bad Request).                              |
   +-------------------------------+---------------------------------------------+
   | ``x-ms-source-content-crc64`` | Not applicable (This header is not          |
   |                               | supported for Zenko version |version|).     |
   +-------------------------------+---------------------------------------------+
   | ``x-ms-lease-id:<ID>``        | Required if the blob has an                 |
   |                               | active lease. To perform this               |
   |                               | operation on a blob with an                 |
   |                               | active lease, specify the valid             |
   |                               | lease ID for this header.                   |
   +-------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``    | Optional. Provides a                        |
   |                               | client-generated, opaque value              |
   |                               | with a 1 KB character limit that            |
   |                               | is recorded in the analytics logs           |
   |                               | when storage analytics logging is           |
   |                               | enabled. Use this header to correlate       |
   |                               | client-side activities with requests        |
   |                               | received by the server. For more            |
   |                               | information, see |analytics-log| and        |
   |                               | |storage-tracking|.                         |
   +-------------------------------+---------------------------------------------+

Request Body
~~~~~~~~~~~~

None

Sample Request
~~~~~~~~~~~~~~

::

   Request Syntax:  
   PUT https://myaccount.blob.example.com/mycontainer/myblob?comp=block&blockid=AAAAAA%3D%3D HTTP/1.1  
     
   Request Headers:  
   x-ms-version: 2018-03-28  
   x-ms-date: Sat, 31 Mar 2018 14:37:35 GMT    
   Authorization: SharedKey myaccount:J4ma1VuFnlJ7yfk/Gu1GxzbfdJloYmBPWlfhZ/xn7GI=  
   Content-Length: 0
   x-ms-copy-source: https://myaccount.blob.example.com/mycontainer/myblob
   x-ms-source-range: bytes=0-499

Response
--------

The response includes an HTTP status code and a set of response headers.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 201 (Created).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: ll
.. table::

   +-----------------------------------------------+---------------------------------------------+
   | Response Header                               | Description                                 |
   +===============================================+=============================================+
   | ``Content-MD5``                               | This header is returned so that             |
   |                                               | the client can check for message            |
   |                                               | content integrity. The value of             |
   |                                               | this header is computed by the              |
   |                                               | Blob service; it is not                     |
   |                                               | necessarily the same value                  |
   |                                               | specified in the request headers.           |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-content-crc64``                        | Not applicable (this header is              |
   |                                               | not supported for Zenko version             |
   |                                               | |version|).                                 |
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
   | ``x-ms-request-server-encrypted: true/false`` | The value of this header is set to ``true`` |
   |                                               | if the contents of the block are            |
   |                                               | successfully encrypted using the specified  |
   |                                               | algorithm, and ``false`` otherwise.         |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-encryption-key-sha256``                | Not applicable (this header is              |
   |                                               | not supported for Zenko version             |
   |                                               | |version|).                                 |
   +-----------------------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``                    | This header can be used to                  |
   |                                               | troubleshoot requests and                   |
   |                                               | corresponding responses. The                |
   |                                               | value of this header is equal to            |
   |                                               | the value of the ``x-ms-client-request-id`` |
   |                                               | header if it is present in the request      |
   |                                               | and the value is at most 1024               |
   |                                               | visible ASCII characters. If the            |
   |                                               | ``x-ms-client-request-id`` header           |
   |                                               | is not present in the request, this header  |
   |                                               | will not be present in the in the response. |
   +-----------------------------------------------+---------------------------------------------+

Sample Response
~~~~~~~~~~~~~~~

   ::

      Response Status:  
      HTTP/1.1 201 Created  
        
      Response Headers:  
      Transfer-Encoding: chunked  
      x-ms-content-crc64: 77uWZTolTHU  
      Date: Sat, 31 Mar 2018 23:47:09 GMT  
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0  

Authorization
~~~~~~~~~~~~~

This operation can be called by the account owner and by anyone with a Shared
Access Signature that has permission to write to this blob or its container.

Remarks
-------

Put Block From URL uploads a block for future inclusion in a block blob. A
block blob can include a maximum of 50,000 blocks. Each block can be a different
size, up to a maximum of 100 MB. The maximum size of a block blob is therefore
slightly more than 4.75 TB (100 MB X 50,000 blocks).

A blob can have a maximum of 100,000 uncommitted blocks at any given time. The
set of uncommitted blocks cannot exceed 9.52 TB in total size. If this maximum
is exceeded, the service returns status code 409
(RequestEntityTooLargeBlockCountExceedsLimit).

After you have uploaded a set of blocks, you can create or update the blob on
the server from this set by calling the Put Block List operation. Each block in
the set is identified by a block ID that is unique within that blob. Block IDs
are scoped to a particular blob, so different blobs can have blocks with same
IDs.

If you call Put Block From URL on a blob that does not yet exist, a new block
blob is created with a content length of 0. This blob is enumerated by the List
Blobs operation if the ``include=uncommittedblobs`` option is specified. The
block or blocks that you uploaded are not committed until you call Put Block
List on the new blob. A blob created this way is maintained on the server for a
week; if no more blocks are added or committed to the blob within that time, the
blob is garbage-collected.

A block that has been successfully uploaded with Put Block From URL does not
become part of a blob until it is committed with Put Block List. Before Put
Block List is called to commit the new or updated blob, any calls to Get Blob
return the blob contents without the uncommitted block.

If you upload a block that has the same block ID as another block that has not
yet been committed, the last uploaded block with that ID is committed on
the next successful Put Block List operation.

After Put Block List is called, all uncommitted blocks specified in the block
list are committed as part of the new blob. Any uncommitted blocks not specified
in the block list for the blob are garbage-collected and removed from the Blob
service. Any uncommitted blocks are also garbage-collected if there are no
successful calls to Put Block From URL or Put Block List on the same blob within
a week following the last successful Put Block From URL operation. If Put Blob
is called on the blob, any uncommitted blocks are garbage-collected.

If the blob has an active lease, the client must specify a valid lease ID on the
request in order to write a block to the blob. If the client does not specify a
lease ID, or specifies an invalid lease ID, the Blob service returns status code
412 (Precondition Failed). If the client specifies a lease ID but the blob does
not have an active lease, the Blob service also returns status code 412
(Precondition Failed).

For a given blob, all block IDs must be the same length. If a block is uploaded
with a block ID of a different length than the block IDs for any existing
uncommitted blocks, the service returns error response code 400 (Bad Request).

Calling Put Block From URL does not update the last modified time of an existing
blob.


