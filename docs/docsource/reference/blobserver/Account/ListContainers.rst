.. _List Containers:

List Containers
===============

The List Containers operation returns a list of the containers under the
specified storage account.

Request
-------

The List Containers request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+---------------------------------------------------+--------------+
   | Method | Request URI                                       | HTTP Version |
   +========+===================================================+==============+
   | GET    | ``https://myaccount.blob.example.com/?comp=list`` | HTTP/1.1     |
   +--------+---------------------------------------------------+--------------+

The URI must include the forward slash (/) to separate the host name from the
path and query portions of the URI. For List Containers operation, the path
portion of the URI remains empty.

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.20\textwidth}X{0.75\textwidth}
.. table::

   +----------------------+-----------------------------------+
   | Parameter            | Description                       |
   +======================+===================================+
   | ``prefix``           | Optional. Filters the results to  |
   |                      | return only containers whose name |
   |                      | begins with the specified prefix. |
   +----------------------+-----------------------------------+
   | ``marker``           | Optional. A string value that     |
   |                      | identifies the portion of the     |
   |                      | list of containers to be returned |
   |                      | with the next listing operation.  |
   |                      | The operation returns the         |
   |                      | ``NextMarker`` value within the   |
   |                      | response body if the listing      |
   |                      | operation did not return all      |
   |                      | containers remaining to be listed |
   |                      | with the current page. The        |
   |                      | ``NextMarker`` value can be used  |
   |                      | as the value for the ``marker``   |
   |                      | parameter in a subsequent call to |
   |                      | request the next page of list     |
   |                      | items.                            |
   |                      | The marker value is opaque to the |
   |                      | client.                           |
   +----------------------+-----------------------------------+
   | ``maxresults``       | Optional. Specifies the maximum   |
   |                      | number of containers to return.   |
   |                      | If the request does not specify   |
   |                      | ``maxresults``, or specifies a    |
   |                      | value greater than 5000, the      |
   |                      | server will return up to 5000     |
   |                      | items.                            |
   |                      |                                   |
   |                      | .. note::                         |
   |                      |                                   |
   |                      |   If the listing operation        |
   |                      |   crosses a partition boundary,   |
   |                      |   the service will return a       |
   |                      |   continuation token for          |
   |                      |   retrieving the remainder of the |
   |                      |   results. For this reason, it is |
   |                      |   possible that the service will  |
   |                      |   return fewer results than       |
   |                      |   specified by ``maxresults``, or |
   |                      |   than the default of 5000.       |
   |                      |   If the parameter is set to a    |
   |                      |   value less than or equal to     |
   |                      |   zero, the server returns status |
   |                      |   code 400 (Bad Request).         |
   +----------------------+-----------------------------------+
   | ``include=metadata`` | Optional. Include this parameter  |
   |                      | to specify that the container's   |
   |                      | metadata be returned as part of   |
   |                      | the response body.                |
   |                      | All metadata names must           |
   |                      | adhere to the naming conventions  |
   |                      | for C# identifiers.               |
   +----------------------+-----------------------------------+
   | ``timeout``          | Optional. The ``timeout``         |
   |                      | parameter is expressed in         |
   |                      | seconds. For more information,    |
   |                      | see |set-blob-timeouts|.          |
   +----------------------+-----------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +----------------------------+-----------------------------------------------------------------+
   | Request Header             | Description                                                     |
   +============================+=================================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, account name, and |
   |                            | signature. For more information, see |authorize-requests|.      |
   +----------------------------+-----------------------------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the Coordinated Universal Time (UTC) for    |
   |                            | the request. For more information, see |authorize-requests|.    |
   +----------------------------+-----------------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests. Specifies the version of  |
   |                            | the operation to use for this request. For more information,    |
   |                            | see |azure-versioning|.                                         |
   +----------------------------+-----------------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value with a 1 KB |
   |                            | character limit that is recorded in the analytics logs when     |
   |                            | storage analytics logging is enabled. Using this header is      |
   |                            | highly recommended for correlating client-side activities with  |
   |                            | requests received by the server. For more information, see      |
   |                            | |analytics-log| and |storage-tracking|.                         |
   +----------------------------+-----------------------------------------------------------------+

