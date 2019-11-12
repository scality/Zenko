.. _Get Container ACL:

Get Container ACL
=================

The ``Get Container ACL`` operation gets the permissions for the specified
container. The permissions indicate whether container data may be accessed
publicly.

The container permissions provide the following options for managing container
access:

-  **Full public read access:** Container and blob data can be read via anonymous
   request. Clients can enumerate blobs within the container via anonymous
   request, but cannot enumerate containers within the storage account.

-  **Public read access for blobs only:** Blob data within this container can be
   read via anonymous request, but container data is not available. Clients
   cannot enumerate blobs within the container via anonymous request.

-  **No public read access:** Container and blob data can be read by the account
   owner only.

``Get Container ACL`` also returns details about any container-level access
policies specified on the container that may be used with Shared Access
Signatures. For more information, see |define-access|.

All public access to the container is anonymous, as is access via a Shared
Access Signature.

Request
-------

The ``Get Container ACL`` request may be constructed as follows.  HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +----------+-------------------------------------------------------------------------------+--------------+
   | Method   | Request URI                                                                   | HTTP Version |
   +==========+===============================================================================+==============+
   | GET/HEAD | ``https://myaccount.blob.example.com/mycontainer?restype=container&comp=acl`` | HTTP/1.1     |
   +----------+-------------------------------------------------------------------------------+--------------+

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

   +----------------------------+----------------------------------------------------+
   | Request Header             | Description                                        |
   +============================+====================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme,      |
   |                            | account name, and signature. For more information, |
   |                            | see |authorize-requests|.                          |
   +----------------------------+----------------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the Coordinated Universal Time |
   |                            | (UTC) for the request. For more information, see   |
   |                            | |authorize-requests|.                              |
   +----------------------------+----------------------------------------------------+
   | ``x-ms-lease-id``          | Not applicable (Zenko version |version| does not   |
   |                            | support leasing).                                  |
   +----------------------------+----------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests. Specifies    |
   |                            | the version of the operation to use for this       |
   |                            | request. For more information, see                 |
   |                            | |azure-versioning|.                                |
   +----------------------------+----------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque      |
   |                            | value with a 1 KB character limit that is recorded |
   |                            | in the analytics logs when storage analytics       |
   |                            | logging is enabled. Using this header is highly    |
   |                            | recommended for correlating client-side activities |
   |                            | with requests received by the server. For more     |
   |                            | information, see |analytics-log| and               |
   |                            | |storage-tracking|.                                |
   +----------------------------+----------------------------------------------------+

Request Body
~~~~~~~~~~~~

None

Response
--------

The response includes an HTTP status code, a set of response headers, and a
response body.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code ``200 (OK)``.

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +-----------------------------------+---------------------------------------+
   | Response Header                   | Description                           |
   +===================================+=======================================+
   | ``x-ms-blob-public-access``       | Indicates whether data in the         |
   |                                   | container may be accessed             |
   |                                   | publicly and the level of access.     |
   |                                   | Possible values include:              |
   |                                   |                                       |
   |                                   | - ``container``: Indicates full       |
   |                                   |   public read access for container    |
   |                                   |   and blob data. Clients can          |
   |                                   |   enumerate blobs within the          |
   |                                   |   container via anonymous request,    |
   |                                   |   but cannot enumerate containers     |
   |                                   |   within the storage account.         |
   |                                   | - ``blob:`` Indicates public read     |
   |                                   |   access for blobs. Blob data         |
   |                                   |   within this container can be read   |
   |                                   |   via anonymous request, but          |
   |                                   |   container data is not available.    |
   |                                   |   Clients cannot enumerate blobs      |
   |                                   |   within the container via            |
   |                                   |   anonymous request.                  |
   |                                   |                                       |
   |                                   | If this header is not returned in     |
   |                                   | the response, the container is        |
   |                                   | private to the account owner.         |
   +-----------------------------------+---------------------------------------+
   | ``ETag``                          | The entity tag for the container.     |
   |                                   | the ETag value will be in quotes.     |
   +-----------------------------------+---------------------------------------+
   | ``Last-Modified``                 | Returns the date and time the         |
   |                                   | container was last modified. The      |
   |                                   | date format follows RFC 1123. For     |
   |                                   | more information, see                 |
   |                                   | |date-time-headers|.                  |
   |                                   | Any operation that modifies the       |
   |                                   | container or its properties or        |
   |                                   | metadata updates the last             |
   |                                   | modified time. Operations on          |
   |                                   | blobs do not affect the last          |
   |                                   | modified time of the container.       |
   +-----------------------------------+---------------------------------------+
   | ``x-ms-request-id``               | This header uniquely identifies       |
   |                                   | the request that was made and can     |
   |                                   | be used for troubleshooting the       |
   |                                   | request. For more information,        |
   |                                   | see |api-troubleshoot|.               |
   +-----------------------------------+---------------------------------------+
   | ``x-ms-version``                  | Indicates the version of the Blob     |
   |                                   | service used to execute the           |
   |                                   | request.                              |
   +-----------------------------------+---------------------------------------+
   | ``Date``                          | A UTC date/time value generated       |
   |                                   | by the service that indicates the     |
   |                                   | time at which the response was        |
   |                                   | initiated.                            |
   +-----------------------------------+---------------------------------------+
   | ``x-ms-client-request-id``        | This header can be used to            |
   |                                   | troubleshoot requests and             |
   |                                   | corresponding responses. The          |
   |                                   | value of this header is equal to      |
   |                                   | the value of the                      |
   |                                   | ``x-ms-client-request-id`` header     |
   |                                   | if it is present in the request       |
   |                                   | and the value is at most 1024         |
   |                                   | visible ASCII characters. If the      |
   |                                   | ``x-ms-client-request-id`` header     |
   |                                   | is not present in the request,        |
   |                                   | this header will not be present       |
   |                                   | in the response.                      |
   +-----------------------------------+---------------------------------------+

Response Body
~~~~~~~~~~~~~

If a container-level access policy has been specified for the container, ``Get
Container ACL`` returns the signed identifier and access policy in the response
body.

   ::

      <?xml version="1.0" encoding="utf-8"?>
      <SignedIdentifiers>
        <SignedIdentifier>
          <Id>unique-value</Id>
          <AccessPolicy>
            <Start>start-time</Start>
            <Expiry>expiry-time</Expiry>
            <Permission>abbreviated-permission-list</Permission>
          </AccessPolicy>
        </SignedIdentifier>
      </SignedIdentifiers>

Sample Response
~~~~~~~~~~~~~~~

   ::

      Response Status:
      HTTP/1.1 200 OK

      Response Headers:
      Transfer-Encoding: chunked
      x-ms-blob-public-access: container
      Date: Sun, 25 Sep 2011 20:28:22 GMT
      ETag: "0x8CAFB82EFF70C46"
      Last-Modified: Sun, 25 Sep 2011 19:42:18 GMT
      x-ms-version: 2011-08-18
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0

      <?xml version="1.0" encoding="utf-8"?>
      <SignedIdentifiers>
        <SignedIdentifier>
          <Id>MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=</Id>
          <AccessPolicy>
            <Start>2009-09-28T08:49:37.0000000Z</Start>
            <Expiry>2009-09-29T08:49:37.0000000Z</Expiry>
            <Permission>rwd</Permission>
          </AccessPolicy>
        </SignedIdentifier>
      </SignedIdentifiers>


Authorization
~~~~~~~~~~~~~

Only the account owner may call this operation.

Remarks
-------

Only the account owner may read data in a particular storage account, unless the
account owner has specified that blobs within the container are available for
public read access, or made resources in the container available via a Shared
Access Signature.
