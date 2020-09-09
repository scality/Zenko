.. _Get Blob Service Properties:

Get Blob Service Properties
===========================

The Get Blob Service Properties operation gets the properties of a storage
account's Blob service, including properties for storage analytics and CORS
(Cross-Origin Resource Sharing) rules.

For detailed information about CORS rules and evaluation logic, see |cors-support|.

.. note::

   Although CORS rules are listed in this schema, Blobserver |version| does not
   support CORS features.

Request
-------

The Get Blob Service Properties request may be specified as follows. HTTPS
is recommended. Replace ``<account-name>`` with the name of your storage
account and ``example.com`` with the domain name or IP address of your endpoint:

.. tabularcolumns:: X{0.10\textwidth}X{0.70\textwidth}X{0.15\textwidth}
.. table::

   +--------+------------------------------------------------------------------------------+--------------+
   | Method | Request URI                                                                  | HTTP Version |
   +========+==============================================================================+==============+
   | GET    | ``https://<account-name>.blob.example.com/?restype=service&comp=properties`` | HTTP/1.1     |
   +--------+------------------------------------------------------------------------------+--------------+

The URI must always include a forward slash (/) to separate the host name from
the path and query portions of the URI. In this operation, the path portion of
the URI is empty.

URI Parameters
~~~~~~~~~~~~~~

.. tabularcolumns:: X{0.35\textwidth}X{0.60\textwidth}
.. table::

   +-------------------------------------+-------------------------------------------------------------------+
   | URI Parameter                       | Description                                                       |
   +=====================================+===================================================================+
   | ``restype=service&comp=properties`` | Required. The combination of both query strings is required to get|
   |                                     | the storage service properties.                                   |
   +-------------------------------------+-------------------------------------------------------------------+
   | ``timeout``                         | Optional. The ``timeout`` parameter is expressed in seconds. For  |
   |                                     | more information, see |set-blob-timeouts|.                        |
   +-------------------------------------+-------------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+---------------------------------------------------------------------------+
   | Request Header             | Description                                                               |
   +============================+===========================================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, storage account name, and   |
   |                            | signature. For more information, see |authorize-requests|.                |
   +----------------------------+---------------------------------------------------------------------------+
   | ``Date`` or ``x-ms-date``  | Required. Specifies the Coordinated Universal Time (UTC) for the request. |
   |                            | For more information, see |authorize-requests|.                           |
   +----------------------------+---------------------------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests. Specifies the version of the        |
   |                            | operation to use for this request. For more information, see              |
   |                            | |azure-versioning|.                                                       |
   +----------------------------+---------------------------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value with a 1 KB character |
   |                            | limit that is recorded in the analytics logs when storage analytics       |
   |                            | logging is enabled. Using this header is highly recommended for           |
   |                            | correlating client-side activities with requests received by the server.  |
   |                            | For more information, see |analytics-log| and |storage-tracking|.         |
   +----------------------------+---------------------------------------------------------------------------+


Request Body
~~~~~~~~~~~~

None

Response
--------

The response includes an HTTP status code, a set of response headers, and a
response body.

Status Codes
~~~~~~~~~~~~

A successful operation returns status code 200 (OK).

Response Headers
~~~~~~~~~~~~~~~~

The response for this operation includes the following headers. The response may
also include additional standard HTTP headers. All standard headers conform to
the HTTP/1.1 protocol specification.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +----------------------------+--------------------------------------------------------------+
   | Response Header            | Description                                                  |
   +============================+==============================================================+
   | ``x-ms-request-id``        | A value that uniquely identifies a request made against the  |
   |                            | the service.                                                 |
   +----------------------------+--------------------------------------------------------------+
   | ``x-ms-version``           | Specifies the version of the operation used for the          |
   |                            | response. For more information, see |azure-versioning|.      |
   +----------------------------+--------------------------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to troubleshoot requests and         |
   |                            | corresponding responses. The value of this header is equal   |
   |                            | to the value of the ``x-ms-client-request-id`` header if it  |
   |                            | is present in the request and the value is at most 1024      |
   |                            | visible ASCII characters. If the ``x-ms-client-request-id``  |
   |                            | header is not present in the request, this header will not   |
   |                            | be present in the response.                                  |
   +----------------------------+--------------------------------------------------------------+


Response Body
~~~~~~~~~~~~~

