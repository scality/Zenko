.. _Set Blob Service Properties:

Set Blob Service Properties
===========================

The Set Blob Service Properties operation sets properties for a storage
account's Blob service endpoint, including properties for storage analytics and
soft delete settings.

You can also use this operation to set the default request version for all
incoming Blob service requests lacking a specified version.

See |cors-support| for more information on CORS rules.

.. note::

   Although CORS rules are listed in this schema, Zenko version |version| does not
   support CORS features.

Request
-------

The Set Blob Service Properties request may be specified as follows. HTTPS is
recommended. Replace ``<account-name>`` with the name of your storage account,
and ``example.com`` with the domain name or IP address of your endpoint:

.. tabularcolumns:: lll
.. table::   

   +--------+------------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                                  | HTTP Version |
   +========+==============================================================================+==============+
   | PUT    | ``https://<account-name>.blob.example.com/?restype=service&comp=properties`` | HTTP/1.1     |
   +--------+------------------------------------------------------------------------------+--------------+

The URI must include the forward slash (/) to separate the host name from the
path and query portions of the URI. For this operation, the path portion of the
URI remains empty.

URI Parameters
~~~~~~~~~~~~~~

.. tabularcolumns:: lll
.. table::   

   +-------------------------------------+--------------------------------------------------------------+
   | URI Parameter                       | Description                                                  |
   +=====================================+==============================================================+
   | ``restype=service&comp=properties`` | Required. The combination of both query strings is required  |
   |                                     | to set the storage service properties.                       |
   +-------------------------------------+--------------------------------------------------------------+
   | ``timeout``                         | Optional. The ``timeout`` parameter is expressed in seconds. |
   |                                     | For more information, see |set-blob-timeouts|.               |
   +-------------------------------------+--------------------------------------------------------------+
   
Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

========================== ==========================================================================================================================================================================================================================================================================================================================================================================================================
Request Header             Description
========================== ==========================================================================================================================================================================================================================================================================================================================================================================================================
``Authorization``          Required. Specifies the authorization scheme, storage account name, and signature. For more information, see |authorize-requests|.
``Date`` or ``x-ms-date``  Required. Specifies the Coordinated Universal Time (UTC) for the request. For more information, see |authorize-requests|.
``x-ms-version``           Required for all authorized requests. Specifies the version of the operation to use for this request. For more information, see |azure-versioning|.
``x-ms-client-request-id`` Optional. Provides a client-generated, opaque value with a 1 KB character limit that is recorded in the analytics logs when storage analytics logging is enabled. Using this header is highly recommended for correlating client-side activities with requests received by the server. For more information, see |analytics-log| and |storage-tracking|.
========================== ==========================================================================================================================================================================================================================================================================================================================================================================================================

Request Body
~~~~~~~~~~~~

The format of the request body is as follows:

   ::

      <?xml version="1.0" encoding="utf-8"?>  
      <StorageServiceProperties>  
          <Logging>  
              <Version>version-number</Version>  
              <Delete>true|false</Delete>  
              <Read>true|false</Read>  
              <Write>true|false</Write>  
              <RetentionPolicy>  
                  <Enabled>true|false</Enabled>  
                  <Days>number-of-days</Days>  
              </RetentionPolicy>  
          </Logging>  
          <HourMetrics>  
              <Version>version-number</Version>  
              <Enabled>true|false</Enabled>  
              <IncludeAPIs>true|false</IncludeAPIs>  
              <RetentionPolicy>  
                  <Enabled>true|false</Enabled>  
                  <Days>number-of-days</Days>  
              </RetentionPolicy>  
          </HourMetrics>  
          <MinuteMetrics>  
              <Version>version-number</Version>  
              <Enabled>true|false</Enabled>  
              <IncludeAPIs>true|false</IncludeAPIs>  
              <RetentionPolicy>  
                  <Enabled>true|false</Enabled>  
                  <Days>number-of-days</Days>  
              </RetentionPolicy>  
          </MinuteMetrics>  
          <DefaultServiceVersion>default-service-version-string</DefaultServiceVersion>
          <DeleteRetentionPolicy>
              <Enabled>true|false</Enabled>
              <Days>number-of-days</Days>
          </DeleteRetentionPolicy>
          <StaticWebsite>
              <Enabled>true|false</Enabled>
              <IndexDocument>default-name-of-index-page-under-each-directory</IndexDocument>
              <ErrorDocument404Path>absolute-path-of-the-custom-404-page</ErrorDocument404Path>
          </StaticWebsite>
      </StorageServiceProperties>  