Request Body
~~~~~~~~~~~~

None

Response
--------

The response includes an HTTP status code, a set of response headers, and a
response body in XML format.

Status Code
~~~~~~~~~~~

A successful operation returns status code 200 (OK).

For information about status codes, see :ref:`Status and Error Codes`.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response
also includes additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +----------------------------+-----------------------------------------------------------------------------------+
   | Response Header            | Description                                                                       |
   +============================+===================================================================================+
   | ``Content-Type``           | Standard HTTP/1.1 header. Specifies the format in which the results are           |
   |                            | returned. Currently, this value is application/xml.                               |
   +----------------------------+-----------------------------------------------------------------------------------+
   | ``x-ms-request-id``        | This header uniquely identifies the request that was made and can be used for     |
   |                            | troubleshooting the request. For more information, see |api-troubleshoot|.        |
   +----------------------------+-----------------------------------------------------------------------------------+
   | ``x-ms-version``           | Indicates the version of the Blob service used to execute the request.            |
   +----------------------------+-----------------------------------------------------------------------------------+
   | ``Date``                   | A UTC date/time value generated by the service that indicates when the response   |
   |                            | was initiated.                                                                    |
   +----------------------------+-----------------------------------------------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to troubleshoot requests and corresponding responses. The |
   |                            | value of this header is equal to the value of the ``x-ms-client-request-id``      |
   |                            | header if it is present in the request and the value is at most 1024 visible      |
   |                            | ASCII characters. If the ``x-ms-client-request-id`` header is not present in the  |
   |                            | request, this header is not present in the response.                              |
   +----------------------------+-----------------------------------------------------------------------------------+


Response Body
~~~~~~~~~~~~~

The format of the response body is as follows.

   ::

      <?xml version="1.0" encoding="utf-8"?>
      <EnumerationResults ServiceEndpoint="https://myaccount.blob.example.com">
        <Prefix>string-value</Prefix>
        <Marker>string-value</Marker>
        <MaxResults>int-value</MaxResults>
        <Containers>
          <Container>
            <Name>container-name</Name>
            <Properties>
              <Last-Modified>date/time-value</Last-Modified>
              <Etag>etag</Etag>
              <LeaseStatus>unlocked</LeaseStatus>
              <LeaseState>available</LeaseState>
              <PublicAccess>container | blob</PublicAccess>
              <HasImmutabilityPolicy>true | false</HasImmutabilityPolicy>
              <HasLegalHold>true | false</HasLegalHold>
            </Properties>
            <Metadata>
              <metadata-name>value</metadata-name>
            </Metadata>
          </Container>
        </Containers>
        <NextMarker>marker-value</NextMarker>
      </EnumerationResults>

The ``Prefix``, ``Marker``, and ``MaxResults`` elements are only present if they
were specified on the URI. The ``NextMarker`` element has a value only if the
list results are not complete.

The ``Metadata`` element is present only if the ``include=metadata`` parameter
was specified on the URI. Within the ``Metadata`` element, the value of each
name-value pair is listed within an element corresponding to the pair's name.

If a metadata name-value pair violates the naming restrictions enforced by the
2009-09-19 version, the response body indicates the problematic name within an
``x-ms-invalid-name`` element, as shown in the following XML fragment:

   ::


      <Metadata>
        <MyMetadata1>first value</MyMetadata1>
        <MyMetadata2>second value</MyMetadata2>
        <x-ms-invalid-name>invalid-metadata-name</x-ms-invalid-name>
      </Metadata>

Container public permissions are provided in the PublicAccess property. It
indicates whether data in the container may be accessed publicly and the level
of access. Possible values include:

- container: Indicates full public read access for container and blob
  data. Clients can enumerate blobs within the container via anonymous request,
  but cannot enumerate containers within the storage account.