The format of the response body is as follows:

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
          <Cors/>
          <DefaultServiceVersion>2018-03-28</DefaultServiceVersion>
          <DeleteRetentionPolicy>
              <Enabled>false</Enabled>
              <Days>0</Days>
          </DeleteRetentionPolicy>
          <StaticWebsite>
              <Enabled>false</Enabled>
          </StaticWebsite>
      </StorageServiceProperties>

The following table describes the elements of the response body:

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +-----------------------------------+-----------------------------------+
   | Element Name                      | Description                       |
   +===================================+===================================+
   | Logging                           | Groups the Azure Analytics        |
   |                                   | Logging settings. Disabled in     |
   |                                   | Zenko version |version|.          |
   +-----------------------------------+-----------------------------------+
   | Metrics                           | Groups the Azure Analytics        |
   |                                   | Metrics settings. The             |
   |                                   | Metrics settings provide a        |
   |                                   | summary of request statistics     |
   |                                   | grouped by API in hourly          |
   |                                   | aggregates for blobs. Disabled in |
   |                                   | Zenko version |version|.          |
   +-----------------------------------+-----------------------------------+
   | HourMetrics                       | Groups the Azure Analytics        |
   |                                   | HourMetrics settings. The         |
   |                                   | HourMetrics settings provide      |
   |                                   | a summary of request statistics   |
   |                                   | grouped by API in hourly          |
   |                                   | aggregates for blobs. Disabled in |
   |                                   | Zenko version |version|.          |
   +-----------------------------------+-----------------------------------+
   | MinuteMetrics                     | Groups the Azure Analytics        |
   |                                   | MinuteMetrics settings. The       |
   |                                   | MinuteMetrics settings            |
   |                                   | provide request statistics for    |
   |                                   | each minute for blobs. Disabled   |
   |                                   | in Zenko version |version|.       |
   +-----------------------------------+-----------------------------------+
   | Version                           | The version of Storage Analytics  |
   |                                   | currently in use. The Blobserver  |
   |                                   | version is preconfigured to       |
   |                                   | ``2018-03-28``.                   |
   +-----------------------------------+-----------------------------------+
   | Delete                            | Applies only to logging           |
   |                                   | configuration. Indicates whether  |
   |                                   | delete requests are being logged. |
   +-----------------------------------+-----------------------------------+
   | Read                              | Applies only to logging           |
   |                                   | configuration. Indicates whether  |
   |                                   | read requests are being logged.   |
   +-----------------------------------+-----------------------------------+
   | Write                             | Applies only to logging           |
   |                                   | configuration. Indicates whether  |
   |                                   | write requests are being logged.  |
   +-----------------------------------+-----------------------------------+
   | Enabled                           | Indicates whether metrics are     |
   |                                   | enabled for the Blob service.     |
   |                                   | If read-access geo-redundant      |
   |                                   | replication is enabled, both      |
   |                                   | primary and secondary metrics are |
   |                                   | collected. If read-access         |
   |                                   | geo-redundant replication is not  |
   |                                   | enabled, only primary metrics are |
   |                                   | collected.                        |
   +-----------------------------------+-----------------------------------+
   | IncludeAPIs                       | Applies only to metrics           |
   |                                   | configuration. Indicates whether  |
   |                                   | metrics generate summary          |
   |                                   | statistics for called API         |
   |                                   | operations.                       |
   +-----------------------------------+-----------------------------------+
   | RetentionPolicy/Enabled           | Indicates whether a retention     |
   |                                   | policy is enabled for the storage |
   |                                   | service.                          |
   +-----------------------------------+-----------------------------------+
   | RetentionPolicy/Days              | Indicates the number of days that |
   |                                   | metrics or logging data shall be  |
   |                                   | retained. Data older than this    |
   |                                   | value is deleted.                 |
   +-----------------------------------+-----------------------------------+
   | DefaultServiceVersion             | DefaultServiceVersion             |
   |                                   | indicates the default version to  |
   |                                   | use for requests to the Blob      |
   |                                   | service if an incoming            |
   |                                   | request's version is not          |
   |                                   | specified. For more information   |
   |                                   | on applicable versions, see       |
   |                                   | |azure-versioning|.               |
   |                                   | Blobserver's default version is   |
   |                                   | ``2018-03-28``.                   |
   +-----------------------------------+-----------------------------------+
   | Cors                              | Groups all CORS rules. Not        |
   |                                   | supported in Zenko version        |
   |                                   | |version|.                        |
   +-----------------------------------+-----------------------------------+
   | CorsRule                          | Groups settings for a CORS rule.  |
   +-----------------------------------+-----------------------------------+
   | AllowedOrigins                    | A comma-separated list of origin  |
   |                                   | domains that are allowed via      |
   |                                   | CORS, or "*" if all domains are   |
   |                                   | allowed.                          |
   +-----------------------------------+-----------------------------------+
   | ExposedHeaders                    | A comma-separated list of         |
   |                                   | response headers to expose to     |
   |                                   | CORS clients.                     |
   +-----------------------------------+-----------------------------------+
   | MaxAgeInSeconds                   | The number of seconds that the    |
   |                                   | client/browser should cache a     |
   |                                   | preflight response.               |
   +-----------------------------------+-----------------------------------+
   | AllowedHeaders                    | A comma-separated list of headers |
   |                                   | allowed to be part of the         |
   |                                   | cross-origin request.             |
   +-----------------------------------+-----------------------------------+
   | AllowedMethods                    | A comma-separated list of HTTP    |
   |                                   | methods that are allowed to be    |
   |                                   | executed by the origin. For Azure |
   |                                   | Storage, permitted methods are    |
   |                                   | DELETE, GET, HEAD, MERGE, POST,   |
   |                                   | OPTIONS or PUT.                   |
   +-----------------------------------+-----------------------------------+
   | DeleteRetentionPolicy             | Groups the Azure Delete settings. |
   |                                   | Applies only to the Blob service. |
   |                                   | Not supported in Zenko version    |
   |                                   | |version|.                        |
   +-----------------------------------+-----------------------------------+
   | Enabled                           | Indicates whether deleted blob    |
   |                                   | is retained or immediately        |
   |                                   | removed by delete operation.      |
   +-----------------------------------+-----------------------------------+
   | Days                              | Indicates the number of days that |
   |                                   | deleted blob be retained. All     |
   |                                   | data older than this value will   |
   |                                   | be permanently deleted.           |
   +-----------------------------------+-----------------------------------+
   | StaticWebsite                     | Groups the static website         |
   |                                   | settings. Applies only to the     |
   |                                   | Blob service. Not supported in    |
   |                                   | Zenko version |version|.          |
   +-----------------------------------+-----------------------------------+
   | StaticWebsite: Enabled            | Indicates whether                 |
   |                                   | staticwebsite support is          |
   |                                   | enabled for the given account.    |
   +-----------------------------------+-----------------------------------+
   | StaticWebsite: IndexDocument      | The webpage that Azure Storage    |
   |                                   | serves for requests to the root   |
   |                                   | of a website or any subfolder.    |
   |                                   | For example, ``index.html``. The  |
   |                                   | value is case-sensitive.          |
   +-----------------------------------+-----------------------------------+
   | StaticWebsite:                    | The absolute path to a webpage    |
   | ErrorDocument404Path              | that Azure Storage serves for     |
   |                                   | requests that do not correspond   |
   |                                   | to an existing file. For example, |
   |                                   | ``error/404.html``. The value is  |
   |                                   | case-sensitive.                   |
   +-----------------------------------+-----------------------------------+