You can call Set Blob Service Properties with one or more root elements
specified in the request body. The root elements include:

-  Logging
-  HourMetrics
-  MinuteMetrics
-  DefaultServiceVersion
-  DeleteRetentionPolicy
-  StaticWebsite

It is no longer necessary to specify every root element on the request. If you
omit a root element, the existing settings for the service for that
functionality are preserved. However, if you do specify a given root element,
you must specify every child element for that element.

The following table describes the elements of the request body:

.. tabularcolumns:: ll
.. table::

   +------------------------------------+---------------------------------------------+
   | Element Name                       | Description                                 |
   +====================================+=============================================+
   | Logging                            | Optional. Groups the Azure Analytics        |
   |                                    | Logging settings.                           |
   +------------------------------------+---------------------------------------------+
   | Metrics                            | Not applicable.                             |
   +------------------------------------+---------------------------------------------+
   | HourMetrics                        | Optional. Groups the Azure Analytics        |
   |                                    | HourMetrics settings. The HourMetrics       |
   |                                    | settings provide a summary of request       |
   |                                    | statistics grouped by API in hourly         |
   |                                    | aggregates for blobs.                       |
   +------------------------------------+---------------------------------------------+
   | MinuteMetrics                      | Optional. Groups the Azure Analytics        |
   |                                    | MinuteMetrics settings. The MinuteMetrics   |
   |                                    | settings provide request statistics for     |
   |                                    | each minute for blobs.                      |
   +------------------------------------+---------------------------------------------+
   | Version                            | Required if Logging, Metrics, HourMetrics,  |
   |                                    | or MinuteMetrics settings are specified.    |
   |                                    | The version of Storage Analytics to         |
   |                                    | configure.                                  |
   +------------------------------------+---------------------------------------------+
   | Delete                             | Required if Logging, Metrics, HourMetrics,  |
   |                                    | or MinuteMetrics settings are specified.    |
   |                                    | Applies only to logging configuration.      |
   |                                    | Indicates all delete requests shall be      |
   |                                    | logged.                                     |
   +------------------------------------+---------------------------------------------+
   | Read                               | Required if Logging, Metrics, HourMetrics,  |
   |                                    | or MinuteMetrics settings are specified.    |
   |                                    | Applies only to logging configuration.      |
   |                                    | Indicates all read requests shall be logged.|
   +------------------------------------+---------------------------------------------+
   | Write                              | Required if Logging, Metrics, HourMetrics,  |
   |                                    | or MinuteMetrics settings are specified.    |
   |                                    | Applies only to logging configuration.      |
   |                                    | Indicates all write requests shall be       |
   |                                    | logged.                                     |
   +------------------------------------+---------------------------------------------+
   | Enabled                            | Required. Indicates whether metrics for the |
   |                                    | Blob service are enabled. If read-access    | 
   |                                    | geo-redundant replication is enabled, both  |
   |                                    | primary and secondary metrics are           |
   |                                    | collected. If read-access geo-redundant     |
   |                                    | replication is not enabled, only primary    |
   |                                    | metrics are collected.                      |
   +------------------------------------+---------------------------------------------+
   | IncludeAPIs                        | Required only if metrics are enabled.       |
   |                                    | Applies only to metrics configuration.      |
   |                                    | Indicates whether metrics should generate   |
   |                                    | summary statistics for called API           |
   |                                    | operations.                                 |
   +------------------------------------+---------------------------------------------+
   | RetentionPolicy/Enabled            | Required. Indicates whether a retention     |
   |                                    | policy is enabled for the storage service.  |
   +------------------------------------+---------------------------------------------+
   | RetentionPolicy/Days               | Required only if a retention policy is      |
   |                                    | enabled. Indicates the number of days that  |
   |                                    | metrics or logging data shall be retained.  |
   |                                    | Data older than this value is deleted. The  |
   |                                    | minimum specifiable value is ``1``; the     |
   |                                    | largest is ``365`` (one year).              |
   +------------------------------------+---------------------------------------------+
   | DefaultServiceVersion              | Optional. To set DefaultServiceVersion,     |
   |                                    | call Set Blob Service Properties.           |
   |                                    | ``DefaultServiceVersion`` indicates the     |
   |                                    | default version to use for requests to the  |
   |                                    | Blob service if an incoming request's       |
   |                                    | version is not specified. For more          |
   |                                    | information on applicable versions, see     |
   |                                    | |azure-versioning|. Applies only to the     |
   |                                    | Blob service.                               |
   +------------------------------------+---------------------------------------------+
   | Cors                               | Not applicable (Not supported in Zenko      |
   |                                    | version |version|).                         |
   +------------------------------------+---------------------------------------------+
   | CorsRule                           | Not applicable (Not supported in Zenko      |
   |                                    | version |version|).                         |
   +------------------------------------+---------------------------------------------+
   | AllowedOrigins                     | Not applicable (Not supported in Zenko      |
   |                                    | version |version|).                         |
   +------------------------------------+---------------------------------------------+
   | ExposedHeaders                     | Not applicable (Not supported in Zenko      |
   |                                    | version |version|).                         |
   +------------------------------------+---------------------------------------------+
   | MaxAgeInSeconds                    | Not applicable (Not supported in Zenko      |
   |                                    | version |version|).                         |
   +------------------------------------+---------------------------------------------+
   | AllowedHeaders                     | Not applicable (Not supported in Zenko      |
   |                                    | version |version|).                         |
   +------------------------------------+---------------------------------------------+
   | AllowedMethods                     | Not applicable (Not supported in Zenko      |
   |                                    | version |version|).                         |
   +------------------------------------+---------------------------------------------+
   | DeleteRetentionPolicy              | Optional. To set DeleteRetentionPolicy,     |
   |                                    | call Set Blob Service Properties.           |
   |                                    | Groups the Soft Delete settings. Applies    |
   |                                    | only to the Blob service.                   |
   +------------------------------------+---------------------------------------------+
   | DeleteRetentionPolicy/Enabled      | Required. Indicates whether deleted blob    |
   |                                    | is retained or immediately removed by a     |
   |                                    | delete operation.                           |
   +------------------------------------+---------------------------------------------+
   | DeleteRetentionPolicy/Days         | Required only if DeleteRetentionPolicy/\    |
   |                                    | Enabled is true. Indicates the number of    |
   |                                    | days th deleted blob is retained. Data      |
   |                                    | older than this value is permanently        |
   |                                    | deleted. The minimum specifiable value is   |
   |                                    | ``1``; the l argest is ``365``.             |
   +------------------------------------+---------------------------------------------+
   | StaticWebsite                      | Optional. To set StaticWebsite properties,  |
   |                                    | call Set Blob Service Properties.           |
   |                                    | Applies only to the Blob service.           |
   +------------------------------------+---------------------------------------------+
   | StaticWebsite/Enabled              | Required. Indicates whether static website  |
   |                                    | support is enabled for the given account.   |
   +------------------------------------+---------------------------------------------+
   | StaticWebsite/IndexDocument        | Optional. The webpage that Azure Storage    |
   |                                    | serves for requests to the root of a        |
   |                                    | website or any subfolder. For example,      |
   |                                    | ``index.html``. The value is case-sensitive.|
   +------------------------------------+---------------------------------------------+
   | StaticWebsite/ErrorDocument404Path | Optional. The absolute path to a webpage    |
   |                                    | that Azure Storage serves for requests that |
   |                                    | do not correspond to an existing file.      |
   |                                    | For example, ``error/404.html``. Only a     |
   |                                    | single custom 404 page is supported in each |
   |                                    | static website. The value is case-sensitive.|
   +------------------------------------+---------------------------------------------+

