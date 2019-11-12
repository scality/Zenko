.. _Get Container Properties:

Get Container Properties
========================

The Get Container Properties operation returns all user-defined metadata and
system properties for the specified container. The data returned does not
include the container's list of blobs.

Request
-------

The Get Container Properties request may be constructed as follows. HTTPS is
recommended. Replace ``myaccount`` with the name of your storage account, and
``example.com`` with your endpoint's domain name or IP address.

.. tabularcolumns:: lll
.. table::

   +----------+----------------------------------------------------------------------+--------------+
   | Method   | Request URI                                                          | HTTP Version |
   +==========+======================================================================+==============+
   | GET/HEAD | ``https://myaccount.blob.example.com/mycontainer?restype=container`` | HTTP/1.1     |
   +----------+----------------------------------------------------------------------+--------------+

Emulated Storage Service URI
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When making a request against the emulated storage service, specify the emulator
hostname and Blob service port as ``127.0.0.1:10000``, followed by the emulated
storage account name:

============ ========================================================================= ============
Method       Request URI                                                               HTTP Version
============ ========================================================================= ============
GET/HEAD     ``http://127.0.0.1:10000/devstoreaccount1/mycontainer?restype=container`` HTTP/1.1
============ ========================================================================= ============

For more information, see |emulator-dev-test|.

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

=========== =====================================================================================================================================
Parameter   Description
=========== =====================================================================================================================================
``timeout`` Optional. The ``timeout`` parameter is expressed in seconds. For more information, see |set-blob-timeouts|.
=========== =====================================================================================================================================

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: ll
.. table::

   +----------------------------+---------------------------------------------------------+
   | Request Header             | Description                                             |
   +============================+=========================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, account   |
   |                            | name, and signature. For more information, see          |
   |                            | |authorize-requests|.                                   |
   +----------------------------+---------------------------------------------------------+
   | ``Date or x-ms-date``      | Required. Specifies the Coordinated Universal Time      |
   |                            | (UTC) for the request. For more information, see        |
   |                            | |authorize-requests|.                                   |
   +----------------------------+---------------------------------------------------------+
   | ``x-ms-lease-id: <ID>``    | Optional, If specified, ``Get Container Properties``    |
   |                            | only succeeds if the container's lease is active and    |
   |                            | matches this ID. If there is no active lease or the ID  |
   |                            | does not match, ``412 (Precondition Failed)`` is        |
   |                            | returned.                                               |
   +----------------------------+---------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests, optional for      |
   |                            | anonymous requests. Specifies the version of the        |
   |                            | operation to use for this request. For more information,|
   |                            | see |azure-versioning|.                                 |
   +----------------------------+---------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value     |
   |                            | with a 1 KB character limit that is recorded in the     |
   |                            | analytics logs when storage analytics logging is        |
   |                            | enabled. Using this header is highly recommended for    |
   |                            | correlating client-side activities with requests        |
   |                            | received by the server. For more information, see       |
   |                            | |analytics-log| and |storage-tracking|.                 |
   +----------------------------+---------------------------------------------------------+


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

