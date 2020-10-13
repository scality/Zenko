.. _Get Account Information:

Get Account Information
=======================

The Get Account Information operation returns the SKU name and account kind
for the specified account.

Request
-------

The Get Account Information request may be constructed using a valid request
that is authorized using Shared Key or SAS authorization.

By adding a restype value of ``account`` and comp value of ``properties``, the
request uses the Get Account Information API. An example is shown.

.. tabularcolumns:: lLL
.. table::
   :widths: auto

   +----------+--------------------------------------------------------------------------------------------------------------+--------------+
   | Method   | Request URI                                                                                                  | HTTP Version |
   +==========+==============================================================================================================+==============+
   | GET/HEAD | ``https://myaccount.blob.example.com/?restype=account&comp=properties``                                      | HTTP/1.1     |
   +----------+--------------------------------------------------------------------------------------------------------------+--------------+
   | GET/HEAD | ``https://myaccount.blob.example.com/?restype=account&comp=properties&sv=myvalidsastoken``                   | HTTP/1.1     |
   +----------+--------------------------------------------------------------------------------------------------------------+--------------+
   | GET/HEAD | ``https://myaccount.blob.example.com/mycontainer/?restype=account&comp=properties&sv=myvalidsastoken``       | HTTP/1.1     |
   +----------+--------------------------------------------------------------------------------------------------------------+--------------+
   | GET/HEAD | ``https://myaccount.blob.example.com/mycontainer/myblob?restype=account&comp=properties&sv=myvalidsastoken`` | HTTP/1.1     |
   +----------+--------------------------------------------------------------------------------------------------------------+--------------+

URI Parameters
~~~~~~~~~~~~~~

The following additional parameters may be specified on the request URI.

.. tabularcolumns:: X{0.20\textwidth}X{0.75\textwidth}
.. table::
   :widths: auto

   +-------------+----------------------------------------------------------------+
   | Parameter   | Description                                                    |
   +=============+================================================================+
   | ``restype`` | Required. The ``restype`` parameter value must be ``account``. |
   +-------------+----------------------------------------------------------------+
   | ``comp``    | Required. The ``comp`` parameter value must be ``properties``. |
   +-------------+----------------------------------------------------------------+

Request Headers
~~~~~~~~~~~~~~~

The following table describes required and optional request headers.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::
   :widths: auto

   +----------------------------+---------------------------------------------------------------------------------+
   | Request Header             | Description                                                                     |
   +============================+=================================================================================+
   | ``Authorization``          | Required. Specifies the authorization scheme, account name, and signature. For  |
   |                            | more information, see |authorize-requests|.                                     |
   +----------------------------+---------------------------------------------------------------------------------+
   | ``Date or x-ms-date``      | Required. Specifies the Coordinated Universal Time (UTC) for the request. For   |
   |                            | more information, see |authorize-requests|.                                     |
   +----------------------------+---------------------------------------------------------------------------------+
   | ``x-ms-version``           | Required for all authorized requests. Specifies the version of the operation to |
   |                            | use for this request. For more information, see |azure-versioning|.             |
   +----------------------------+---------------------------------------------------------------------------------+
   | ``x-ms-client-request-id`` | Optional. Provides a client-generated, opaque value with a 1 KB character limit |
   |                            | that is recorded in the analytics logs when storage analytics logging is        |
   |                            | enabled. Using this header is highly recommended for correlating client-side    |
   |                            | activities with requests received by the server. For more information, see      |
   |                            | |analytics-log|.                                                                |
   +----------------------------+---------------------------------------------------------------------------------+

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

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::
   :widths: auto

   +----------------------------+-------------------------------------------------------------------------------+
   | Response Header            | Description                                                                   |
   +============================+===============================================================================+
   | ``x-ms-request-id``        | This header uniquely identifies the request that was made and can be used for |
   |                            | troubleshooting the request. For more information, see |api-troubleshoot|.    |
   +----------------------------+-------------------------------------------------------------------------------+
   | ``x-ms-version``           | Indicates the version of the Blob service used to execute the request.        |
   +----------------------------+-------------------------------------------------------------------------------+
   | ``Date``                   | A UTC date/time value generated by the service that indicates when the        |
   |                            | response started.                                                             |
   +----------------------------+-------------------------------------------------------------------------------+
   | ``Content-Length``         | The length of the request body. For this operation, the content length is     |
   |                            | always zero.                                                                  |
   +----------------------------+-------------------------------------------------------------------------------+
   | ``x-ms-sku-name``          | This header identifies the sku name of the specified account.                 |
   +----------------------------+-------------------------------------------------------------------------------+
   | ``x-ms-account-kind``      | This header identifies the account kind of the specified account. Possible    |
   |                            | values are ``Storage``, ``BlobStorage``, and ``StorageV2``. GPv1 and GPv2     |
   |                            | storage accounts are differentiated with the ``V2`` substring for GPv2        |
   |                            | accounts.                                                                     |
   +----------------------------+-------------------------------------------------------------------------------+
   | ``x-ms-client-request-id`` | This header can be used to troubleshoot requests and corresponding responses. |
   |                            | The value of this header is equal to the value of the                         |
   |                            | ``x-ms-client-request-id`` header if it is present in the request and the     |
   |                            | value is at most 1024 visible ASCII characters. If the                        |
   |                            | ``x-ms-client-request-id`` header is not present in the request, this header  |
   |                            | will not be present in the response.                                          |
   +----------------------------+-------------------------------------------------------------------------------+


Response Body
~~~~~~~~~~~~~

None

Sample Response
~~~~~~~~~~~~~~~

::

   Response Status:
   HTTP/1.1 200 OK

   Response Headers:
   Date: Sat, 28 Mar 2018 12:43:08 GMT
   x-ms-version: 2018-03-28
   Server: Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0
   Content-Length: 0
   x-ms-sku-name: Standard_LRS
   x-ms-account-kind: StorageV2

Authorization
~~~~~~~~~~~~~

The storage account owner and users with valid SAS tokens may call this
operation. In this context, a valid SAS token must have at least one available
permission for the resource specified in the SAS token.

Remarks
-------

The URL path of the request does not affect the information given by this
operation. Its purpose is to allow the request to correctly authorize with a SAS
token that specifies the allowed resource.

The resource specified need not exist for this operation to succeed. For
example, a SAS token generated with a non-existent blob and valid permissions
will succeed with a URL path that includes the correct account name, the correct
container name, and the non-existent blob's name.