- blob: Indicates public read access for blobs. Blob data within this container
  can be read via anonymous request, but container data is not
  available. Clients cannot enumerate blobs within the container via anonymous
  request.

If this property is not specified in the section, the container is private to
the account owner.

``HasImmutabilityPolicy`` is ``true`` if the container has an
immutability policy set on it, ``false`` otherwise. ``HasLegalHold`` is
``true`` if the container has one or more legal hold(s) on it, ``false``
otherwise.

.. note::

   The response body for ``List Containers`` returns the container's last
   modified time in an element named ``Last-Modified``.


Authorization
~~~~~~~~~~~~~

Only the account owner may call this operation.

Remarks
~~~~~~~

If you specify a value for the ``maxresults`` parameter and the number of
containers to return exceeds this value, or exceeds the default value for
``maxresults``, the response body will contain the ``NextMarker`` element (also
referred to as a continuation token).  ``NextMarker`` indicates the next
container to return on a subsequent request. To return the next set of items,
specify the value of ``NextMarker`` for the ``marker`` parameter on the URI for
the subsequent request. The value of ``NextMarker`` must be treated as opaque.

If the listing operation crosses a partition boundary, then the service will
return a value for the ``NextMarker`` element for retrieving the remainder of
the results from the next partition. A listing operation that spans more than
one partition results in a smaller set of items being returned than is specified
by ``maxresults``, or than the default of 5000. Your application should always
check for the presence of the ``NextMarker`` element when you perform a listing
operation, and handle it accordingly.

Containers are listed in alphabetical order in the response body.

The ``List Containers`` operation times out after 30 seconds.


Sample Request and Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following sample URI requests the list of containers for an account, setting
the maximum results to return for the initial operation to 3.

::

   GET https://myaccount.blob.example.com/?comp=list&maxresults=3 HTTP/1.1

The request is sent with these headers:

::

      x-ms-version: 2016-05-31
      x-ms-date: Wed, 26 Oct 2016 22:08:44 GMT
      Authorization: SharedKey myaccount:CY1OP3O3jGFpYFbTCBimLn0Xov0vt0khH/D5Gy0fXvg=

The status code and response headers are returned as follows:

   ::

      HTTP/1.1 200 OK
      Transfer-Encoding: chunked
      Content-Type: application/xml
      Date: Wed, 26 Oct 2016 22:08:54 GMT
      x-ms-version: 2016-05-31
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0


The response XML for this request is as follows. Note that the ``NextMarker``
element follows the set of containers and includes the name of the next
container to be returned.

   ::

      <?xml version="1.0" encoding="utf-8"?>
      <EnumerationResults ServiceEndpoint="https://myaccount.blob.example.com/">
        <MaxResults>3</MaxResults>
        <Containers>
          <Container>
            <Name>audio</Name>
            <Properties>
              <Last-Modified>Wed, 26 Oct 2016 20:39:39 GMT</Last-Modified>
              <Etag>0x8CACB9BD7C6B1B2</Etag>
              <PublicAccess>container</PublicAccess>
            </Properties>
          </Container>
          <Container>
            <Name>images</Name>
            <Properties>
              <Last-Modified>Wed, 26 Oct 2016 20:39:39 GMT</Last-Modified>
              <Etag>0x8CACB9BD7C1EEEC</Etag>
            </Properties>
          </Container>
          <Container>
            <Name>textfiles</Name>
            <Properties>
              <Last-Modified>Wed, 26 Oct 2016 20:39:39 GMT</Last-Modified>
              <Etag>0x8CACB9BD7BACAC3</Etag>
            </Properties>
          </Container>
        </Containers>
        <NextMarker>video</NextMarker>
      </EnumerationResults>

The subsequent list operation specifies the marker on the request URI, as
follows. The next set of results is returned beginning with the container
specified by the marker.

   ::

      https://myaccount.blob.example.com/?comp=list&maxresults=3&marker=video
