.. _Get Container Metadata:

Get Container Metadata
======================

The Get Container Metadata operation returns all user-defined metadata for the
container.

Request
-------

The Get Container Metadata request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.15\textwidth}X{0.65\textwidth}X{0.15\textwidth}
.. table::

   +----------+------------------------------------------------------------------------------------+--------------+
   | Method   | Request URI                                                                        | HTTP Version |
   +==========+====================================================================================+==============+
   | GET/HEAD | ``https://myaccount.blob.example.com/mycontainer?restype=container&comp=metadata`` | HTTP/1.1     |
   +----------+------------------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
.. table::

   +-------------+---------------------------------------------------------------+
   | Parameter   | Description                                                   |
   +=============+===============================================================+
   | ``timeout`` | Optional. The ``timeout`` parameter is expressed in seconds.  |
   |             | For more information, see |set-blob-timeouts|.                |
   +-------------+---------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.35\textwidth}X{0.60\textwidth}
.. table::

   +----------------------------+-------------------------------------------------------------+
   | Request Header             | Description                                                 |
   +============================+=============================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, account name, |
   |                            | and signature. For more information, see                    |
   |                            | |authorize-requests|.                                       |
   +----------------------------+-------------------------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the Coordinated Universal Time (UTC)    |
   |                            | for the request. For more information, see                  |
   |                            | |authorize-requests|.                                       |
   +----------------------------+-------------------------------------------------------------+
   | ``x-ms-lease-id``          | Not applicable (Zenko version |version| does not support    |
   |                            | leasing).                                                   |
   +----------------------------+-------------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests, optional for          |
   |                            | anonymous requests. Specifies the version of the operation  |
   |                            | to use for this request. For more information, see          |
   |                            | |azure-versioning|.                                         |
   +----------------------------+-------------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value with a  |
   |                            | 1 KB character limit that is recorded in the analytics logs |
   |                            | when storage analytics logging is enabled. Using this       |
   |                            | header is highly recommended for correlating client-side    |
   |                            | activities with requests received by the server. For more   |
   |                            | information, see |analytics-log| and |storage-tracking|.    |
   +----------------------------+-------------------------------------------------------------+

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

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+---------------------------------------------+
   | Syntax                     | Description                                 |
   +============================+=============================================+
   | ``x-ms-meta-name:value``   | Returns a string containing a               |
   |                            | name-value pair associated with             |
   |                            | the container as metadata.                  |
   +----------------------------+---------------------------------------------+
   | ``ETag``                   | The entity tag for the container.           |
   |                            | If the request version is                   |
   |                            | 2011-08-18 or newer, the ETag               |
   |                            | value will be in quotes.                    |
   +----------------------------+---------------------------------------------+
   | ``Last-Modified``          | Returns the date and time the               |
   |                            | container was last modified. The            |
   |                            | date format follows RFC 1123. For           |
   |                            | more information, see                       |
   |                            | |date-time-headers|.                        |
   |                            | Any operation that modifies the             |
   |                            | container or its properties or              |
   |                            | metadata updates the last                   |
   |                            | modified time. Operations on                |
   |                            | blobs do not affect the last                |
   |                            | modified time of the container.             |
   +----------------------------+---------------------------------------------+
   | ``x-ms-request-id``        | This header uniquely identifies             |
   |                            | the request that was made and can           |
   |                            | be used for troubleshooting the             |
   |                            | request. For more information,              |
   |                            | see |api-troubleshoot|.                     |
   +----------------------------+---------------------------------------------+
   | ``x-ms-version``           | Indicates the version of the Blob           |
   |                            | service used to execute the                 |
   |                            | request. This header is returned            |
   |                            | for requests made against version           |
   |                            | 2009-09-19 and above.                       |
   |                            | This header is also returned for            |
   |                            | anonymous requests without a                |
   |                            | version specified if the                    |
   |                            | container was marked for public             |
   |                            | access using the 2009-09-19                 |
   |                            | version of the Blob service.                |
   +----------------------------+---------------------------------------------+
   | ``Date``                   | A UTC date/time value generated             |
   |                            | by the service that indicates the           |
   |                            | time at which the response was              |
   |                            | initiated.                                  |
   +----------------------------+---------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to                  |
   |                            | troubleshoot requests and                   |
   |                            | corresponding responses. The                |
   |                            | value of this header is equal to            |
   |                            | the value of the                            |
   |                            | ``x-ms-client-request-id`` header           |
   |                            | if it is present in the request             |
   |                            | and the value is at most 1024               |
   |                            | visible ASCII characters. If the            |
   |                            | ``x-ms-client-request-id`` header           |
   |                            | is not present in the request,              |
   |                            | this header will not be present             |
   |                            | in the response.                            |
   +----------------------------+---------------------------------------------+

Response Body
~~~~~~~~~~~~~

None

Sample Response
~~~~~~~~~~~~~~~

   ::


      Response Status:
      HTTP/1.1 200 OK

      Response Headers:
      Transfer-Encoding: chunked
      x-ms-meta-AppName: StorageSample
      Date: Sun, 25 Sep 2011 23:43:08 GMT
      ETag: "0x8CAFB82EFF70C46"
      Last-Modified: Sun, 25 Sep 2011 19:42:18 GMT
      x-ms-version: 2011-08-18
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0


Authorization
~~~~~~~~~~~~~

Only the account owner may call this operation.

Remarks
-------

This operation returns only user-defined metadata on the container. To return
system properties as well, call :ref:`Get Container Properties`.
