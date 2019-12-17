.. _Create Container:

Create Container
================

The Create Container operation creates a new container under the specified
account. If the container with the same name already exists, the operation
fails.

The container resource includes metadata and properties for that container. It
does not include a list of the blobs contained by the container.

Request
-------

The Create Container request may be constructed as follows. HTTPS is
recommended. Your ``mycontainer`` value can only include lower-case
characters. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.75\textwidth}X{0.10\textwidth}
.. table::

   +--------+----------------------------------------------------------------------+--------------+
   | Method | Request URI                                                          | HTTP Version |
   +========+======================================================================+==============+
   | PUT    | ``https://myaccount.blob.example.com/mycontainer?restype=container`` | HTTP/1.1     |
   +--------+----------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.10\textwidth}X{0.85\textwidth}
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

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::
   :class: longtable

   +-----------------------------+----------------------------------------+
   | Request Header              | Description                            |
   +=============================+========================================+
   | ``Authorization``           | Required. Specifies the authorization  |
   |                             | scheme, account name, and signature.   |
   |                             | For more information, see              |
   |                             | |authorize-requests|.                  |
   +-----------------------------+----------------------------------------+
   | ``Date`` or ``x-ms-date``   | Required. Specifies the Coordinated    |
   |                             | Universal Time (UTC) time for the      |
   |                             | request. For more information, see     |
   |                             | |authorize-requests|.                  |
   +-----------------------------+----------------------------------------+
   | ``x-ms-version``            | Required for all authorized requests.  |
   |                             | Specifies the version of the operation |
   |                             | to use for this request. For more      |
   |                             | information, see |azure-versioning|.   |
   +-----------------------------+----------------------------------------+
   | ``x-ms-meta-name:value``    | Optional. A name-value pair to         |
   |                             | associate with the container as        |
   |                             | metadata. Metadata names must conform  |
   |                             | to the naming rules for C# identifiers.|
   +-----------------------------+----------------------------------------+
   | ``x-ms-blob-public-access`` | Optional. Specifies whether data in the|
   |                             | container may be accessed publicly and |
   |                             | the level of access. Possible values   |
   |                             | include:                               |
   |                             |                                        |
   |                             | - ``container``: Specifies full public |
   |                             |   read access for container and blob   |
   |                             |   data. Clients can enumerate blobs    |
   |                             |   within the container via anonymous   |
   |                             |   request, but cannot enumerate        |
   |                             |   containers within the storage        |
   |                             |   account.                             |
   |                             | - ``blob``: Specifies public read      |
   |                             |   access for blobs. Blob data within   |
   |                             |   this container can be read via       |
   |                             |   anonymous request, but container     |
   |                             |   data is not available. Clients       |
   |                             |   cannot enumerate blobs within the    |
   |                             |   container via anonymous request.     |
   |                             |                                        |
   |                             | If this header is not included in the  |
   |                             | the request, container data is         |
   |                             | private to the account owner.          |
   +-----------------------------+----------------------------------------+
   | ``x-ms-client-request-id``  | Optional. Provides a client-generated, |
   |                             | opaque value with a 1 KB character     |
   |                             | limit that is recorded in the          |
   |                             | analytics logs when storage analytics  |
   |                             | logging is enabled. Using this header  |
   |                             | is highly recommended for correlating  |
   |                             | client-side activities with requests   |
   |                             | received by the server. For more       |
   |                             | information, see |analytics-log| and   |
   |                             | |storage-tracking|.                    |
   +-----------------------------+----------------------------------------+

Request Body
~~~~~~~~~~~~

None

Sample Request
~~~~~~~~~~~~~~

   ::

      Request Syntax:
      PUT https://myaccount.blob.example.com/mycontainer?restype=container HTTP/1.1

      Request Headers:
      x-ms-version: 2011-08-18
      x-ms-date: Sun, 25 Sep 2011 22:50:32 GMT
      x-ms-meta-Name: StorageSample
      Authorization: SharedKey myaccount:Z5043vY9MesKNh0PNtksNc9nbXSSqGHueE00JdjidOQ=

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

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+---------------------------------------------+
   | Response Header            | Description                                 |
   +============================+=============================================+
   | ``ETag``                   | The ETag for the container.                 |
   |                            | The ETag value will be in quotes.           |
   +----------------------------+---------------------------------------------+
   | ``Last-Modified``          | Returns the date and time the               |
   |                            | container was last modified. The            |
   |                            | date format follows RFC 1123. For           |
   |                            | more information, see                       |
   |                            | |date-time-headers|. Any                    |
   |                            | operation that modifies the                 |
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
   |                            | request.                                    |
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
      HTTP/1.1 201 Created

      Response Headers:
      Transfer-Encoding: chunked
      Date: Sun, 25 Sep 2011 23:00:12 GMT
      ETag: â0x8CB14C3E29B7E82â
      Last-Modified: Sun, 25 Sep 2011 23:00:06 GMT
      x-ms-version: 2011-08-18
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0

Authorization
~~~~~~~~~~~~~

Only the account owner may call this operation.

Remarks
-------

Containers are created immediately beneath the storage account. It's not
possible to nest one container beneath another.

You can optionally create a default or root container for your storage
account. The root container may be inferred from a URL requesting a blob
resource. The root container makes it possible to reference a blob from the top
level of the storage account hierarchy, without referencing the container name.

To add the root container to your storage account, create a container named
``$root``. Construct the request as follows:

   ::

      Request Syntax:
      PUT https://myaccount.blob.example.com/$root?restype=container HTTP/1.1

      Request Headers:
      x-ms-version: 2011-08-18
      x-ms-date: Sun, 25 Sep 2011 22:50:32 GMT
      x-ms-meta-Name: StorageSample
      Authorization: SharedKey myaccount:Z5043vY9MesKNh0PNtksNc9nbXSSqGHueE00JdjidOQ=

You can specify metadata for a container at the time it is created by including
one or more metadata headers on the request. The format for the metadata header
is ``x-ms-meta-name:value``.

If a container by the same name is being deleted when ``Create Container`` is
called, the server returns status code 409 (Conflict), with additional error
information indicating that the container is being deleted.
