.. _Complete Multipart Upload:

Complete Multipart Upload
=========================

The Complete Multipart Upload operation is the last step in the
multipart upload of a large object, pulling together previously uploaded
parts, called only after a multipart upload is initiated and all of the
relevant parts have been uploaded (refer to :ref:`Upload Part`).
Upon receiving the Complete Multipart Upload request, Zenko concatenates all
the parts in ascending order by part number to create a new object.

The parts list must be provided for a Complete Multipart Upload request.
Care must be taken to ensure that the list is complete, and that the
part number and ETag header value are provided for each part (both of
which were returned with the successful uploading of the part).

Processing of a Complete Multipart Upload request can take several
minutes to complete. Once Zenko begins processing the request, it sends an
HTTP response header that specifies a ``200 OK`` response. While
processing is in progress, Zenko periodically sends whitespace characters to
keep the connection from timing out. Because a request could fail after
the initial response has been sent, it is important to check the
response body to determine whether the request succeeded.

Requests
--------

Syntax
~~~~~~

An upload ID must be included in the URL query string supplied with the
POST request for the Complete Multipart Upload operation:

.. code::

   POST /{{ObjectName}}?uploadId={{UploadId}} HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Content-Length: {{Size}}
   Authorization: {{authorizationString}}

.. code::

   <CompleteMultipartUpload>
   <Part>
   <PartNumber>{{PartNumber}}</PartNumber>
   <ETag>{{ETag}}</ETag>
   </Part>
   ...
   </CompleteMultipartUpload>

Parameters
~~~~~~~~~~

The Complete Multipart Upload operation does not use request parameters.

Headers
~~~~~~~

The Upload Part operation uses only request headers that are
common to all operations (see :ref:`Common Request Headers`).

Elements
~~~~~~~~

.. tabularcolumns:: X{0.40\textwidth}X{0.15\textwidth}X{0.40\textwidth}
.. table::

   +-----------------------------+-----------+-------------------------------------+
   | Element                     | Type      | Description                         |
   +=============================+===========+=====================================+
   | ``CompleteMultipartUpload`` | container | Container for the request           |
   +-----------------------------+-----------+-------------------------------------+
   | ``Part``                    | container | Container for elements related to a |
   |                             |           | particular previously uploaded part |
   +-----------------------------+-----------+-------------------------------------+
   | ``PartNumber``              | integer   | Part number that identifies the     |
   |                             |           | part                                |
   +-----------------------------+-----------+-------------------------------------+
   | ``ETag``                    | string    | Entity tag returned when the part   |
   |                             |           | was uploaded                        |
   +-----------------------------+-----------+-------------------------------------+

Responses
---------

Headers
~~~~~~~

The Complete Multipart Upload operation can include
the following response header in addition to the response headers common
to all responses (refer to :ref:`Common Response Headers`).

.. tabularcolumns:: X{0.30\textwidth}X{0.10\textwidth}X{0.55\textwidth}
.. table::

   +-----------------------+--------+--------------------------------------+
   | Header                | Type   | Description                          |
   +=======================+========+======================================+
   | ``x-amz-version-id``  | string | Returns the version ID of the        |
   |                       |        | retrieved object if it has a unique  |
   |                       |        | version ID.                          |
   |                       |        |                                      |
   |                       |        | **Default:** None                    |
   +-----------------------+--------+--------------------------------------+

Elements
~~~~~~~~

The Complete Multipart Upload operation can return the following XML elements of
the response (includes XML containers):

.. tabularcolumns:: X{0.40\textwidth}X{0.10\textwidth}X{0.45\textwidth}
.. table::

   +-----------------------------------+-----------+-----------------------------------+
   | Element                           | Type      | Description                       |
   +===================================+===========+===================================+
   | ``CompleteMultipartUploadResult`` | container | Container for the response        |
   +-----------------------------------+-----------+-----------------------------------+
   | ``Location``                      | URI       | The URI that identifies the newly |
   |                                   |           | created object                    |
   +-----------------------------------+-----------+-----------------------------------+
   | ``Bucket``                        | string    | The name of the bucket that       |
   |                                   |           | contains the newly created object |
   +-----------------------------------+-----------+-----------------------------------+
   | ``Key``                           | string    | The object key of the newly       |
   |                                   |           | created object                    |
   +-----------------------------------+-----------+-----------------------------------+
   | ``ETag``                          | string    | Entity tag that identifies the    |
   |                                   |           | newly created object’s data.      |
   |                                   |           | Objects with different object     |
   |                                   |           | data will have different entity   |
   |                                   |           | tags. The entity tag is an opaque |
   |                                   |           | string. The entity tag may or may |
   |                                   |           | not be an MD5 digest of the       |
   |                                   |           | object data. If the entity tag is |
   |                                   |           | not an MD5 digest of the object   |
   |                                   |           | data, it will contain one or more |
   |                                   |           | non-hexadecimal characters and    |
   |                                   |           | will consist of more or less than |
   |                                   |           | 32 hexadecimal digits.            |
   +-----------------------------------+-----------+-----------------------------------+

