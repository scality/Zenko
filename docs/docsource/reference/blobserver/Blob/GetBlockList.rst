.. _Get Block List:

Get Block List
==============

The Get Block List operation retrieves the list of blocks that have been
uploaded as part of a block blob.

Two block lists are maintained for a blob:

-  **Committed Block List:** The list of blocks that have been successfully
   committed to a given blob with Put Block List.

-  **Uncommitted Block List:** The list of blocks that have been uploaded for a
   blob using Put Block, but are not yet committed. These blocks are stored in
   Azure in association with a blob, but do not yet form part of the blob.

You can call Get Block List to return the committed block list, the uncommitted
block list, or both.

Request
-------

The Get Block List request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+--------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                              | HTTP Version |
   +========+==========================================================================+==============+
   | GET    | ``https://myaccount.blob.example.com/mycontainer/myblob?comp=blocklist`` | HTTP/1.1     |
   +--------+--------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.20\textwidth}X{0.75\textwidth}
.. table::

   +-------------------+----------------------------------------------------+
   | URI Parameter     | Description                                        |
   +===================+====================================================+
   | ``snapshot``      | Not applicable (Zenko version |version| does not   |
   |                   | support snapshots).                                |
   +-------------------+----------------------------------------------------+
   | ``blocklisttype`` | Specifies whether to return the list of committed  |
   |                   | blocks, the list of uncommitted blocks, or both    |
   |                   | lists together. Valid values are ``committed``,    |
   |                   | ``uncommitted``, or ``all``. If you omit this      |
   |                   | parameter, ``Get Block List`` returns the list of  |
   |                   | committed blocks.                                  |
   +-------------------+----------------------------------------------------+
   | ``timeout``       | Optional. The ``timeout`` parameter is expressed   |
   |                   | in seconds. For more information, see              |
   |                   | |set-blob-timeouts|.                               |
   +-------------------+----------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+---------------------------------------------+
   | Request Header             | Description                                 |
   +============================+=============================================+
   | ``Authorization``          | Required. Specifies the                     |
   |                            | authorization scheme, account               |
   |                            | name, and signature. For more               |
   |                            | information, see |authorize-requests|.      |
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
   | ``x-ms-lease-id``          | Not applicable (Zenko version |version|     |
   |                            | does not support leasing).                  |
   +----------------------------+---------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a                        |
   |                            | client-generated, opaque value              |
   |                            | with a 1 KB character limit that            |
   |                            | is recorded in the analytics logs           |
   |                            | when storage analytics logging is           |
   |                            | enabled. Use this header to                 |
   |                            | correlate client-side                       |
   |                            | activities with requests received           |
   |                            | by the server. For more                     |
   |                            | information, see |analytics-log| and        |
   |                            | |storage-tracking|.                         |
   +----------------------------+---------------------------------------------+

Request Body
~~~~~~~~~~~~

None

Sample Request
~~~~~~~~~~~~~~

The following sample request URI returns the committed block list for a blob
named MOV1.avi:

::

   GET http://myaccount.blob.example.com/movies/MOV1.avi?comp=blocklist&blocklisttype=committed HTTP/1.1

The following sample request URI returns both the committed and uncommitted
block lists:

::

   GET http://myaccount.blob.example.com/movies/MOV1.avi?comp=blocklist&blocklisttype=all HTTP/1.1

Response
--------

The response includes an HTTP status code, a set of response headers, and a
response body containing the list of blocks.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 200 (OK).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +------------------------------+---------------------------------------------------+
   | Response Header              | Description                                       |
   +==============================+===================================================+
   | ``Last-Modified``            | The date/time the blob was                        |
   |                              | last modified. The date format                    |
   |                              | follows RFC 1123. See |date-time-headers|         |
   |                              | for more information. This header is              |
   |                              | returned only if the blob has                     |
   |                              | committed blocks.                                 |
   |                              | Any operation that modifies the                   |
   |                              | blob, including updates to the                    |
   |                              | blob's metadata or properties,                    |
   |                              | changes the blob's last-modified time.            |
   +------------------------------+---------------------------------------------------+
   | ``ETag``                     | The ETag for the blob. This                       |
   |                              | header is returned only if the                    |
   |                              | blob has committed blocks.                        |
   +------------------------------+---------------------------------------------------+
   | ``Content-Type``             | The MIME content type of the                      |
   |                              | blob. The default value is ``application/xml``.   |
   +------------------------------+---------------------------------------------------+
   | ``x-ms-blob-content-length`` | The size of the blob in bytes.                    |
   +------------------------------+---------------------------------------------------+
   | ``x-ms-request-id``          | This header uniquely identifies                   |
   |                              | the request that was made and can                 |
   |                              | be used for troubleshooting the                   |
   |                              | request. For more information,                    |
   |                              | see |api-troubleshoot|.                           |
   +------------------------------+---------------------------------------------------+
   | ``x-ms-version``             | Indicates the version of the Blob                 |
   |                              | service used to execute the                       |
   |                              | request. Only the committed block                 |
   |                              | list can be returned via an                       |
   |                              | anonymous request.                                |
   +------------------------------+---------------------------------------------------+
   | ``Date``                     | A UTC date/time value generated                   |
   |                              | by the service that indicates the                 |
   |                              | time at which the response was                    |
   |                              | initiated.                                        |
   +------------------------------+---------------------------------------------------+
   | ``x-ms-client-request-id``   | This header can be used to                        |
   |                              | troubleshoot requests and                         |
   |                              | corresponding responses. The                      |
   |                              | value of this header is equal to                  |
   |                              | the value of the                                  |
   |                              | ``x-ms-client-request-id`` header                 |
   |                              | if it is present in the request                   |
   |                              | and the value is at most 1024                     |
   |                              | visible ASCII characters. If the                  |
   |                              | ``x-ms-client-request-id`` header                 |
   |                              | is not present in the request,                    |
   |                              | this header will not be present                   |
   |                              | in the response.                                  |
   +------------------------------+---------------------------------------------------+

