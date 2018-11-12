.. _Upload Part:

Upload Part
===========

Use the Upload Part operation to upload each part of an object being
saved to storage via a multipart upload. Before you using this
operation, an :ref:`Initiate Multipart Upload` request must be issued for
the object, as the upload ID returned by that operation is required for
the Upload Part operation. Along with the upload ID, a part number must
also be specified with each Upload Part operation.

Part numbers can be any number from 1 to 10,000, inclusive. A part
number uniquely identifies a part and also defines its position within
the object being created. If a new part is uploaded using the same part
number that was used with a previous part, the previously uploaded part
is overwritten.

The largest part size permitted is 5 GB which means that the biggest
object that can be split is 50 TB (10,000 \* 5 GB). Each part must be at
least 5 MB in size, except the last part. There is no minimum size
threshold on the last part of a multipart upload.

Each part must be at least 5 MB in size, except the last part. There is
no minimum size threshold on the last part of a multipart upload.

After all the parts are uploaded, a :ref:`Complete Multipart Upload` request must be issued.

Requests
--------

**Request Syntax**

.. code::

   PUT /ObjectName?partNumber=PartNumber&amp;uploadId=UploadId HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Content-Length: Size
   Authorization: {{authorizationString}}

**Request Parameters**

The Upload Part operation does not use Request Parameters.

**Request Headers**

The Upload Part operation can use a number of optional request headers
in addition to those that are common to all operations (refer to :ref:`Common
Request Headers`).

+-----------------------+-----------------------+-----------------------+
| Header                | Type                  | Description           |
+=======================+=======================+=======================+
| Content-Length        | integer               | The size of the       |
|                       |                       | object, in bytes      |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| Content-MD5           | string                | The base64-encoded    |
|                       |                       | 128-bit MD5 digest of |
|                       |                       | the message (without  |
|                       |                       | the headers)          |
|                       |                       | according to RFC      |
|                       |                       | 1864. This header can |
|                       |                       | be used as a message  |
|                       |                       | integrity check to    |
|                       |                       | verify that the data  |
|                       |                       | is the same data that |
|                       |                       | was originally sent.  |
|                       |                       | Although it is        |
|                       |                       | optional, the use of  |
|                       |                       | the Content-MD5       |
|                       |                       | mechanism is          |
|                       |                       | recommended as an     |
|                       |                       | end-to-end integrity  |
|                       |                       | check.                |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| Expect                | string                | When your application |
|                       |                       | uses                  |
|                       |                       | ``100-continue``, it  |
|                       |                       | does not send the     |
|                       |                       | request body until it |
|                       |                       | receives an           |
|                       |                       | acknowledgment. If    |
|                       |                       | the message is        |
|                       |                       | rejected based on the |
|                       |                       | headers, the body of  |
|                       |                       | the message is not    |
|                       |                       | sent.                 |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Valid Values:         |
|                       |                       | ``100-continue``      |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| Expires               | string                | The date and time at  |
|                       |                       | which the object is   |
|                       |                       | no longer cacheable.  |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+

**Request Elements**

The Upload Part operation does not return request elements.

Responses
---------

**Response Headers**

Implementation of the Upload Part operation uses only response headers
that are common to all operations (refer to :ref:`Common Response Headers`).

**Response Elements**

The Upload Part operation does not return response elements.

**Special Errors**

+-----------------------------------+-----------------------------------+
| Error                             | Description                       |
+===================================+===================================+
| NoSuchUpload error                | Occurs when an invalid upload ID  |
| (HTTP 404 Not Found status code)  | is provided in the Upload Part    |
|                                   | request, or when a multipart      |
|                                   | upload has already been either    |
|                                   | completed or aborted.             |
+-----------------------------------+-----------------------------------+

Examples
--------

**PUT Request Uploads a Part in a Multipart Upload**

*Request Sample*

Part 1 of a multipart upload using the upload ID returned by an :ref:`Initiate Multipart Upload` request:

.. code::

   PUT /my-movie.m2ts?partNumber=1&amp;uploadId=VCVsb2FkIElEIGZvciBlbZZpbmcncyBteS1tb3ZpZS5tMnRzIHVwbG9hZR HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   Content-Length: 10485760
   Content-MD5: pUNXr/BjKK5G2UKvaRRrOA==
   Authorization: {{authorizationString}}
   ***part data omitted***

*Response Sample*

The response includes the ETag header, a value that is needed for
sending the :ref:`Complete Multipart Upload` request.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Vvag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   ETag: "b54357faf0632cce46e942fa68356b38"
   Content-Length: 0
   Connection: keep-alive
   Server: ScalityS3
