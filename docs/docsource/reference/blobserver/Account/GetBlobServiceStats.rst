.. _Get Blob Service Stats:

Get Blob Service Stats
======================

The Get Blob Service Stats operation retrieves statistics related to
replication for the Blob service. It is only available on the secondary location
endpoint when read-access geo-redundant replication is enabled for the storage
account.

Request
-------

The Get Blob Service Stats request may be constructed as follows.  HTTPS is
recommended. The ``-secondary`` suffix is required when you replace
``myaccount`` with the name of your storage account. Replace example.com with
your endpoint's domain name or IP address. 

.. tabularcolumns:: lll
.. table::

   +--------+------------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                                  | HTTP Version |
   +========+==============================================================================+==============+
   | GET    | ``https://myaccount-secondary.blob.example.com/?restype=service&comp=stats`` | HTTP/1.1     |
   +--------+------------------------------------------------------------------------------+--------------+

The URI must always include the forward slash (/) to separate the host name from
the path and query portions of the URI. In the case of this operation, the path
portion of the URI is empty.

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

=========== ============================================================
Parameter   Description
=========== ============================================================
``Timeout`` Optional. The ``timeout`` parameter is expressed in seconds.
=========== ============================================================

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: ll
.. table::

   +----------------------------+-----------------------------------------------------------------+
   | Request Header             | Description                                                     |
   +============================+=================================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, account name, and |
   |                            | signature. For more information, see |authorize-requests|.      |
   +----------------------------+-----------------------------------------------------------------+
   | ``Date or x-ms-date``      | Required. Specifies the Coordinated Universal Time (UTC) for    |
   |                            | the request. For more information, see |authorize-requests|.    |
   +----------------------------+-----------------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests. Specifies the version of  |
   |                            | the operation to use for this request. For more information,    |
   |                            | see |azure-versioning|.                                         |
   +----------------------------+-----------------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Client generated opaque value with 1KB character      |
   |                            | limit that is recorded in the analytics logs when Storage       |
   |                            | Analytics Logging is enabled. This header is recommended for    |
   |                            | correlating client side activities with requests received by    |
   |                            | the server. For more information see |storage-tracking|.        |
   +----------------------------+-----------------------------------------------------------------+


Request Body
~~~~~~~~~~~~

None

Response
--------

The response includes an HTTP status code, a set of response headers, and a
response body.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 200 (OK). When called on secondary
location endpoint that is not enabled for secondary read, it returns an
HTTP status code of 403 with ``InsufficientAccountPermissions`` error.

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response
also includes additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: ll
.. table::

   +----------------------------+-----------------------------------------------------------+
   | Response Header            | Description                                               |
   +============================+===========================================================+
   | ``x-ms-request-id``        | This header uniquely identifies the request that was made |
   |                            | and can be used for troubleshooting the request. For more |
   |                            | information, see |api-troubleshoot|.                      |
   +----------------------------+-----------------------------------------------------------+
   | ``x-ms-version``           | Specifies the version of the operation used for the       |
   |                            | response. For more information, see |azure-versioning|.   | 
   +----------------------------+-----------------------------------------------------------+
   | ``Date``                   | A UTC date/time value generated by the service that       |
   |                            | indicates the time at which the response was initiated.   |
   +----------------------------+-----------------------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to troubleshoot requests and      |
   |                            | corresponding responses. The value of this header is      |
   |                            | equal to the value of the ``x-ms-client-request-id``      |
   |                            | header if it is present in the request and the value is   |
   |                            | at most 1024 visible ASCII characters. If the             |
   |                            | ``x-ms-client-request-id`` header is not present in the   |
   |                            | request, this header will not be present in the response. |
   +----------------------------+-----------------------------------------------------------+


Response Body
~~~~~~~~~~~~~

The format of the response body is as follows:

   ::

      <?xml version="1.0" encoding="utf-8"?>  
      <StorageServiceStats>  
        <GeoReplication>        
            <Status>live|bootstrap|unavailable</Status>  
            <LastSyncTime>sync-time|<empty></LastSyncTime>  
        </GeoReplication>  
      </StorageServiceStats>  

