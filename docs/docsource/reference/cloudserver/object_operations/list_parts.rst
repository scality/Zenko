.. _List Parts:

List Parts
==========

The List Parts operation catalogs the parts that have been uploaded for a
specific multipart upload. The operation must include the upload ID, which is
obtained when the initiate multipart upload request is sent (refer to
:ref:`Initiate Multipart Upload`).

List Parts returns a maximum of 1,000 parts (which is also the default setting
for parts returned, adjustable via the max-parts request parameter). If the
multipart upload consists of more than 1,000 parts, the response returns an
IsTruncated field with the value of ``true``, and a NextPartNumberMarker
element. In subsequent List Parts requests it is possible to include the
part-number-marker query string parameter and set its value to the
NextPartNumberMarker field value from the previous response.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /{{ObjectName}}?uploadId={{UploadId}} HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

Parameters
~~~~~~~~~~

The List Parts operation’s GET implementation uses fixed parameters to return a
subset of a bucket’s objects.

.. tabularcolumns:: X{0.20\textwidth}X{0.10\textwidth}X{0.65\textwidth}
.. table::

   +------------------------+--------+-----------------------------------------+
   | Parameter              | Type   | Description                             |
   +========================+========+=========================================+
   | ``encoding-type``      | string | Requests that Zenko encode the response |
   |                        |        | and specifies the encoding method to    |
   |                        |        | use. An object key can contain any      |
   |                        |        | Unicode character; however, XML 1.0     |
   |                        |        | parser cannot parse some characters,    |
   |                        |        | such  as characters with an ASCII value |
   |                        |        | from 0 to 10. For characters that are   |
   |                        |        | not supported in XML 1.0, you can add   |
   |                        |        | this parameter to request that Zenko    |
   |                        |        | encode the keys in the response.        |
   |                        |        |                                         |
   |                        |        | **Default:** None                       |
   +------------------------+--------+-----------------------------------------+
   | ``uploadID``           | string | Upload ID identifying the multipart     |
   |                        |        | upload whose parts are being listed     |
   |                        |        |                                         |
   |                        |        | **Default:** None                       |
   +------------------------+--------+-----------------------------------------+
   | ``max-parts``          | string | Sets the maximum number of parts to     |
   |                        |        | return in the response body             |
   |                        |        |                                         |
   |                        |        | **Default:** None                       |
   +------------------------+--------+-----------------------------------------+
   | ``part-number-marker`` | string | Specifies the part after which listing  |
   |                        |        | should begin. Only parts with higher    |
   |                        |        | part numbers will be listed.            |
   |                        |        |                                         |
   |                        |        | **Default:** None                       |
   +------------------------+--------+-----------------------------------------+

Headers
~~~~~~~

The List Parts operation uses only request headers
that are common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

The List Parts operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The List Parts operation uses only the common response headers supported
by Zenko (see :ref:`Common Response Headers`).

Elements
~~~~~~~~

The List Parts operation can return the following XML elements in its response
(includes XML containers):

