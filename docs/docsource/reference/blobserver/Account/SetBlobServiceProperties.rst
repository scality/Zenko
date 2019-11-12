.. _Set Blob Service Properties:

Set Blob Service Properties
===========================

The Set Blob Service Properties operation sets properties for a storage
account's Blob service endpoint, including properties for storage analytics.

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

.. tabularcolumns:: X{0.45\textwidth}X{0.50\textwidth}
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

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::

   +----------------------------+------------------------------------------------------------------------+
   | Request Header             | Description                                                            |
   +============================+========================================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, storage account name,    |
   |                            | and signature. For more information, see |authorize-requests|.         |
   +----------------------------+------------------------------------------------------------------------+
   |  ``Date`` or ``x-ms-date`` | Required. Specifies the Coordinated Universal Time (UTC) for the       |
   |                            | request. For more information, see |authorize-requests|.               |
   +----------------------------+------------------------------------------------------------------------+
   |  ``x-ms-version``          | Required for all authorized requests. Specifies the version of the     |
   |                            | operation to use for this request. For more information, see           |
   |                            | |azure-versioning|.                                                    |
   +----------------------------+------------------------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value with a 1 KB        |
   |                            | character limit that is recorded in the analytics logs when storage    |
   |                            | analytics logging is enabled. Using this header is highly recommended  |
   |                            | for correlating client-side activities with requests received by the   |
   |                            | server. For more information, see |analytics-log| and                  |
   |                            | |storage-tracking|.                                                    |
   +----------------------------+------------------------------------------------------------------------+

Request Body
~~~~~~~~~~~~

The format of the request body is as follows:

   ::

      <?xml version="1.0" encoding="utf-8"?>
      <StorageServiceProperties>
          <Logging>
              <Version>1.0</Version>
              <Delete>false</Delete>
              <Read>false</Read>
              <Write>false</Write>
              <RetentionPolicy>
                  <Enabled>false</Enabled>
                  <Days>0</Days>
              </RetentionPolicy>
          </Logging>
          <HourMetrics>
              <Version>1.0</Version>
              <Enabled>false</Enabled>
              <IncludeAPIs>false</IncludeAPIs>
              <RetentionPolicy>
                  <Enabled>false</Enabled>
                  <Days>0</Days>
              </RetentionPolicy>
          </HourMetrics>
          <MinuteMetrics>
              <Version>1.0</Version>
              <Enabled>false</Enabled>
              <IncludeAPIs>false</IncludeAPIs>
              <RetentionPolicy>
                  <Enabled>false</Enabled>
                  <Days>0</Days>
              </RetentionPolicy>
          </MinuteMetrics>
	  <Cors>
	  </Cors>
          <DefaultServiceVersion>2018-03-28</DefaultServiceVersion>
          <DeleteRetentionPolicy>
              <Enabled>false</Enabled>
              <Days>0</Days>
          </DeleteRetentionPolicy>
          <StaticWebsite>
              <Enabled>false</Enabled>
          </StaticWebsite>
      </StorageServiceProperties>

You can call Set Blob Service Properties with one or more root elements
specified in the request body. The root elements include:

-  Logging
-  HourMetrics
-  MinuteMetrics
-  DefaultServiceVersion
-  Cors
-  DeleteRetentionPolicy
-  StaticWebsite

Zenko implements a subset of these elements as default values in the
constants.js file in the root of the Blobserver repo. All root elements are
preconfigured to false, with version set to ``1.0``, retentionPolicy disabled
(``false``) with days set to ``0``, and defaultServiceVersion set to
``2018-03-28``. CORS is disabled and returns nothing.

If you attempt to set one of these values outside the constants.js file, the
response will contain the values set in constants.js. Do not modifying the
contents.js file. Doing so will introduce unpredictable Blobserver behavior.

The following table describes the elements of the request body:

