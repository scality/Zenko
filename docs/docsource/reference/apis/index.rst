API Reference
=============

Zenko comprises several component REST APIs. Many of the endpoint
functionalies are replicated in the :ref:`command reference`.

Access to these APIs is documented in each section.

Common API protocol characteristics are described below. 

.. toctree::
   :maxdepth: 2

   cloudserver/index
   blobserver/index
   metadata/index
   utapi/index
   vault/index

HTTP Conformity
---------------

Zenko uses the HTTP 1.1 protocol as defined by RFC 2616. REST operations
consist of sending HTTP requests to S3C, which returns HTTP responses. These
HTTP requests contain a request method, a URI with an optional query string,
headers, and a body. The responses contain status codes, headers, and may
contain a response body.

S3 supports the REST API, accessed via requests that employ an XML-based
protocol. Input parameters are provided as an XML body (at the Service level) or
as an XML array of entities (such as Buckets, Accounts or Users), plus a time
range (start and end times expressed as UTC epoch timestamps). Output is
delivered as an XML array, one element per entity. Bytes transferred and number
of operations metrics are accumulated between the provided start and end
times. For storage capacity, discrete values are returned in bytes for the start
and the end times (not as an average between start and end).

Because request headers and response headers can be specific to a particular S3C
API operation or set of operations, many such elements are common to all
operations.

Request headers that are typically found in S3C requests include Authorization,
Content-Length, Content-Type, Date, and Host.

.. tabularcolumns:: lL
.. table::
   :widths: 20 80

   +-----------------------------------+-----------------------------------+
   | Header                            | Description                       |
   +===================================+===================================+
   | Authorization                     | Contains the information required |
   |                                   | for authentication.               |
   +-----------------------------------+-----------------------------------+
   | Content-Length                    | Message Length (without headers), |
   |                                   | as specified by RFC 2616;         |
   |                                   | required for PUT and operations   |
   |                                   | that load XML, such as logging    |
   |                                   | and ACLs.                         |
   +-----------------------------------+-----------------------------------+
   | Content-Type                      | Resource content type (e.g.,      |
   |                                   | text/plain) (For PUT operations,  |
   |                                   | default is binary/octet-stream,   |
   |                                   | and valid values are MIME types.) |
   +-----------------------------------+-----------------------------------+
   | Date                              | Date and time of the request      |
   |                                   | (default format is Thu, 31 Mar    |
   |                                   | 2016 13:00:00 GMT, which conforms |
   |                                   | to RFC 2616 Section 3.3.1).       |
   +-----------------------------------+-----------------------------------+
   | Host                              | Required for HTTP 1.1, the Host   |
   |                                   | header points to the standard     |
   |                                   | storage service. If the host      |
   |                                   | contains anything other than the  |
   |                                   | standard S3C storage server, this |
   |                                   | information is interpreted as the |
   |                                   | bucket for the request.           |
   |                                   |                                   |
   |                                   | The Host header contains either   |
   |                                   | the service host name or the      |
   |                                   | virtual host                      |
   |                                   | (bucket.s3.bsedomain.com), in     |
   |                                   | addition to the bucket.           |
   +-----------------------------------+-----------------------------------+

Important response headers that customarily comprise API operation responses
include HTTP/1.1, x-amzn-request-id, Content-Length, Content-Type, and Date.

.. tabularcolumns:: llL
.. table::
   :widths: 20 10 70

   +-----------------------+-----------------------+---------------------------------------------------+
   | Header                | Type                  | Description                                       |
   +=======================+=======================+===================================================+
   | HTTP/1.1              | string                | Header followed by a                              |
   |                       |                       | status code, with                                 |
   |                       |                       | status code 200                                   |
   |                       |                       | indicating a                                      |
   |                       |                       | successful operation.                             |
   |                       |                       | For error code                                    |
   |                       |                       | information refer to                              |
   |                       |                       | :ref:`API Error Codes (Client and Server Errors)` |
   +-----------------------+-----------------------+---------------------------------------------------+
   | x-amzn-request-id     | string                | A value created by S3C                            |
   |                       |                       | that uniquely                                     |
   |                       |                       | identifies a request.                             |
   |                       |                       | Values can be used to                             |
   |                       |                       | troubleshoot                                      |
   |                       |                       | problems.                                         |
   +-----------------------+-----------------------+---------------------------------------------------+
   | Content-Length        | string                | Length of response                                |
   |                       |                       | body in bytes.                                    |
   +-----------------------+-----------------------+---------------------------------------------------+
   | Content-Type          | string                | Message’s content                                 |
   |                       |                       | type (typically                                   |
   |                       |                       | application/hal+json)                             |
   +-----------------------+-----------------------+---------------------------------------------------+
   | Date                  | string                | Date and time of the S3C                          |
   |                       |                       | response.                                         |
   +-----------------------+-----------------------+---------------------------------------------------+

.. note::

   For detail on common request headers refer to :ref:`Common Request Headers`,
   and for detail on common response headers refer to :ref:`Common Response
   Headers`.

.. _Encryption:

Encryption
----------

Zenko's encryption scheme is architected around bucket-level
encryption. This reflects a design bias toward wholesale operations such as
bucket- and site-level replication and away from object-level operations.

Bucket Encryption
~~~~~~~~~~~~~~~~~

Slightly different from AWS SSE, S3C bucket encryption (except for bucket
creation) is transparent to the application. Buckets are created with a special
x-amz-scal-server-side-encryption header (value: AES256) that specifies that the
bucket’s objects shall be encrypted, with no need thereafter to change any
Object PUT or GET calls in the application, because encryption and decryption
are automatic (encrypt on PUT, decrypt on GET). AWS SSE is comparatively 
intrusive, requiring special headers on all Object Create calls, including
Object Put, Object Copy, Object Post, and Multi-Part Upload requests.

Zenko's Key Management Service (KMS) integration for bucket encryption is
similar to that of SSE-C. Scality requires that customers provide the KMS, which
is responsible for generating encryption keys on PUT calls and for retrieving
the same encryption key on GET calls. This architecture ensures that S3
Connector and the RING do not store encryption keys. Currently, Zenko is
integrated with one KMS solution, Gemalto SafeNet KeySecure.

Zenko uses standard OpenSSL, 256-bit encryption libraries to perform the
payload encryption/decryption. This also supports the Intel AES-NI CPU
acceleration library, making encrypted performance nearly as fast as
non-encrypted performance.

Object Encryption
~~~~~~~~~~~~~~~~~

In version 7.6, Zenko is modified to accept object encryption headers.
Object-level encryption is not supported; however, Zenko no longer throws
an error when it encounters object-level encryption headers, provided
bucket-level encryption is enabled and the correct protocol is used. Objects and
buckets may or may not be encrypted, but under no circumstances does S3
Connector allow an object with an unsupported cryptographic protocol pass as
safely encrypted, either to an unencrypted bucket, or using an unsupported
encryption protocol at the bucket or object level.

If Zenko encounters an object-level encryption header and bucket-level
encryption is not set for the buckets transferring or replicating the object, S3
Connector responds with a ``400: InvalidArgument`` error.

Likewise, if Zenko encounters an encryption header
(``x-amz-server-side-encryption`` or ``x-amz-scal-server-side-encryption``) with
a value other than ``AES256``, it returns ``400: InvalidArgument``.