.. tabularcolumns:: ll
.. table::

   +------------------------------------+-------------------------------------+
   | Response Header                    | Description                         |
   +====================================+=====================================+
   | ``x-ms-meta-name:value``           | Returns a string containing a       |
   |                                    | name/value pair associated with     |
   |                                    | the container as metadata.          |
   +------------------------------------+-------------------------------------+
   | ``ETag``                           | The entity tag for the container.   |
   |                                    | the ETag value will be in quotes.   |
   +------------------------------------+-------------------------------------+
   | ``Last-Modified``                  | Returns the date and time the       |
   |                                    | container was last modified. The    |
   |                                    | date format follows RFC 1123. For   |
   |                                    | more information, see               |
   |                                    | |date-time-headers|                 |
   |                                    | Any operation that modifies the     |
   |                                    | container or its properties or      |
   |                                    | metadata updates the last           |
   |                                    | modified time. Operations on        |
   |                                    | blobs do not affect the last        |
   |                                    | modified time of the container.     |
   +------------------------------------+-------------------------------------+
   | ``x-ms-lease-status: <locked |``   | The lease status of the container.  |
   | ``unlocked>``                      |                                     |
   +------------------------------------+-------------------------------------+
   | ``x-ms-lease-state: <available |`` | The lease state of the container.   |
   | ``leased | expired | breaking |``  |                                     |
   | ``broken>``                        |                                     |
   +------------------------------------+-------------------------------------+
   | ``x-ms-lease-duration: <infinite   | Only when the container is          | 
   | | fixed >``                        | leased. Specifies whether the       |
   |                                    | lease on a container is of          |
   |                                    | infinite or fixed duration.         |
   +------------------------------------+-------------------------------------+
   | ``x-ms-request-id``                | This header uniquely identifies     |
   |                                    | the request that was made and can   |
   |                                    | be used for troubleshooting the     |
   |                                    | request. For more information,      |
   |                                    | see |api-troubleshoot|.             |
   +------------------------------------+-------------------------------------+
   | ``x-ms-version``                   | Indicates the version of the Blob   |
   |                                    | service used to execute the         |
   |                                    | request. Also returned for          | 
   |                                    | anonymous requests without a        |
   |                                    | version specified.                  |
   +------------------------------------+-------------------------------------+
   | ``Date``                           | A UTC date/time value generated     |
   |                                    | by the service that indicates the   |
   |                                    | time at which the response was      |
   |                                    | initiated.                          |
   +------------------------------------+-------------------------------------+
   | ``x-ms-blob-public-access``        | Indicates whether data in the       |
   |                                    | container may be accessed           |
   |                                    | publicly and the level of access.   |
   |                                    | Possible values include:            |
   |                                    |                                     |
   |                                    | - container: Indicates full public  |
   |                                    |   read access for container and     |
   |                                    |   blob data. Clients can enumerate  |
   |                                    |   blobs within the container via    |
   |                                    |   anonymous request, but cannot     |
   |                                    |   enumerate containers within the   |
   |                                    |   storage account.                  |
   |                                    | - blob: Indicates public read       |
   |                                    |   access for blobs. Blob data       |
   |                                    |   within this container can be read |
   |                                    |   via anonymous request, but        |
   |                                    |   container data is not available.  |
   |                                    |   Clients cannot enumerate blobs    |
   |                                    |   within the container via          |
   |                                    |   anonymous request.                |
   |                                    |                                     |
   |                                    | If this header is not returned in   |
   |                                    | the response, the container is      |
   |                                    | private to the account owner.       |
   +------------------------------------+-------------------------------------+
   | ``x-ms-has-immutability-policy``   | Indicates whether the container     |
   |                                    | has an immutability policy set on   |
   |                                    | it. Value is ``true`` if there is   |
   |                                    | a policy set, ``false`` otherwise.  |
   +------------------------------------+-------------------------------------+
   | ``x-ms-has-legal-hold``            | Indicates whether the container     |
   |                                    | has a legal hold. Value is          |
   |                                    | ``true`` if there is one or more    |
   |                                    | legal hold(s), ``false`` otherwise. |
   +------------------------------------+-------------------------------------+
   | ``x-ms-client-request-id``         | This header can be used to          |
   |                                    | troubleshoot requests and           |
   |                                    | corresponding responses. The        |
   |                                    | value of this header is equal to    |
   |                                    | the value of the                    |
   |                                    | ``x-ms-client-request-id`` header   |
   |                                    | if it is present in the request     |
   |                                    | and the value is at most 1024       |
   |                                    | visible ASCII characters. If the    |
   |                                    | ``x-ms-client-request-id`` header   |
   |                                    | is not present in the request,      |
   |                                    | this header will not be present     |
   |                                    | in the response.                    |
   +------------------------------------+-------------------------------------+

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
      x-ms-meta-Name: StorageSample  
      Date: Sun, 25 Sep 2016 12:43:08 GMT  
      ETag: "0x8CAFB82EFF70C46"  
      Last-Modified: Sun, 25 Sep 2016 10:42:18 GMT  
      x-ms-version: 2016-05-31
      x-ms-blob-public-access: blob  
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0  

Authorization
~~~~~~~~~~~~~

If the container's access control list (ACL) is set to allow anonymous access to
the container, any client may call this operation. If the container is private,
this operation can be performed by the account owner.

