.. _Abort Multipart Upload:

Abort Multipart Upload
======================

The Abort Multipart Upload operation is used to cancel a multipart
upload (the upload ID for the affected object must be supplied). Once
initiated, no additional parts can be uploaded using that upload ID.

.. tip::

  In the event of an Abort Multipart Upload operation, the storage
  consumed by any previously uploaded parts is freed. However, any partial
  uploads currently in progress may or may not succeed. Therefore,
  aborting a given multipart upload multiple times may be required to
  completely free all storage consumed by all upload parts. To verify that
  all parts have been removed, call the List Parts operation to ensure the
  parts list is empty.

Requests
--------

Syntax
~~~~~~

An upload ID must be included in the URL query string supplied with the
DELETE request for the Abort Multipart Upload operation:

.. code::

   DELETE /{{ObjectName}}?uploadId={{UploadId}} HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

Parameters
~~~~~~~~~~

The Abort Multipart Upload operation does not use Request Parameters.

Headers
~~~~~~~

The Abort Multipart Upload operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).

Elements
~~~~~~~~

The Abort Multipart Upload operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The Abort Multipart Upload operation uses only
response headers that are common to all operations (refer to :ref:`Common
Request Headers`).

Elements
~~~~~~~~

The Abort Multipart Upload operation does not return response elements.

Errors
~~~~~~

.. tabularcolumns:: X{0.25\textwidth}X{0.25\textwidth}X{0.45\textwidth}
.. table::

   +------------------+-------------------+-----------------------------------+
   | Error            | HTTP Status Code  | Description                       |
   +==================+===================+===================================+
   | ``NoSuchUpload`` | ``404 Not Found`` | Occurs when an invalid upload ID  |
   |                  |                   | is provided in the Upload Part    |
   |                  |                   | request, or when a multipart      |
   |                  |                   | upload has already been either    |
   |                  |                   | completed or aborted.             |
   +------------------+-------------------+-----------------------------------+

Examples
--------

Aborting a Multipart Upload Identified by Its Upload ID
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   DELETE /example-object?uploadId=VXBsb2FkIElEIGZvciBlbHZpbmcncyBteS1tb3ZpZS5tMnRzIHVwbG9hZ HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   Authorization: {{authorizationString}}

Response
````````

.. code::

   HTTP/1.1 204 OK
   x-amz-id-2: Weag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 996c76696e6727732072657175657374
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   Content-Length: 0
   Connection: keep-alive
   Server: ScalityS3