Response
--------

The response includes an HTTP status code and a set of response headers.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 202 (Accepted).

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification .

.. tabularcolumns:: ll
.. table::

   +----------------------------+---------------------------------------------------------------+
   | Response Header            | Description                                                   |
   +============================+===============================================================+
   | ``x-ms-request-id``        | A value that uniquely identifies a request made against the   |
   |                            | service.                                                      |
   +----------------------------+---------------------------------------------------------------+
   | ``x-ms-version``           | Specifies the version of the operation used for the response. |
   |                            | For more information, see |azure-versioning|.                 |
   +----------------------------+---------------------------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to troubleshoot requests and          |
   |                            | corresponding responses. The value of this header is equal to |
   |                            | the value of the ``x-ms-client-request-id`` header if it is   |
   |                            | present in the request and the value is at most 1024 visible  |
   |                            | ASCII characters. When the ``x-ms-client-request-id`` header  |
   |                            | is not present in the request, this header is not present in  |
   |                            | the response.                                                 |
   +----------------------------+---------------------------------------------------------------+


Response Body
~~~~~~~~~~~~~

None

Authorization
~~~~~~~~~~~~~

Only the account owner may call this operation.

Sample Request and Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following sample URI makes a request to change the Blob service properties
for the fictional storage account named "myaccount":

   ::

      PUT https://myaccount.blob.example.com/?restype=service&comp=properties HTTP/1.1  