The following table describes the elements of the response body:

.. tabularcolumns:: ll
.. table::
   
   +-----------------------------------+-----------------------------------+
   | Response Header                   | Description                       |
   +===================================+===================================+
   | ``Status``                        | The status of the secondary       |
   |                                   | location. Possible values are:    |
   |                                   |                                   |
   |                                   | - ``live``: Indicates that the    |
   |                                   |   secondary location is active    |
   |                                   |   and operational.                |
   |                                   | - ``bootstrap``: Indicates        |
   |                                   |   initial synchronization from    |
   |                                   |   the primary location to the     |
   |                                   |   secondary location is in        |
   |                                   |   progress. This typically occurs |
   |                                   |   when replication is first       |
   |                                   |   enabled.                        |
   |                                   | - ``unavailable:``: Indicates     |
   |                                   |   that the secondary location is  |
   |                                   |   temporarily unavailable.        |
   +-----------------------------------+-----------------------------------+
   | ``LastSyncTime``                  | A GMT date/time value, to the     |
   |                                   | second. All primary writes        |
   |                                   | preceding this value are          |
   |                                   | guaranteed to be available for    |
   |                                   | read operations at the secondary. |
   |                                   | Primary writes after this point   |
   |                                   | in time may or may not be         |
   |                                   | available for reads.              |
   |                                   | The value may be empty if         |
   |                                   | ``LastSyncTime`` is not           |
   |                                   | available. This can happen if the |
   |                                   | replication status is             |
   |                                   | ``bootstrap`` or ``unavailable``. |
   |                                   | Although geo-replication is       |
   |                                   | continuously enabled, the         |
   |                                   | ``LastSyncTime`` result may       |
   |                                   | reflect a cached value from the   |
   |                                   | service that is refreshed every   |
   |                                   | few minutes.                      |
   +-----------------------------------+-----------------------------------+

Authorization
~~~~~~~~~~~~~

Only the account owner may call this operation.

Remarks
-------

   With geo-redundant replication, Azure Storage maintains your data durable in
   two locations. In both locations, Azure Storage constantly maintains multiple
   healthy replicas of your data.

   The location where you read, create, update, or delete data is the *primary*
   storage account location. The primary location exists in the region you
   choose at the time you create an account via the Azure Management Azure
   classic portal, for example, "North Central US". The location to which
   your data is replicated is the *secondary* location. The secondary location
   resides in a region that is automatically geographically paired with the
   primary region.  Read-only access is available from the secondary location,
   if read-access geo-redundant replication is enabled for your storage
   account. For more on read-access geo-redundant replication, see
   |geo-redundant|.

   To construct a request for a read operation against the secondary endpoint,
   append ``-secondary`` as a suffix to the account name in the URI that you use
   to read from Blob storage. For example, a secondary URI for the Get Blob
   operation will be similar to
   ``https://myaccount-secondary.blob.example.com/mycontainer/myblob``.

Sample Request and Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following is a sample request for the ``Get Blob Service Stats`` operation:

   ::

      GET http://myaccount-secondary.blob.example.com/?restype=service&comp=stats HTTP/1.1  

The request is sent with following headers:

   ::

      x-ms-version: 2013-08-15  
      x-ms-date: Wed, 23 Oct 2013 22:08:44 GMT  
      Authorization: SharedKey myaccount:CY1OP3O3jGFpYFbTCBimLn0Xov0vt0khH/E5Gy0fXvg=  

The status code and response headers are returned as follows:

   ::

      HTTP/1.1 200 OK  
      Content-Type: application/xml  
      Date: Wed, 23 Oct 2013 22:08:54 GMT  
      x-ms-version: 2013-08-15  
      x-ms-request-id: cb939a31-0cc6-49bb-9fe5-3327691f2a30  
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0  

The response includes the following XML body:

   ::

      <?xml version="1.0" encoding="utf-8"?>  
      <StorageServiceStats>  
        <GeoReplication>  
            <Status>live</Status>  
            <LastSyncTime> Wed, 23 Oct 2013 22:05:54 GMT</LastSyncTime>        
        </GeoReplication>  
      </StorageServiceStats>  