Authorization
~~~~~~~~~~~~~

Only the storage account owner may call this operation.

Sample Request and Response
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following sample URI makes a request to get the Blob service properties for
the fictional storage account named "myaccount":

   ::

      GET https://myaccount.blob.example.com/?restype=service&comp=properties&timeout=30 HTTP/1.1

The request is sent with the following headers:

   ::

      x-ms-version: 2018-03-28
      x-ms-date: Tue, 12 Sep 2018 23:38:36 GMT
      Authorization: SharedKey myaccount:Z1lTLDwtq5o1UYQluucdsXk6/iB7YxEu0m6VofAEkUE=
      Host: myaccount.blob.example.com

After the request has been sent, the following response is returned:

   ::

      HTTP/1.1 200 OK
      Transfer-Encoding: chunked
      Content-Type: application/xml
      Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
      x-ms-request-id: cb939a31-0cc6-49bb-9fe5-3327691f2a30
      x-ms-version: 2018-03-28
      Date: Tue, 10 Sep 2019 21:09:33 GMT

The response includes the following XML body:

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
              <Enabled>true</Enabled>
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
          <Cors/>
          <DefaultServiceVersion>2018-03-28</DefaultServiceVersion>
          <DeleteRetentionPolicy>
              <Enabled>false</Enabled>
              <Days>0</Days>
          </DeleteRetentionPolicy>
          <StaticWebsite>
              <Enabled>false</Enabled>
          </StaticWebsite>
      </StorageServiceProperties>