The request is sent with the following headers:

   ::

      x-ms-version: 2018-03-28
      x-ms-date: Tue, 12 Sep 2018 23:38:35 GMT 
      Authorization: SharedKey myaccount:Z1lTLDwtq5o1UYQluucdsXk6/iB7YxEu0m6VofAEkUE=  
      Host: myaccount.blob.example.com  

The request is sent with the following XML body:

   ::

      <?xml version="1.0" encoding="utf-8"?>  
      <StorageServiceProperties>  
          <Logging>  
              <Version>1.0</Version>  
              <Delete>true</Delete>  
              <Read>false</Read>  
              <Write>true</Write>  
              <RetentionPolicy>  
                  <Enabled>true</Enabled>  
                  <Days>7</Days>  
              </RetentionPolicy>  
          </Logging>  
          <HourMetrics>  
              <Version>1.0</Version>  
              <Enabled>true</Enabled>  
              <IncludeAPIs>false</IncludeAPIs>  
              <RetentionPolicy>  
                  <Enabled>true</Enabled>  
                  <Days>7</Days>  
              </RetentionPolicy>  
          </HourMetrics>  
          <MinuteMetrics>  
              <Version>1.0</Version>  
              <Enabled>true</Enabled>  
              <IncludeAPIs>true</IncludeAPIs>  
              <RetentionPolicy>  
                  <Enabled>true</Enabled>  
                  <Days>7</Days>  
              </RetentionPolicy>  
          </MinuteMetrics>  
          <DeleteRetentionPolicy>
              <Enabled>true</Enabled>
              <Days>5</Days>
          </DeleteRetentionPolicy>  
          <StaticWebsite>  
              <Enabled>true</Enabled>  
              <IndexDocument>index.html</IndexDocument>  
              <ErrorDocument404Path>error/404.html</ErrorDocument404Path>  
          </StaticWebsite>  
          <DefaultServiceVersion>2018-03-28</DefaultServiceVersion>  
      </StorageServiceProperties>  

After the request has been sent, the following response is returned:

   ::

      HTTP/1.1 202 Accepted
      Transfer-Encoding: chunked
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
      x-ms-request-id: cb939a31-0cc6-49bb-9fe5-3327691f2a30 
      x-ms-version: 2018-03-28
      Date: Tue, 12 Sep 2018 23:38:35 GMT
     