.. tabularcolumns:: ll
.. table::
   :class: longtable

   +------------------------------------+---------------------------------------------+
   | Element Name                       | Description                                 |
   +====================================+=============================================+
   | Logging                            | Optional. Groups the Azure Analytics        |
   |                                    | Logging settings. Disabled in Zenko version |
   |                                    | |version|.                                  |
   +------------------------------------+---------------------------------------------+
   | Metrics                            | Groups the Azure Analytics Metrics          |
   |                                    | settings. The Metrics settings provide a    |
   |                                    | summary of request statistics grouped by    |
   |                                    | API in hourly aggregates for blobs.         |
   |                                    | Disabled in Zenko version |version|.        |
   +------------------------------------+---------------------------------------------+
   | HourMetrics                        | Optional. Groups the Azure Analytics        |
   |                                    | HourMetrics settings. The HourMetrics       |
   |                                    | settings provide a summary of request       |
   |                                    | statistics grouped by API in hourly         |
   |                                    | aggregates for blobs. Disabled in Zenko     |
   |                                    | version |version|.                          |
   +------------------------------------+---------------------------------------------+
   | MinuteMetrics                      | Optional. Groups the Azure Analytics        |
   |                                    | MinuteMetrics settings. The MinuteMetrics   |
   |                                    | settings provide request statistics for     |
   |                                    | each minute for blobs. Disabled in Zenko    |
   |                                    | version |version|.                          |
   +------------------------------------+---------------------------------------------+
   | Version                            | Required if Logging, Metrics, HourMetrics,  |
   |                                    | or MinuteMetrics settings are specified.    |
   |                                    | The Blobserver version is preconfigured to  |
   |                                    | ``2018-03-28``.                             |
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
   | RetentionPolicy: Enabled           | Required. Indicates whether a retention     |
   |                                    | policy is enabled for the storage service.  |
   +------------------------------------+---------------------------------------------+
   | RetentionPolicy: Days              | Required only if a retention policy is      |
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
   |                                    | Blob service. This value is hard-coded to   |
   |                                    | ``2018-03-28`` in Zenko version |version|.  |
   +------------------------------------+---------------------------------------------+
   | Cors                               | Groups all CORS rules. Not supported in     |
   |                                    | Zenko version |version|.                    |
   +------------------------------------+---------------------------------------------+
   | CorsRule                           | Groups settings for a CORS rule.            |
   +------------------------------------+---------------------------------------------+
   | AllowedOrigins                     | A comma-separated list of origin domains    |
   |                                    | that are allowed via CORS, or "*" if all    |
   |                                    | domains are allowed.                        |
   +------------------------------------+---------------------------------------------+
   | ExposedHeaders                     | A comma-separated list of response headers  |
   |                                    | to expose to CORS clients.                  |
   +------------------------------------+---------------------------------------------+
   | MaxAgeInSeconds                    | The number of seconds that the              |
   |                                    | client/browser should cache a preflight     |
   |                                    | response.                                   |
   +------------------------------------+---------------------------------------------+
   | AllowedHeaders                     | A comma-separated list of headers allowed   |
   |                                    | to be part of the cross-origin request.     |
   +------------------------------------+---------------------------------------------+
   | AllowedMethods                     | A comma-separated list of HTTP methods that |
   |                                    | are allowed to be executed by the origin.   |
   |                                    | For Blobserver, permitted methods are       |
   |                                    | DELETE, GET, HEAD, MERGE, POST, OPTIONS or  |
   |                                    | PUT.                                        |
   +------------------------------------+---------------------------------------------+
   | DeleteRetentionPolicy              | Optional. To set DeleteRetentionPolicy,     |
   |                                    | call :ref:`Set Blob Service Properties`.    |
   |                                    | Groups the Soft Delete settings. Applies    |
   |                                    | only to the Blob service. Not supported in  |
   |                                    | Zenko version |version|.                    |
   +------------------------------------+---------------------------------------------+
   | DeleteRetentionPolicy: Enabled     | Required. Indicates whether deleted blob    |
   |                                    | is retained or immediately removed by a     |
   |                                    | delete operation.                           |
   +------------------------------------+---------------------------------------------+
   | DeleteRetentionPolicy: Days        | Required only if DeleteRetentionPolicy/\    |
   |                                    | Enabled is true. Indicates the number of    |
   |                                    | days th deleted blob is retained. Data      |
   |                                    | older than this value is permanently        |
   |                                    | deleted. The minimum specifiable value is   |
   |                                    | ``1``; the largest is ``365``.              |
   +------------------------------------+---------------------------------------------+
   | StaticWebsite                      | Optional. To set StaticWebsite properties,  |
   |                                    | call Set Blob Service Properties.           |
   |                                    | Applies only to the Blob service.           |
   +------------------------------------+---------------------------------------------+
   | StaticWebsite: Enabled             | Required. Indicates whether static website  |
   |                                    | support is enabled for the given account.   |
   +------------------------------------+---------------------------------------------+
   | StaticWebsite: IndexDocument       | Optional. The webpage that Azure Storage    |
   |                                    | serves for requests to the root of a        |
   |                                    | website or any subfolder. For example,      |
   |                                    | ``index.html``. The value is case-sensitive.|
   +------------------------------------+---------------------------------------------+
   | StaticWebsite:                     | Optional. The absolute path to a webpage    |
   | ErrorDocument404Path               | that Azure Storage serves for requests that |
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

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
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
              <Delete>false</Delete>
              <Read>false</Read>
              <Write>false</Write>
              <RetentionPolicy>
                  <Enabled>false</Enabled>
                  <Days>0</Days>
              </RetentionPolicy>
          </Logging>
          <HourMetrics>
              <Version>1.0</Version>
              <Enabled>false</Enabled>
              <IncludeAPIs>false</IncludeAPIs>
              <RetentionPolicy>
                  <Enabled>false</Enabled>
                  <Days>0</Days>
              </RetentionPolicy>
          </HourMetrics>
          <MinuteMetrics>
              <Version>1.0</Version>
              <Enabled>false</Enabled>
              <IncludeAPIs>false</IncludeAPIs>
              <RetentionPolicy>
                  <Enabled>false</Enabled>
                  <Days>0</Days>
              </RetentionPolicy>
          </MinuteMetrics>
          <DeleteRetentionPolicy>
              <Enabled>false</Enabled>
              <Days>0</Days>
          </DeleteRetentionPolicy>
          <StaticWebsite>
              <Enabled>false</Enabled>
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
