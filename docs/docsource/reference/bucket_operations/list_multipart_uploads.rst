.. _List Multipart Uploads:

List Multipart Uploads
======================

The List Multipart Uploads operation catalogs in-progress multipart
uploads (multipart uploads that have been initiated via the Initiate
Multipart Upload request, but that have not yet been completed or
aborted).

List Multipart Uploads returns at most 1,000 multipart uploads in the
response (which is also the default setting for uploads a response can
include, adjustable via the max-uploads request parameter in the
response). If additional multipart uploads satisfy the list criteria,
the response returns an IsTruncated element with the value of ``true``.
To list the additional multipart uploads, use the key-marker and
upload-id-marker Request Parameters.

In the response, the uploads are sorted by key. If the application has
initiated more than one multipart upload using the same object key, then
uploads in the response are first sorted by key. Additionally, uploads
are sorted in ascending order within each key by the upload initiation
time.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /?uploads HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

Parameters
~~~~~~~~~~

The List Multipart Uploads operation’s implementation of GET uses
certain parameters to return a subset of the ongoing multipart uploads
in a bucket.

.. tabularcolumns:: X{0.20\textwidth}lX{0.65\textwidth}
.. table::
   :class: longtable
   
   +-----------------------+---------+-------------------------------------+
   | Parameter             | Type    | Description                         |
   +=======================+=========+=====================================+
   | ``delimiter``         | string  | Character used to group keys.       |
   |                       |         |                                     |
   |                       |         | All keys that contain the same      |
   |                       |         | string between the prefix, if       |
   |                       |         | specified, and the first occurrence |
   |                       |         | of the delimiter after the prefix   |
   |                       |         | are grouped under a single result   |
   |                       |         | element,CommonPrefixes. If prefix   |
   |                       |         | is not specified, then the substring|
   |                       |         | starts at the beginning of the key. |
   |                       |         | The keys that are grouped under     |
   |                       |         | CommonPrefixes result element are   |
   |                       |         | not returned elsewhere in the       |
   |                       |         | response.                           |
   +-----------------------+---------+-------------------------------------+
   | ``encoding-type``     | string  | Requests that Zenko encode the      |
   |                       |         | response and specifies the encoding |
   |                       |         | method to use.                      |
   |                       |         |                                     |
   |                       |         | An object key can contain any       |
   |                       |         | Unicode character; however, XML 1.0 |
   |                       |         | parser cannot parse some characters,|
   |                       |         | such as characters with an ASCII    |
   |                       |         | value from 0 to 10. For characters  |
   |                       |         | that are not supported in XML 1.0,  |
   |                       |         | add this parameter to request       |
   |                       |         | Zenko to encode the keys in the     |
   |                       |         | response.                           |
   |                       |         |                                     |
   |                       |         | **Note**: The only valid value for  |
   |                       |         | the encoding-type parameter is      |
   |                       |         | ``url``.                            |
   |                       |         |                                     |
   |                       |         | **Default:** None                   |
   +-----------------------+---------+-------------------------------------+
   | ``max-uploads``       | integer | Sets the maximum number of          |
   |                       |         | multipart uploads, from 1 to 1,000, |
   |                       |         | to return in the response body.     |
   |                       |         |                                     |
   |                       |         | 1,000 is the maximum number of      |
   |                       |         | uploads that can be returned in a   |
   |                       |         | response.                           |
   |                       |         |                                     |
   |                       |         | **Default:** 1,000                  |
   +-----------------------+---------+-------------------------------------+
   | ``key-marker``        | string  | Together with upload-id-marker, the |
   |                       |         | key-marker parameter specifies the  |
   |                       |         | multipart upload after which        |
   |                       |         | listing should begin.               |
   |                       |         |                                     |
   |                       |         | If upload-id-marker is not          |
   |                       |         | specified, only the keys            |
   |                       |         | lexicographically greater than the  |
   |                       |         | specified key-marker are included   |
   |                       |         | in the list. If upload-id-marker is |
   |                       |         | specified, any multipart uploads for|
   |                       |         | a key equal to the key-marker might |
   |                       |         | also be included, provided those    |
   |                       |         | multipart uploads have upload IDs   |
   |                       |         | lexicographically greater than the  |
   |                       |         | specified upload-id-marker.         |
   +-----------------------+---------+-------------------------------------+
   | ``prefix``            | string  | Lists in-progress uploads only for  |
   |                       |         | those keys that begin with the      |
   |                       |         | specified prefix. This parameter    |
   |                       |         | can be used to separate a bucket    |
   |                       |         | into different grouping of keys. To |
   |                       |         | illustrate, prefixes can be used to |
   |                       |         | make groups, similar to the manner  |
   |                       |         | in which a folder is used in a file |
   |                       |         | system.                             |
   +-----------------------+---------+-------------------------------------+
   | ``upload-id-marker``  | string  | Together with key-marker, specifies |
   |                       |         | the multipart upload after which    |
   |                       |         | listing should begin. If key-marker |
   |                       |         | is not specified, the parameter is  |
   |                       |         | ignored. Otherwise, any multipart   |
   |                       |         | uploads for a key equal to the      |
   |                       |         | key-marker might be included in the |
   |                       |         | list only if they have an upload ID |
   |                       |         | lexicographically greater than the  |
   |                       |         | specified upload-id-marker.         |
   +-----------------------+---------+-------------------------------------+

