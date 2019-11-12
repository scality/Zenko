.. _Set Container Metadata:

Set Container Metadata
======================

The ``Set Container Metadata`` operation sets one or more user-defined
name-value pairs for the specified container.

Request
-------

The ``Set Container Metadata`` request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and ``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+-------------------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                                         | HTTP Version |
   +========+=====================================================================================+==============+
   | PUT    | ``https://myaccount.blob.example.com/mycontainer?restype=container&comp=metadata``  | HTTP/1.1     |
   +--------+-------------------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.15\textwidth}X{0.80\textwidth}
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

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+---------------------------------------------+
   | Request Header             | Description                                 |
   +============================+=============================================+
   | ``Authorization``          | Required. Specifies the authorization       |
   |                            | scheme, account name, and signature. For    |
   |                            | more information, see |authorize-requests|. |
   +----------------------------+---------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the Coordinated         |
   |                            | Universal Time (UTC) for the request. For   |
   |                            | more information, see |authorize-requests|. |
   +----------------------------+---------------------------------------------+
   | ``x-ms-version``           | Required for all authorized                 |
   |                            | requests. Specifies the version             |
   |                            | of the operation to use for this            |
   |                            | request. For more information,              |
   |                            | see |azure-versioning|.                     |
   +----------------------------+---------------------------------------------+
   | ``x-ms-lease-id``          | Not applicable (Zenko version |version|     |
   |                            | does not support leasing).                  |
   +----------------------------+---------------------------------------------+
   | ``x-ms-meta-name:value``   | Optional. A name-value pair to              |
   |                            | associate with the container as metadata.   |
   |                            | Each call to this operation                 |
   |                            | replaces all existing metadata              |
   |                            | attached to the container. To               |
   |                            | remove all metadata from the                |
   |                            | container, call this operation              |
   |                            | with no metadata headers.                   |
   |                            | Metadata names must adhere to the naming    |
   |                            | rules for C# identifiers.                   |
   +----------------------------+---------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a                        |
   |                            | client-generated, opaque value              |
   |                            | with a 1 KB character limit that            |
   |                            | is recorded in the analytics logs           |
   |                            | when storage analytics logging is           |
   |                            | enabled. Using this header is               |
   |                            | highly recommended for                      |
   |                            | correlating client-side                     |
   |                            | activities with requests received           |
   |                            | by the server. For more                     |
   |                            | information, see |analytics-log|            |
   |                            | and |storage-tracking|.                     |
   +----------------------------+---------------------------------------------+

This operation also supports the use of conditional headers to set container
metadata only if a specified condition is met. For more information, see
|conditional-headers|.

Request Body
~~~~~~~~~~~~

None

Sample Request
~~~~~~~~~~~~~~

   ::

      Request Syntax:
      PUT https://myaccount.blob.example.com/mycontainer?restype=container&comp=metadata HTTP/1.1

      Request Headers:
      x-ms-version: 2011-08-18
      x-ms-date: Sun, 25 Sep 2011 22:50:32 GMT
      x-ms-meta-Category: Images
      Authorization: SharedKey myaccount:Z5043vY9MesKNh0PNtksNc9nbXSSqGHueE00JdjidOQ=

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

.. tabularcolumns:: X{0.35\textwidth}X{0.60\textwidth}
.. table::

   +--------------------------------------+---------------------------------------------+
   | Response Header                      | Description                                 |
   +======================================+=============================================+
   | ``ETag``                             | The ETag for the container. The ETag value  |
   |                                      | will be in quotes.                          |
   +--------------------------------------+---------------------------------------------+
   | ``Last-Modified``                    | Returns the date and time the               |
   |                                      | container was last modified. The            |
   |                                      | date format follows RFC 1123. For           |
   |                                      | more information, see |date-time-headers|.  |
   |                                      | Any operation that modifies the             |
   |                                      | container or its properties or              |
   |                                      | metadata updates the                        |
   |                                      | last-modified time, including               |
   |                                      | setting the container's                     |
   |                                      | permissions. Operations on blobs            |
   |                                      | do not affect the last-modified             |
   |                                      | time of the container.                      |
   +--------------------------------------+---------------------------------------------+
   | ``ms-request-id``                    | This header uniquely identifies             |
   |                                      | the request that was made and can           |
   |                                      | be used for troubleshooting the             |
   |                                      | request. For more information,              |
   |                                      | see |api-troubleshoot|.                     |
   +--------------------------------------+---------------------------------------------+
   | ``x-ms-version``                     | Indicates the version of the Blob           |
   |                                      | service used to execute the                 |
   |                                      | request.                                    |
   +--------------------------------------+---------------------------------------------+
   | ``Date``                             | A UTC date/time value generated             |
   |                                      | by the service that indicates the           |
   |                                      | time at which the response was              |
   |                                      | initiated.                                  |
   +--------------------------------------+---------------------------------------------+
   | ``Access-Control-Allow-Origin``      | Returned if the request includes            |
   |                                      | an ``Origin`` header and CORS is            |
   |                                      | enabled with a matching rule.               |
   |                                      | This header returns the value of            |
   |                                      | the origin request header in case           |
   |                                      | of a match.                                 |
   +--------------------------------------+---------------------------------------------+
   | ``Access-Control-Expose-Headers``    | Returned if the request includes            |
   |                                      | an ``Origin`` header and CORS is            |
   |                                      | enabled with a matching rule.               |
   |                                      | Returns the list of response                |
   |                                      | headers that are to be exposed to           |
   |                                      | the client or issuer of the request.        |
   +--------------------------------------+---------------------------------------------+
   | ``Access-Control-Allow-Credentials`` | Returned if the request includes            |
   |                                      | an ``Origin`` header and CORS is            |
   |                                      | enabled with a matching rule that           |
   |                                      | does not allow all origins. This            |
   |                                      | header will be set to true.                 |
   +--------------------------------------+---------------------------------------------+
   | ``x-ms-client-request-id``           | This header can be used to                  |
   |                                      | troubleshoot requests and                   |
   |                                      | corresponding responses. The                |
   |                                      | value of this header is equal to            |
   |                                      | the value of the                            |
   |                                      | ``x-ms-client-request-id`` header           |
   |                                      | if it is present in the request             |
   |                                      | and the value is at most 1024               |
   |                                      | visible ASCII characters. If the            |
   |                                      | ``x-ms-client-request-id`` header           |
   |                                      | is not present in the request,              |
   |                                      | this header will not be present             |
   |                                      | in the response.                            |
   +--------------------------------------+---------------------------------------------+

Response Body
~~~~~~~~~~~~~

None

Authorization
~~~~~~~~~~~~~

Only the owner may call this operation.

Remarks
-------

Calling the ``Set Container Metadata`` operation overwrites all existing
metadata that is associated with the container. It's not possible to modify an
individual name-value pair.

You may also set metadata for a container at the time it is created.

Calling ``Set Container Metadata`` updates the ETag and Last-Modified-Time
properties for the container. The updated ETag will be in quotes.