This operation also supports the use of conditional headers to get the block
list only if a specified condition is met. For more information, see
|conditional-headers|.

Response Body
~~~~~~~~~~~~~

The format of the response body for a request that returns only committed blocks
is as follows:

   ::

      <?xml version="1.0" encoding="utf-8"?>
      <BlockList>
        <CommittedBlocks>
          <Block>
            <Name>base64-encoded-block-id</Name>
            <Size>size-in-bytes</Size>
          </Block>
        <CommittedBlocks>
      </BlockList>

The format of the response body for a request that returns both committed and
uncommitted blocks is as follows:

   ::


      <?xml version="1.0" encoding="utf-8"?>
      <BlockList>
        <CommittedBlocks>
           <Block>
              <Name>base64-encoded-block-id</Name>
              <Size>size-in-bytes</Size>
           </Block>
        </CommittedBlocks>
        <UncommittedBlocks>
          <Block>
            <Name>base64-encoded-block-id</Name>
            <Size>size-in-bytes</Size>
          </Block>
        </UncommittedBlocks>
       </BlockList>


Sample Response
~~~~~~~~~~~~~~~

In the following example, the ``blocklisttype`` parameter was set to
``committed``, so only the blob's committed blocks are returned in the response.

   ::

      HTTP/1.1 200 OK
      Transfer-Encoding: chunked
      Content-Type: application/xml
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
      x-ms-request-id: 42da571d-34f4-4d3e-b53e-59a66cb36f23
      Date: Sun, 25 Sep 2011 00:33:19 GMT

      <?xml version="1.0" encoding="utf-8"?>
      <BlockList>
        <CommittedBlocks>
          <Block>
            <Name>BlockId001</Name>
            <Size>4194304</Size>
          </Block>
          <Block>
            <Name>BlockId002</Name>
            <Size>4194304</Size>
          </Block>
        </CommittedBlocks>
      </BlockList>

In this example, the ``blocklisttype`` parameter was set to ``all``, and both
the blob's committed and uncommitted blocks are returned in the response.

   ::

      HTTP/1.1 200 OK
      Transfer-Encoding: chunked
      Content-Type: application/xml
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
      x-ms-request-id: 42da571d-34f4-4d3e-b53e-59a66cb36f23
      Date: Sun, 25 Sep 2011 00:35:56 GMT

      <?xml version="1.0" encoding="utf-8"?>
      <BlockList>
        <CommittedBlocks>
          <Block>
            <Name>BlockId001</Name>
            <Size>4194304</Size>
          </Block>
          <Block>
            <Name>BlockId002</Name>
            <Size>4194304</Size>
          </Block>
        </CommittedBlocks>
        <UncommittedBlocks>
          <Block>
            <Name>BlockId003</Name>
            <Size>4194304</Size>
          </Block>
          <Block>
            <Name>BlockId004</Name>
            <Size>1024000</Size>
          </Block>
        </UncommittedBlocks>
      </BlockList>

In this next example, the ``blocklisttype`` parameter was set to ``all``, but
the blob has not yet been committed, so the ``CommittedBlocks`` element is
empty.

   ::

      HTTP/1.1 200 OK
      Transfer-Encoding: chunked
      Content-Type: application/xml
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
      x-ms-request-id: 42da571d-34f4-4d3e-b53e-59a66cb36f23
      Date: Wed, 14 Sep 2011 00:40:22 GMT

      <?xml version="1.0" encoding="utf-8"?>
      <BlockList>
        <CommittedBlocks />
        <UncommittedBlocks>
          <Block>
            <Name>BlockId001</Name>
            <Size>1024</Size>
          </Block>
          <Block>
            <Name>BlockId002</Name>
            <Size>1024</Size>
          </Block>
          <Block>
            <Name>BlockId003</Name>
            <Size>1024</Size>
          </Block>
          <Block>
            <Name>BlockId004</Name>
            <Size>1024</Size>
          </Block>
        </UncommittedBlocks>
      </BlockList>

Authorization
~~~~~~~~~~~~~

If the container's ACL is set to allow anonymous access, any client may call Get
Block List; however, only committed blocks can be accessed publicly. Access to
the uncommitted block list is restricted to the account owner and to anyone
using a Shared Access Signature that has permission to read this blob or its
container.

Remarks
-------

Call Get Block List to return the list of blocks that have been committed to a
block blob, the list of blocks that have not yet been committed, or both
lists. Use the ``blocklisttype`` parameter to specify which list of blocks to
return. The list of committed blocks is returned in the same order they were
committed by the Put Block List operation.

You can use the uncommitted block list to determine which blocks are missing
from the blob in cases where calls to Put Block or Put Block List have
failed. The list of uncommitted blocks is returned in alphabetical order. If a
block ID has been uploaded more than once, only the most recently uploaded block
appears in the list.

.. note::

   When a blob has not yet been committed, calling Get Block List with
   ``blocklisttype=all`` returns the uncommitted blocks, and the
   ``CommittedBlocks`` element is empty.

Get Block List does not support concurrency when reading the list of
uncommitted blocks. Calls to Get Block List where
``blocklisttype=uncommitted`` or ``blocklisttype=all`` have a lower maximum
request rate than other read operations. For details on target throughput for
read operations, see |scalability-perf|.