.. tabularcolumns:: X{0.25\textwidth}X{0.10\textwidth}X{0.60\textwidth}
.. table::

   +--------------------------+-----------+---------------------------------------+
   | Element                  | Type      | Description                           |
   +==========================+===========+=======================================+
   | ``ListPartsResult``      | container | Container for the response            |
   +--------------------------+-----------+---------------------------------------+
   | ``Bucket``               | string    | Name of the bucket to which the       |
   |                          |           | multipart upload was initiated        |
   +--------------------------+-----------+---------------------------------------+
   | ``Encoding-Type``        | string    | Encoding type used by Zenko to encode |
   |                          |           | object key names in the XML response. |
   |                          |           |                                       |
   |                          |           | If the encoding-type request          |
   |                          |           | parameter is specified, Zenko         |
   |                          |           | includes this element in the response,|
   |                          |           | and returns encoded key name values   |
   |                          |           | in the Key element.                   |
   +--------------------------+-----------+---------------------------------------+
   | ``Key``                  | string    | Object key for which the multipart    |
   |                          |           | upload was initiated                  |
   +--------------------------+-----------+---------------------------------------+
   | ``UploadId``             | string    | Upload ID identifying the multipart   |
   |                          |           | upload whose parts are being listed   |
   +--------------------------+-----------+---------------------------------------+
   | ``Initiator``            | container | Container element that identifies who |
   |                          |           | initiated the multipart upload        |
   +--------------------------+-----------+---------------------------------------+
   | ``ID``                   | string    | User ID                               |
   +--------------------------+-----------+---------------------------------------+
   | ``DisplayName``          | string    | Principal’s name                      |
   +--------------------------+-----------+---------------------------------------+
   | ``Owner``                | container | Container element that identifies the |
   |                          |           | object owner, after the object is     |
   |                          |           | created                               |
   +--------------------------+-----------+---------------------------------------+
   | ``PartNumberMarker``     | integer   | Part number after which listing begins|
   +--------------------------+-----------+---------------------------------------+
   | ``NextPartNumberMarker`` | integer   | When a list is truncated, this        |
   |                          |           | element specifies the last part in    |
   |                          |           | the list, as well as the value to use |
   |                          |           | for the part-number-marker request    |
   |                          |           | parameter in a subsequent request.    |
   +--------------------------+-----------+---------------------------------------+
   | ``MaxParts``             | integer   | Maximum number of parts allowed in    |
   |                          |           | the response                          |
   +--------------------------+-----------+---------------------------------------+
   | ``IsTruncated``          | Boolean   | Indicates whether the returned list   |
   |                          |           | of parts is truncated. A “true” value |
   |                          |           | indicates that the list was truncated.|
   |                          |           | A list can be truncated if the number |
   |                          |           | of parts exceeds the limit returned   |
   |                          |           | in the MaxParts element.              |
   +--------------------------+-----------+---------------------------------------+
   | ``Part``                 | string    | Container for elements related to a   |
   |                          |           | particular part. A response can       |
   |                          |           | contain zero or more Part elements.   |
   +--------------------------+-----------+---------------------------------------+
   | ``PartNumber``           | integer   | Part number identifying the part      |
   +--------------------------+-----------+---------------------------------------+
   | ``LastModified``         | date      | Date and time when the part was       |
   |                          |           | uploaded                              |
   +--------------------------+-----------+---------------------------------------+
   | ``ETag``                 | string    | Entity tag returned when the part was |
   |                          |           | uploaded                              |
   +--------------------------+-----------+---------------------------------------+
   | ``Size``                 | integer   | Size of the uploaded part data        |
   +--------------------------+-----------+---------------------------------------+

Examples
--------

List Parts
~~~~~~~~~~

Assume parts have been uploaded with sequential part numbers starting with 1.

The following example request specifies max-parts and part-number-marker query
parameters. It lists the first two parts that follow part 1 (i.e., parts 2 and
3) in the response. If more parts exist, the result is truncated and the
response returns an IsTruncated element with the value true. The response also
returns the NextPartNumberMarker element with the value 3, which should be used
for the value of the part-number-marker request query string parameter in the
next List Parts request.

Request
```````

.. code::

   GET /example-object?uploadId=XXBsb2FkIElEIGZvciBlbHZpbmcncyVcdS1tb3ZpZS5tMnRzEEEwbG9hZA&amp;max-parts=2&amp;part-number-marker=1 HTTP/1.1
   Host:  example-bucket.{{StorageService}}.com
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Authorization: {{authorizationString}}

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Content-Length: 985
   Connection: keep-alive
   Server: ScalityS3

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListPartsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
   <Bucket>example-bucket</Bucket>
   <Key>example-object</Key>
   <UploadId>XXBsb2FkIElEIGZvciBlbHZpbmcncyVcdS1tb3ZpZS5tMnRzEEEwbG9hZA</UploadId>
   <Initiator>
   <ID>arn:aws:iam::111122223333:user/some-user-11116a31-17b5-4fb7-9df5-b288870f11xx</ID>
   <DisplayName>umat-user-11116a31-17b5-4fb7-9df5-b288870f11xx</DisplayName>
   </Initiator>
   <Owner>
   <ID>8b27d4b0fc460740425b9deef56fa1af6245fbcccdda813b691a8fda9be8ff0c</ID>
   <DisplayName>someName</DisplayName>
   </Owner>
   <PartNumberMarker>1</PartNumberMarker>
   <NextPartNumberMarker>3</NextPartNumberMarker>
   <MaxParts>2</MaxParts>
   <IsTruncated>true</IsTruncated>
   <Part>
   <PartNumber>2</PartNumber>
   <LastModified>2010-11-10T20:48:34.000Z</LastModified>
   <ETag>"7778aef83f66abc1fa1e8477f296d394"</ETag>
   <Size>10485760</Size>
   </Part>
   <Part>
   <PartNumber>3</PartNumber>
   <LastModified>2010-11-10T20:48:33.000Z</LastModified>
   <ETag>"aaaa18db4cc2f85cedef654fccc4a4x8"</ETag>
   <Size>10485760</Size>
   </Part>
   </ListPartsResult>