Special Errors
~~~~~~~~~~~~~~

.. tabularcolumns:: X{0.30\textwidth}X{0.30\textwidth}X{0.35\textwidth}
.. table::

   +----------------------+---------------------+-----------------------------------+
   | Error                | HTTP Status Code    | Description                       |
   +======================+=====================+===================================+
   | ``EntityTooSmall``   | ``400 Bad Request`` | Occurs when an a proposed upload  |
   |                      |                     | is smaller than the minimum       |
   |                      |                     | allowed object size. Each part    |
   |                      |                     | must be at least 5 MB in size,    |
   |                      |                     | except the last part.             |
   +----------------------+---------------------+-----------------------------------+
   | ``invalidPart``      | ``400 Bad Request`` | One or more of the specified      |
   |                      |                     | parts could not be found          |
   +----------------------+---------------------+-----------------------------------+
   | ``invalidPartOrder`` | ``400 Bad Request`` | The parts were not listed in      |
   |                      |                     | ascending order                   |
   +----------------------+---------------------+-----------------------------------+
   | ``NoSuchUpload``     | ``404 Not Found``   | Occurs when an invalid upload ID  |
   |                      |                     | is provided in the Upload Part    |
   |                      |                     | request, or when a multipart      |
   |                      |                     | upload has already been either    |
   |                      |                     | completed or aborted.             |
   +----------------------+---------------------+-----------------------------------+


Examples
--------

Request Specifying Three Parts in the Operation Element
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   POST /example-object?uploadId=AAAsb2FkIElEIGZvciBlbHZpbmcncyWeeS1tb3ZpZS5tMnRzIRRwbG9hZA HTTP/1.1
   Host: Example-Bucket.{{StorageService}}.com
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   Content-Length: 391
   Authorization: {{authorizationString}}

.. code::

   <CompleteMultipartUpload>
   <Part>
   <PartNumber>1</PartNumber>
   <ETag>"a54357aff0632cce46d942af68356b38"</ETag>
   </Part>
   <Part>
   <PartNumber>2</PartNumber>
   <ETag>"0c78aef83f66abc1fa1e8477f296d394"</ETag>
   </Part>
   <Part>
   <PartNumber>3</PartNumber>
   <ETag>"acbd18db4cc2f85cedef654fccc4a4d8"</ETag>
   </Part>
   </CompleteMultipartUpload>


Response Sample Indicating Successful Object Assembly
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Connection: close
   Server: ScalityS3

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <CompleteMultipartUploadResult xmlns="http://s3.scality.com/doc/2006-03-01/">
   <Location>http://Example-Bucket.s3.scality.com/Example-Object</Location>
   <Bucket>Example-Bucket</Bucket>
   <Key>Example-Object</Key>
   <ETag>"3858f62230ac3c915f300c664312c11f-9"</ETag>
   </CompleteMultipartUploadResult>

Response Sample with Error Specified in Header
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The response sample indicates that an error occurred before the HTTP
response header was sent.

.. code::

   HTTP/1.1 403 Forbidden
   x-amz-id-2: Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   Content-Length: 237
   Connection: keep-alive
   Server: ScalityS3

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <Error>
   <Code>AccessDenied</Code>
   <Message>Access Denied</Message>
   <RequestId>656c76696e6727732072657175657374</RequestId>
   <HostId>Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==</HostId>
   </Error>

Response Sample with Error Specified in Body
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The response sample indicates that an error occurred after the HTTP response
header was sent.

.. note::

  Although the HTTP status code is ``200 OK``, the request actually failed
  as described in the Error element.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   Connection: close
   Server: {{ScalityS3}


.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <Error>
   <Code>InternalError</Code>
   <Message>We encountered an internal error. Please try again.</Message>
   <RequestId>656c76696e6727732072657175657374</RequestId>
   <HostId>Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==</HostId>
   </Error>
