.. _Delete Container:

Delete Container
================

The Delete Container operation marks the specified container for deletion. The
container and any blobs within it are deleted during subsequent garbage
collection.

Request
-------

The Delete Container request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+----------------------------------------------------------------------+--------------+
   | Method | Request URI                                                          | HTTP Version |
   +========+======================================================================+==============+
   | DELETE | ``https://myaccount.blob.example.com/mycontainer?restype=container`` | HTTP/1.1     |
   +--------+----------------------------------------------------------------------+--------------+

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

   +----------------------------+--------------------------------------------------------------------------------+
   | Request Header             | Description                                                                    |
   +============================+================================================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, account name, and signature. For |
   |                            | more information, see |authorize-requests|.                                    |
   +----------------------------+--------------------------------------------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the Coordinated Universal Time (UTC) for the request. For  |
   |                            | more information, see |authorize-requests|.                                    |
   +----------------------------+--------------------------------------------------------------------------------+
   | ``x-ms-lease-id``          | Not applicable (Zenko version |version| deos not support leasing).             |
   +----------------------------+--------------------------------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests. Specifies the version of the operation   |
   |                            | to use for this request. For more information, see |azure-versioning|.         |
   +----------------------------+--------------------------------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value with a 1 KB character      |
   |                            | limit that is recorded in the analytics logs when storage analytics logging is |
   |                            | enabled. Using this header is highly recommended for correlating client-side   |
   |                            | activities with requests received by the server. For more information, see     |
   |                            | |analytics-log| and |storage-tracking|.                                        |
   +----------------------------+--------------------------------------------------------------------------------+

This operation also supports using conditional headers to delete the container
only if a specified condition is met. For more information, see |conditional-headers|.


Request Body
~~~~~~~~~~~~

None

Sample Request
~~~~~~~~~~~~~~

   ::

      Request Syntax:
      DELETE https://myaccount.blob.example.com/mycontainer?restype=container HTTP/1.1

      Request Headers:
      x-ms-version: 2011-08-18
      x-ms-date: Sun, 25 Sep 2011 21:44:34 GMT
      Authorization: SharedKey devstoreaccount1:t7mf5htNuwLFX9g0S2LDdRtRn1FQzMAluBvHy1QPpnM=

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
the HTTP/1.1 specification.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+--------------------------------------------------------------------+
   | Response Header            | Description                                                        |
   +============================+====================================================================+
   | ``x-ms-request-id``        | This header uniquely identifies the request that was made and can  |
   |                            | be used for troubleshooting the request. For more information, see |
   |                            | |api-troubleshoot|.                                                |
   +----------------------------+--------------------------------------------------------------------+
   | ``x-ms-version``           | Indicates the version of the Blob service used to execute the      |
   |                            | request.                                                           |
   +----------------------------+--------------------------------------------------------------------+
   | ``Date``                   | A UTC date/time value generated by the service that indicates the  |
   |                            | time at which the response was initiated.                          |
   +----------------------------+--------------------------------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to troubleshoot requests and corresponding |
   |                            | responses. The value of this header is equal to the value of the   |
   |                            | ``x-ms-client-request-id`` header if it is present in the request  |
   |                            | and the value is at most 1024 visible ASCII characters. If the     |
   |                            | ``x-ms-client-request-id`` header is not present in the request,   |
   |                            | this header will not be present in the response.                   |
   +----------------------------+--------------------------------------------------------------------+

Response Body
~~~~~~~~~~~~~

None

Sample Response
~~~~~~~~~~~~~~~

   ::

      Response Status:
      HTTP/1.1 202 Accepted

      Response Headers:
      Transfer-Encoding: chunked
      Content-Type: application/xml
      Date: Sun, 25 Sep 2011 21:45:00 GMT
      x-ms-version: 2011-08-18
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0

Authorization
~~~~~~~~~~~~~

Only the account owner may call this operation.

Remarks
-------

When a container is deleted, a container with the same name cannot be created
for at least 30 seconds; the container may not be available for more than 30
seconds if the service is still processing the request. While the container is
being deleted, attempts to create a container of the same name will fail with
status code 409 (Conflict), with the service returning additional error
information indicating that the container is being deleted. All other
operations, including operations on any blobs under the container, will fail
with status code 404 (Not Found) while the container is being deleted.