Headers
~~~~~~~

The List Multipart Uploads operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).

Elements
~~~~~~~~

The List Multipart Uploads operation does not use request elements.

Responses
---------

Headers
~~~~~~~

List Multipart Uploads uses only the common response headers supported by Zenko
(refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

The List Multipart Uploads operation can return the following XML elements in
its response (includes XML containers):

.. tabularcolumns:: X{0.35\textwidth}lX{0.50\textwidth}
.. table::
   :class: longtable

   +---------------------------------------+-----------+---------------------------+
   | Element                               | Type      | Description               |
   +=======================================+===========+===========================+
   | ``ListMultipartUploadsResult``        | container | Container for the         |
   |                                       |           | response                  |
   +---------------------------------------+-----------+---------------------------+
   | ``Bucket``                            | string    | Name of the bucket to     |
   |                                       |           | which the multipart       |
   |                                       |           | upload was initiated      |
   +---------------------------------------+-----------+---------------------------+
   | ``KeyMarker``                         | string    | The key at or after which |
   |                                       |           | the listing began         |
   +---------------------------------------+-----------+---------------------------+
   | ``UploadIdMarker``                    | string    | Upload ID after which     |
   |                                       |           | listing began             |
   +---------------------------------------+-----------+---------------------------+
   | ``NextKeyMarker``                     | string    | When a list is truncated, |
   |                                       |           | NextKeyMarker specifies   |
   |                                       |           | the value that should be  |
   |                                       |           | used for the key-marker   |
   |                                       |           | request parameter in a    |
   |                                       |           | subsequent request.       |
   +---------------------------------------+-----------+---------------------------+
   | ``NextUploadIDMarker``                | string    | When a list is truncated, |
   |                                       |           | NextUploadIDMarker        |
   |                                       |           | specifies the value that  |
   |                                       |           | should be used for the    |
   |                                       |           | upload-id-marker request  |
   |                                       |           | parameter in a subsequent |
   |                                       |           | request.                  |
   +---------------------------------------+-----------+---------------------------+
   | ``Encoding-Type``                     | string    | Encoding type used by     |
   |                                       |           | Zenko to encode object    |
   |                                       |           | key names in the XML      |
   |                                       |           | response.                 |
   |                                       |           |                           |
   |                                       |           | If the encoding-type      |
   |                                       |           | request parameter is      |
   |                                       |           | specified, S3 Connector   |
   |                                       |           | includes this element in  |
   |                                       |           | the response, and returns |
   |                                       |           | encoded key name values   |
   |                                       |           | in the following          |
   |                                       |           | elements: Delimiter,      |
   |                                       |           | KeyMarker, Prefix,        |
   |                                       |           | NextKeyMarker, and Key.   |
   +---------------------------------------+-----------+---------------------------+
   | ``MaxUploads``                        | integer   | Maximum number of         |
   |                                       |           | multipart uploads that    |
   |                                       |           | that could have been      |
   |                                       |           | included in the response  |
   +---------------------------------------+-----------+---------------------------+
   | ``IsTruncated``                       | Boolean   | Indicates whether the     |
   |                                       |           | returned list of          |
   |                                       |           | multipart uploads is      |
   |                                       |           | truncated.                |
   |                                       |           |                           |
   |                                       |           | A true value indicates    |
   |                                       |           | that the list was         |
   |                                       |           | truncated. A list can be  |
   |                                       |           | truncated if the number   |
   |                                       |           | of multipart uploads      |
   |                                       |           | exceeds the limit         |
   |                                       |           | returned in the           |
   |                                       |           | MaxUploads element.       |
   +---------------------------------------+-----------+---------------------------+
   | ``Upload``                            | container | Container for elements    |
   |                                       |           | related to a particular   |
   |                                       |           | multipart upload. A       |
   |                                       |           | response can contain zero |
   |                                       |           | or more Upload elements.  |
   +---------------------------------------+-----------+---------------------------+
   | ``Key``                               | integer   | Key of the object for     |
   |                                       |           | which the multipart       |
   |                                       |           | upload was initiated      |
   +---------------------------------------+-----------+---------------------------+
   | ``UploadID``                          | integer   | Upload ID that identifies |
   |                                       |           | the multipart upload      |      
   +---------------------------------------+-----------+---------------------------+
   | ``Initiator``                         | container | Identifies the party that |
   |                                       |           | initiated the multipart   |
   |                                       |           | upload                    |
   |                                       |           |                           |
   |                                       |           | **ID:** Initiation User   |
   |                                       |           | ID                        |
   |                                       |           |                           |
   |                                       |           | **DisplayName:** Name of  |
   |                                       |           | party initiating request  |
   +---------------------------------------+-----------+---------------------------+
   | ``Owner``                             | container | Container element that    |
   |                                       |           | identifies the object     |
   |                                       |           | owner, after the object   |
   |                                       |           | is created                |
   |                                       |           |                           |
   |                                       |           | **ID:** Object owner User |
   |                                       |           | ID                        |
   |                                       |           |                           |
   |                                       |           | **DisplayName:** Name of  |
   |                                       |           | object owner              |
   +---------------------------------------+-----------+---------------------------+
   | ``Initiated``                         | date      | Date and time the         |
   |                                       |           | multipart upload was      |
   |                                       |           | initiated                 |
   +---------------------------------------+-----------+---------------------------+
   | ``ListMultipartUploadsResult.Prefix`` | string    | When a prefix is provided |
   |                                       |           | in the request, this      |
   |                                       |           | field contains the        |
   |                                       |           | specified prefix. The     |
   |                                       |           | result contains only keys |
   |                                       |           | starting with the         |
   |                                       |           | specified prefix.         |
   +---------------------------------------+-----------+---------------------------+
   | ``Delimiter``                         | string    | Contains the delimiter    |
   |                                       |           | specified in the request  |
   |                                       |           |                           |
   |                                       |           | If a delimiter is not     |
   |                                       |           | specified in the request, |
   |                                       |           | this element is absent    |
   |                                       |           | from the response.        |
   +---------------------------------------+-----------+---------------------------+
   | ``CommonPrefixes``                    | container | If a delimiter is         |
   |                                       |           | specified in the request, |
   |                                       |           | then the result returns   |
   |                                       |           | each distinct key prefix  |
   |                                       |           | containing the delimiter  |
   |                                       |           | in a CommonPrefixes       |
   |                                       |           | element. The distinct key |
   |                                       |           | prefixes are returned in  |
   |                                       |           | the Prefix child element. |
   +---------------------------------------+-----------+---------------------------+
   | ``CommonPrefixes.Prefix``             | string    | If the request does not   |
   |                                       |           | include the Prefix        |
   |                                       |           | parameter, then           |
   |                                       |           | CommonPrefixes.Prefix     |
   |                                       |           | shows only the substring  |
   |                                       |           | of the key that precedes  |
   |                                       |           | the first occurrence of   |
   |                                       |           | the delimiter character.  |
   |                                       |           | These keys are not        |
   |                                       |           | returned anywhere else in |
   |                                       |           | the response.             |
   |                                       |           |                           |
   |                                       |           | If the request includes   |
   |                                       |           | the Prefix parameter,     |
   |                                       |           | CommonPrefixes.Prefix     |
   |                                       |           | shows the substring of    |
   |                                       |           | the key from the          |
   |                                       |           | beginning to the first    |
   |                                       |           | occurrence of the         |
   |                                       |           | the delimiter after the   |
   |                                       |           | prefix.                   |
   +---------------------------------------+-----------+---------------------------+

Examples
--------

List Multipart Uploads
~~~~~~~~~~~~~~~~~~~~~~

Request
```````

The request sample lists three multipart uploads, specifying the
max-uploads request parameter to set the maximum number of multipart
uploads to return in the response body.

.. code::

   GET /?uploads&amp;max-uploads=3 HTTP/1.1
   Host:  example-bucket.{{StorageService}}.com
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Authorization: {{authorizationString}}

The request sample indicates that the multipart upload list was
truncated and provides the NextKeyMarker and the NextUploadIdMarker
elements. These values are specified in subsequent requests to read the
next set of multipart uploads. That is, send a subsequent request
specifying ``key-marker=my-movie2.m2ts`` (value of the NextKeyMarker
element) and
``upload-id-marker=YW55IGlkZWEgd2h5IGVsdmluZydzIHVwbG9hZCBmYWlsZWQ``
(value of the NextUploadIdMarker).

Response
````````

The sample response also shows a case of two multipart uploads in
progress with the same key (``my-movie.m2ts``). That is, the response
shows two uploads with the same key. This response shows the uploads
sorted by key, and within each key the uploads are sorted in ascending
order by the time the multipart upload was initiated.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Content-Length: 1330
   Connection: keep-alive
   Server: AmazonS3

   <?xml version="1.0" encoding="UTF-8"?>
   <ListMultipartUploadsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Bucket>bucket</Bucket>
     <KeyMarker></KeyMarker>
     <UploadIdMarker></UploadIdMarker>
     <NextKeyMarker>my-movie.m2ts</NextKeyMarker>
     <NextUploadIdMarker>YW55IGlkZWEgd2h5IGVsdmluZydzIHVwbG9hZCBmYWlsZWQ</NextUploadIdMarker>
     <MaxUploads>3</MaxUploads>
     <IsTruncated>true</IsTruncated>
     <Upload>
       <Key>my-divisor</Key>
       <UploadId>XMgbGlrZSBlbHZpbmcncyBub3QgaGF2aW5nIG11Y2ggbHVjaw</UploadId>
       <Initiator>
         <ID>arn:aws:iam::111122223333:user/user1-11111a31-17b5-4fb7-9df5-b111111f13de</ID>
         <DisplayName>user1-11111a31-17b5-4fb7-9df5-b111111f13de</DisplayName>
       </Initiator>
       <Owner>
         <ID>8b27d4b0fc460740425b9deef56fa1af6245fbcccdda813b691a8fda9be8ff0c</ID>
         <DisplayName>OwnerDisplayName</DisplayName>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
       <Initiated>2010-11-10T20:48:33.000Z</Initiated>
     </Upload>
     <Upload>
       <Key>my-movie.m2ts</Key>
       <UploadId>VXBsb2FkIElEIGZvciBlbHZpbmcncyBteS1tb3ZpZS5tMnRzIHVwbG9hZA</UploadId>
       <Initiator>
         <ID>b1d16700c70b0b05597d7acd6a3f92be</ID>
         <DisplayName>InitiatorDisplayName</DisplayName>
       </Initiator>
       <Owner>
         <ID>b1d16700c70b0b05597d7acd6a3f92be</ID>
         <DisplayName>OwnerDisplayName</DisplayName>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
       <Initiated>2010-11-10T20:48:33.000Z</Initiated>
     </Upload>
     <Upload>
       <Key>my-movie.m2ts</Key>
       <UploadId>YW55IGlkZWEgd2h5IGVsdmluZydzIHVwbG9hZCBmYWlsZWQ</UploadId>
       <Initiator>
         <ID>arn:aws:iam::444455556666:user/user1-22222a31-17b5-4fb7-9df5-b222222f13de</ID>
         <DisplayName>user1-22222a31-17b5-4fb7-9df5-b222222f13de</DisplayName>
       </Initiator>
       <Owner>
         <ID>b1d16700c70b0b05597d7acd6a3f92be</ID>
         <DisplayName>OwnerDisplayName</DisplayName>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
       <Initiated>2010-11-10T20:49:33.000Z</Initiated>
     </Upload>
   </ListMultipartUploadsResult>

Using the Delimiter and the Prefix Parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Assume a multipart upload is in progress for the following keys in a
``example-bucket``.

-  greatshot.raw
-  photographs/2006/January/greatshot.raw
-  photographs/2006/February/greatshot.raw
-  photographs/2006/March/greatshot.raw
-  video_content/2006/March/greatvideo.raw

Request
```````

The sample list multipart upload request specifies the delimiter parameter with
value "/".

.. code::

   GET /?uploads&amp;delimiter=/ HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Authorization: {{authorizationString}}

Response
````````

The response sample lists multipart uploads on the specified bucket,
``example-bucket``.

The response returns multipart upload for the greatshot.raw key in an Upload
element. As all the other keys contain the specified delimiter, however, a
distinct substring—from the beginning of the key to the first occurence of the
delimiter, from each of the keys—is returned in a CommonPrefixes element. The
key substrings, ``photographs/`` and ``video_content/``, in the CommonPrefixes
element indicate that there are one or more in-progress multipart uploads with
these key prefixes.

This is a useful scenario if key prefixes are used for objects for the purpose
of creating a logical folder like structure. In this case you can interpret the
result as the folders ``photographs/`` and ``video_content/`` have one or more
multipart uploads in progress. In such a case the results can be interpreted, as
the folders ``photographs/`` and ``video_content/`` have one or more multipart
uploads in progress.

.. code::

   <ListMultipartUploadsResult xmlns="http://s3.scalityaws.com/doc/2006-03-01/">
     <Bucket>example-bucket</Bucket>
     <KeyMarker/>
     <UploadIdMarker/>
     <NextKeyMarker>sample.jpg</NextKeyMarker>
     <NextUploadIdMarker>Xgw4MJT6ZPAVxpY0SAuGN7q4uWJJM22ZYg1W99trdp4tpO88.PT6.MhO0w2E17eutfAvQfQWoajgE_W2gpcxQw--</NextUploadIdMarker>
     <Delimiter>/</Delimiter>
     <Prefix/>
     <MaxUploads>1000</MaxUploads>
     <IsTruncated>false</IsTruncated>
     <Upload>
       <Key>sample.jpg</Key>
       <UploadId>Agw4MJT6ZPAVxpY0SAuGN7q4uWJJM22ZYg1N99trdp4tpO88.PT6.MhO0w2E17eutfAvQfQWoajgE_W2gpcxQw--</UploadId>
       <Initiator>
         <ID>314133b66967d86f031c7249d1d9a80249109428335cd0ef1cdc487b4566cb1b</ID>
         <DisplayName>s3-nickname</DisplayName>
       </Initiator>
       <Owner>
         <ID>314133b66967d86f031c7249d1d9a80249109428335cd0ef1cdc487b4566cb1b</ID>
         <DisplayName>s3-nickname</DisplayName>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
       <Initiated>2010-11-26T19:24:17.000Z</Initiated>
     </Upload>
     <CommonPrefixes>
       <Prefix>photos/</Prefix>
     </CommonPrefixes>
     <CommonPrefixes>
       <Prefix>videos/</Prefix>
     </CommonPrefixes>
     </ListMultipartUploadsResult>

Request
```````

In addition to the delimiter parameter, results can be filtered by adding a
prefix parameter.

.. code::

   GET /?uploads&amp;delimiter=/&amp;prefix=photographs/2006/ HTTP/1.1
   Host: example-bucket.s3.scalityaws.com
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Authorization: authorization string

Response
````````

In this case, the response includes only multipart uploads for keys that start
with the specified prefix. The value returned in the CommonPrefixes element is a
substring from the beginning of the key to the first occurrence of the specified
delimiter after the prefix.

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListMultipartUploadsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Bucket>example-bucket</Bucket>
     <KeyMarker/>
     <UploadIdMarker/>
     <NextKeyMarker/>
     <NextUploadIdMarker/>
     <Delimiter>/</Delimiter>
     <Prefix>photos/2006/</Prefix>
     <MaxUploads>1000</MaxUploads>
     <IsTruncated>false</IsTruncated>
     <CommonPrefixes>
       <Prefix>photos/2006/February/</Prefix>
     </CommonPrefixes>
     <CommonPrefixes>
       <Prefix>photos/2006/January/</Prefix>
     </CommonPrefixes>
     <CommonPrefixes>
       <Prefix>photos/2006/March/</Prefix>
     </CommonPrefixes>
   </ListMultipartUploadsResult>
