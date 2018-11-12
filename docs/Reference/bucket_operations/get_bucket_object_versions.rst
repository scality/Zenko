.. _GET Bucket Object Versions:

GET Bucket Object Versions
==========================

The GET Bucket Object Versions operation uses the versions subresource
to list metadata about all of the versions of objects in a bucket.
Request Parameters can also be used as selection criteria to return
metadata about a subset of all the object versions. READ access to the
bucket is necessary to use the GET Bucket Object Versions operation.

.. note::

  A ``200 OK`` response can contain valid or invalid XML. Make sure to
  design the application to parse the contents of the response and handle
  it appropriately.

Requests
--------

**Request Syntax**

.. code::

   GET /?versions HTTP/1.1
   Host: {{BucketName}}.{{ConnectorName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

**Request Parameters**

The GET Bucket Object Versions operation can use the following optional
parameters to return a subset of objects in a bucket:

+-----------------------+-----------------------+-----------------------+
| Parameter             | Type                  | Description           |
+=======================+=======================+=======================+
| delimiter             | string                | Character used to     |
|                       |                       | group keys            |
|                       |                       |                       |
|                       |                       | All keys that contain |
|                       |                       | the same string       |
|                       |                       | between the prefix,   |
|                       |                       | if specified, and the |
|                       |                       | first occurrence of   |
|                       |                       | the delimiter after   |
|                       |                       | the prefix are        |
|                       |                       | grouped under a       |
|                       |                       | single result         |
|                       |                       | element,              |
|                       |                       | CommonPrefixes. If    |
|                       |                       | prefix is not         |
|                       |                       | specified, then the   |
|                       |                       | substring starts at   |
|                       |                       | the beginning of the  |
|                       |                       | key. The keys that    |
|                       |                       | are grouped under     |
|                       |                       | CommonPrefixes result |
|                       |                       | element are not       |
|                       |                       | returned elsewhere in |
|                       |                       | the response.         |
+-----------------------+-----------------------+-----------------------+
| encoding-type         | string                | Encodes keys with the |
|                       |                       | method specified.     |
|                       |                       | Since XML 1.0 parsers |
|                       |                       | cannot parse certain  |
|                       |                       | characters that may   |
|                       |                       | be included in an     |
|                       |                       | object key, the keys  |
|                       |                       | in the response can   |
|                       |                       | be encoded to ensure  |
|                       |                       | they are legible.     |
|                       |                       | Encoding is not set   |
|                       |                       | by default. Currently |
|                       |                       | the only valid value  |
|                       |                       | is ``url``.           |
+-----------------------+-----------------------+-----------------------+
| key-marker            | string                | Specifies the key in  |
|                       |                       | the bucket to start   |
|                       |                       | listing from. Also,   |
|                       |                       | refer to              |
|                       |                       | version-id-marker.    |
+-----------------------+-----------------------+-----------------------+
| max-keys              | string                | Sets the maximum      |
|                       |                       | number of keys        |
|                       |                       | returned in the       |
|                       |                       | response body. The    |
|                       |                       | response might        |
|                       |                       | contain fewer keys,   |
|                       |                       | but will never        |
|                       |                       | contain more. If      |
|                       |                       | additional keys       |
|                       |                       | satisfy the search    |
|                       |                       | criteria, but were    |
|                       |                       | not returned because  |
|                       |                       | max-keys was          |
|                       |                       | exceeded, the         |
|                       |                       | response contains     |
|                       |                       | <isTruncated>true</is |
|                       |                       | Truncated>.           |
|                       |                       | To return the         |
|                       |                       | additional keys,      |
|                       |                       | refer to key-marker   |
|                       |                       | and                   |
|                       |                       | version-id-marker.    |
|                       |                       |                       |
|                       |                       | Default: 1000         |
+-----------------------+-----------------------+-----------------------+
| prefix                | string                | Use this parameter to |
|                       |                       | select only keys that |
|                       |                       | begin with the        |
|                       |                       | specified prefix. Use |
|                       |                       | prefixes to separate  |
|                       |                       | a bucket into         |
|                       |                       | different groupings   |
|                       |                       | of keys. (Use prefix  |
|                       |                       | to make groups in the |
|                       |                       | same way a folder is  |
|                       |                       | used in a file        |
|                       |                       | system.) Use prefix   |
|                       |                       | with delimiter to     |
|                       |                       | roll up numerous      |
|                       |                       | objects into a single |
|                       |                       | result under          |
|                       |                       | CommonPrefixes.       |
+-----------------------+-----------------------+-----------------------+
| version-id-marker     | string                | Specifies the object  |
|                       |                       | version to start      |
|                       |                       | listing from. Also,   |
|                       |                       | refer to key-marker.  |
|                       |                       |                       |
|                       |                       | Valid Values: Valid   |
|                       |                       | version ID \| Default |
|                       |                       |                       |
|                       |                       | Constraint: May not   |
|                       |                       | be an empty string    |
+-----------------------+-----------------------+-----------------------+

**Request Headers**

Implementation of the GET Bucket Object Versions operation uses only
request headers that are common to all operations (refer to :ref:`Common
Request Headers`).

**Request Elements**

The GET Bucket Object Versions operation does not use request elements.

Responses
---------

**Response Headers**

Implementation of the GET Bucket Object Versions operation uses only
response headers that are common to all operations (refer to :ref:`Common Response
Headers`).

**Response Elements**

The GET Bucket Object Versions operation can return the following
XML elements in the response:

+-----------------------+-----------------------+-----------------------+
| Element               | Type                  | Description           |
+=======================+=======================+=======================+
| DeleteMarker          | Container             | Container for an      |
|                       |                       | object that is a      |
|                       |                       | delete marker         |
|                       |                       |                       |
|                       |                       | Children: Key,        |
|                       |                       | VersionId, IsLatest,  |
|                       |                       | LastModified, Owner   |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult    |
+-----------------------+-----------------------+-----------------------+
| DisplayName           | string                | Object owner’s name   |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult.Ve |
|                       |                       | rsion.Owner           |
|                       |                       | \|                    |
|                       |                       | ListVersionsResult.De |
|                       |                       | leteMarker.Owner      |
+-----------------------+-----------------------+-----------------------+
| Encoding-Type         | string                | Encoding type used by |
|                       |                       | Zenko Enterprise to   |
|                       |                       | encode object key     |
|                       |                       | names in the XML      |
|                       |                       | response.             |
|                       |                       |                       |
|                       |                       | If encoding-type      |
|                       |                       | request parameter is  |
|                       |                       | specified, S3         |
|                       |                       | Connector includes    |
|                       |                       | this element in the   |
|                       |                       | response, and returns |
|                       |                       | encoded key name      |
|                       |                       | values in the         |
|                       |                       | following response    |
|                       |                       | elements:             |
|                       |                       |                       |
|                       |                       | KeyMarker,            |
|                       |                       | NextKeyMarker,        |
|                       |                       | Prefix, Key, and      |
|                       |                       | Delimiter.            |
+-----------------------+-----------------------+-----------------------+
| ETag                  | string                | The entity tag is an  |
|                       |                       | MD5 hash of the       |
|                       |                       | object. The ETag      |
|                       |                       | reflects changes only |
|                       |                       | to the contents of an |
|                       |                       | object, not its       |
|                       |                       | metadata.             |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult.Ve |
|                       |                       | rsion                 |
+-----------------------+-----------------------+-----------------------+
| ID                    | string                | Object owner’s ID     |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult.Ve |
|                       |                       | rsion.Owner           |
|                       |                       | \|                    |
|                       |                       | ListVersionsResult.De |
|                       |                       | leteMarker.Owner      |
+-----------------------+-----------------------+-----------------------+
| IsLatest              | Boolean               | Specifies whether the |
|                       |                       | object is (true) or   |
|                       |                       | not (false) the       |
|                       |                       | current version of an |
|                       |                       | object                |
+-----------------------+-----------------------+-----------------------+
| IsTruncated           | Boolean               | Indicates whether     |
|                       |                       | (true) or not (false) |
|                       |                       | all results matching  |
|                       |                       | the search criteria   |
|                       |                       | were returned. All of |
|                       |                       | the results may not   |
|                       |                       | be returned if the    |
|                       |                       | number of results     |
|                       |                       | exceeds that          |
|                       |                       | specified by MaxKeys. |
|                       |                       | If the results were   |
|                       |                       | truncated, it is      |
|                       |                       | possible to make a    |
|                       |                       | follow-up paginated   |
|                       |                       | request using the     |
|                       |                       | NextKeyMarker and     |
|                       |                       | NextVersionIdMarker   |
|                       |                       | response parameters   |
|                       |                       | as a starting place   |
|                       |                       | in another request to |
|                       |                       | return the rest of    |
|                       |                       | the results.          |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionResult     |
+-----------------------+-----------------------+-----------------------+
| Key                   | string                | The object’s key      |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult.Ve |
|                       |                       | rsion                 |
|                       |                       | \|                    |
|                       |                       | ListVersionsResult.De |
|                       |                       | leteMarker            |
+-----------------------+-----------------------+-----------------------+
| KeyMarker             | string                | Marks the last key    |
|                       |                       | returned in a         |
|                       |                       | truncated response    |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult    |
+-----------------------+-----------------------+-----------------------+
| LastModified          | date                  | Date and time the     |
|                       |                       | object was last       |
|                       |                       | modified              |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult.Ve |
|                       |                       | rsion                 |
|                       |                       | \|                    |
|                       |                       | ListVersionsResult.De |
|                       |                       | leteMarker            |
+-----------------------+-----------------------+-----------------------+
| ListVersionsResult    | container             | Container of the      |
|                       |                       | result                |
+-----------------------+-----------------------+-----------------------+
| MaxKeys               | string                | The maximum number of |
|                       |                       | objects to return     |
|                       |                       |                       |
|                       |                       | Default: 1000         |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionsResult    |
+-----------------------+-----------------------+-----------------------+
| Name                  | string                | Bucket owner’s name   |
+-----------------------+-----------------------+-----------------------+
| NextKeyMarker         | string                | When the number of    |
|                       |                       | responses exceeds the |
|                       |                       | value of MaxKeys,     |
|                       |                       | NextKeyMarker         |
|                       |                       | specifies the first   |
|                       |                       | key not returned that |
|                       |                       | satisfies the search  |
|                       |                       | criteria. Use this    |
|                       |                       | value for the         |
|                       |                       | key-marker request    |
|                       |                       | parameter in a        |
|                       |                       | subsequent request    |
+-----------------------+-----------------------+-----------------------+
| NextVersionIdMarker   | string                | When the number of    |
|                       |                       | responses exceeds the |
|                       |                       | value of MaxKeys,     |
|                       |                       | NextVersionIdMarker   |
|                       |                       | specifies the first   |
|                       |                       | object version not    |
|                       |                       | returned that         |
|                       |                       | satisfies the search  |
|                       |                       | criteria. Use this    |
|                       |                       | value for the         |
|                       |                       | version-id-marker     |
|                       |                       | request parameter in  |
|                       |                       | a subsequent request. |
|                       |                       |                       |
|                       |                       | Ancestor:             |
|                       |                       | ListVersionResult     |
+-----------------------+-----------------------+-----------------------+
| Owner                 | string                | Bucket owner          |
+-----------------------+-----------------------+-----------------------+
| Prefix                | string                | Selects objects that  |
|                       |                       | start with the value  |
|                       |                       | supplied by this      |
|                       |                       | parameter.            |
+-----------------------+-----------------------+-----------------------+
| Size                  | string                | Size in bytes of the  |
|                       |                       | object                |
+-----------------------+-----------------------+-----------------------+
| StorageClass          | string                | Always STANDARD       |
+-----------------------+-----------------------+-----------------------+
| Version               | container             | Container of version  |
|                       |                       | information           |
+-----------------------+-----------------------+-----------------------+
| VersionId             | string                | Version ID of an      |
|                       |                       | object                |
+-----------------------+-----------------------+-----------------------+
| VersionIdMarker       | string                | Marks the last        |
|                       |                       | version of the key    |
|                       |                       | returned in a         |
|                       |                       | truncated response    |
+-----------------------+-----------------------+-----------------------+

Examples
--------

**Getting All Versions of All Objects in a Specific Bucket**

*Request Sample*

.. code::

   GET /?versions HTTP/1.1
   Host: BucketName.s3.scality.com
   Date: Thu, 31 Mar 2016 15:11:47 GMT
   Authorization: AWS pat:6nYhPMw6boadLgjywjSIyhfwRIA=

*Response Sample*

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.scality.com/doc/2006-03-01">
       <Name>bucket</Name>
       <Prefix>my</Prefix>
       <KeyMarker/>
       <VersionIdMarker/>
       <MaxKeys>5</MaxKeys>
       <IsTruncated>false</IsTruncated>
       <Version>
           <Key>my-image.jpg</Key>
           <VersionId>3/L4kqtJl40Nr8X8gdRQBpUMLUo</VersionId>
           <IsLatest>true</IsLatest>
            <LastModified>2009-10-12T17:50:30.000Z</LastModified>
           <ETag>&quot;fba9dede5f27731c9771645a39863328&quot;</ETag>
           <Size>434234</Size>
           <StorageClass>STANDARD</StorageClass>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>mtd@amazon.com</DisplayName>
           </Owner>
       </Version>
       <DeleteMarker>
           <Key>my-second-image.jpg</Key>
           <VersionId>03jpff543dhffds434rfdsFDN943fdsFkdmqnh892</VersionId>
           <IsLatest>true</IsLatest>
           <LastModified>2009-11-12T17:50:30.000Z</LastModified>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>mtd@amazon.com</DisplayName>
           </Owner>
       </DeleteMarker>
       <Version>
           <Key>my-second-image.jpg</Key>
           <VersionId>QUpfdndhfd8438MNFDN93jdnJFkdmqnh893</VersionId>
           <IsLatest>false</IsLatest>
           <LastModified>2009-10-10T17:50:30.000Z</LastModified>
           <ETag>&quot;9b2cf535f27731c974343645a3985328&quot;</ETag>
           <Size>166434</Size>
           <StorageClass>STANDARD</StorageClass>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>mtd@amazon.com</DisplayName>
           </Owner>
        </Version>
   </ListVersionsResult>

**Getting Objects in the Order They Were Stored**

The following GET request returns the most recently stored object first
starting with the value for key-marker.

*Request Sample*

.. code::

   GET /?versions&amp;key-marker=key2 HTTP/1.1
   Host: demo.s3.scality.com
   Pragma: no-cache
   Accept: */*
   Date: Tue, 28 Jun 2011 09:27:15 GMT
   Authorization: AWS pat:0YPPNCCa9yAbKOFdlLD/ixMLayg=

*Response Sample*

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>mtp-versioning-fresh</Name>
     <Prefix/>
     <KeyMarker>key2</KeyMarker>
     <VersionIdMarker/>
     <MaxKeys>1000</MaxKeys>
     <IsTruncated>false</IsTruncated>
     <Version>
       <Key>key3</Key>
       <VersionId>I5VhmK6CDDdQ5Pwfe1gcHZWmHDpcv7gfmfc29UBxsKU.</VersionId>
       <IsLatest>true</IsLatest>
       <LastModified>2009-12-09T00:19:04.000Z</LastModified>
       <ETag>&quot;396fefef536d5ce46c7537ecf978a360&quot;</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
     <DeleteMarker>
       <Key>sourcekey</Key>
       <VersionId>qDhprLU80sAlCFLu2DWgXAEDgKzWarn-HS_JU0TvYqs.</VersionId>
       <IsLatest>true</IsLatest>
       <LastModified>2009-12-10T16:38:11.000Z</LastModified>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
     </DeleteMarker>
     <Version>
       <Key>sourcekey</Key>
       <VersionId>wxxQ7ezLaL5JN2Sislq66Syxxo0k7uHTUpb9qiiMxNg.</VersionId>
       <IsLatest>false</IsLatest>
       <LastModified>2009-12-10T16:37:44.000Z</LastModified>
       <ETag>&quot;396fefef536d5ce46c7537ecf978a360&quot;</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>

**Using prefix**

The following GET request returns objects whose keys begin with source.

*Request Sample*

.. code::

   GET /?versions&amp;prefix=source HTTP/1.1
   Host: bucket.s3.scality.com
   Date: Wed, 01 Mar  2006 12:00:00 GMT
   Authorization: {{authorizationString}}

*Response Sample*

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>mtp-versioning-fresh</Name>
     <Prefix>source</Prefix>
     <KeyMarker/>
     <VersionIdMarker/>
     <MaxKeys>1000</MaxKeys>
     <IsTruncated>false</IsTruncated>
     <DeleteMarker>
       <Key>sourcekey</Key>
       <VersionId>qDhprLU80sAlCFLu2DWgXAEDgKzWarn-HS_JU0TvYqs.</VersionId>
       <IsLatest>true</IsLatest>
       <LastModified>2009-12-10T16:38:11.000Z</LastModified>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
     </DeleteMarker>
     <Version>
       <Key>sourcekey</Key>
       <VersionId>wxxQ7ezLaL5JN2Sislq66Syxxo0k7uHTUpb9qiiMxNg.</VersionId>
       <IsLatest>false</IsLatest>
       <LastModified>2009-12-10T16:37:44.000Z</LastModified>
       <ETag>&quot;396fefef536d5ce46c7537ecf978a360&quot;</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>

**Using key_marker and version_id_marker**

The following GET request returns objects starting at the specified key
(key-marker) and version ID (version-id-marker).

*Request Sample*

.. code::

   GET /?versions&amp;key=key3&amp;version-id-marker=t4Zen1YTZBnj HTTP/1.1
   Host: bucket.s3.scality.com
   Date: Wed, 01 Mar  2006 12:00:00 GMT
   Authorization: {{authorizationString}}

*Response Sample*

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>mtp-versioning-fresh</Name>
     <Prefix/>
     <KeyMarker>key3</KeyMarker>
     <VersionIdMarker>t46ZenlYTZBnj</VersionIdMarker>
     <MaxKeys>1000</MaxKeys>
     <IsTruncated>false</IsTruncated>
     <DeleteMarker>
       <Key>sourcekey</Key>
       <VersionId>qDhprLU80sAlCFLu2DWgXAEDgKzWarn-HS_JU0TvYqs.</VersionId>
       <IsLatest>true</IsLatest>
       <LastModified>2009-12-10T16:38:11.000Z</LastModified>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
     </DeleteMarker>
     <Version>
       <Key>sourcekey</Key>
       <VersionId>wxxQ7ezLaL5JN2Sislq66Syxxo0k7uHTUpb9qiiMxNg.</VersionId>
       <IsLatest>false</IsLatest>
       <LastModified>2009-12-10T16:37:44.000Z</LastModified>
       <ETag>&quot;396fefef536d5ce46c7537ecf978a360&quot;</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>

**Using key_marker, version_id_marker, and max_keys**

The following GET request returns up to three (the value of max-keys)
objects starting with the key specified by key-marker and the version ID
specified by version-id-marker.

*Request Sample*

.. code::

   GET /?versions&amp;key-marker=key3&amp;version-id-marker=t46Z0menlYTZBnj HTTP/1.1
   Host: bucket.s3.scality.com
   Date: Wed, 28 Oct 2009 22:32:00 +0000
   Authorization: authorization string

*Response Sample*

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>mtp-versioning-fresh</Name>
     <Prefix/>
     <KeyMarker>key3</KeyMarker>
     <VersionIdMarker>null</VersionIdMarker>
     <NextKeyMarker>key3</NextKeyMarker>
     <NextVersionIdMarker>d-d309mfjFrUmoQ0DBsVqmcMV15OI.</NextVersionIdMarker>
     <MaxKeys>2</MaxKeys>
     <IsTruncated>true</IsTruncated>
     <Version>
       <Key>key3</Key>
       <VersionId>8XECiENpj8pydEDJdd-_VRrvaGKAHOaGMNW7tg6UViI.</VersionId>
       <IsLatest>false</IsLatest>
       <LastModified>2009-12-09T00:18:23.000Z</LastModified>
       <ETag>&quot;396fefef536d5ce46c7537ecf978a360&quot;</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
     <Version>
       <Key>key3</Key>
       <VersionId>d-d309mfjFri40QYukDozqBt3UmoQ0DBsVqmcMV15OI.</VersionId>
       <IsLatest>false</IsLatest>
       <LastModified>2009-12-09T00:18:08.000Z</LastModified>
       <ETag>&quot;396fefef536d5ce46c7537ecf978a360&quot;</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>

**Using the delimiter and prefix Parameters**

Assume the following keys are in the bucket, example-bucket:

-  photos/2006/January/sample.jpg

-  photos/2006/February/sample.jpg
-  photos/2006/March/sample.jpg

-  videos/2006/March/sample.wmv

-  sample.jpg

The following GET request specifies the delimiter parameter with value
“/”.

*Request Sample*

.. code::

   GET /?versions&amp;delimiter=/ HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date: Wed, 02 Feb 2011 20:34:56 GMT
   Authorization: authorization string

The response returns the sample.jpg key in a <Version> element. However,
because all the other keys contain the specified delimiter, a distinct
substring, from the beginning of the key to the first occurrence of the
delimiter, from each of these keys is returned in a <CommonPrefixes>
element. The key substrings, photos/ and videos/, in the
<CommonPrefixes> element indicate that there are one or more keys with
these key prefixes.

This is a useful scenario if key prefixes are used for the objects to
create a logical folder-like structure. In this case the result can be
interpreted as the folders photos/ and videos/ having one or more
objects.

.. code::

   <ListVersionsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>mvbucketwithversionon1</Name>
     <Prefix></Prefix>
     <KeyMarker></KeyMarker>
     <VersionIdMarker></VersionIdMarker>
     <MaxKeys>1000</MaxKeys>
     <Delimiter>/</Delimiter>
     <IsTruncated>false</IsTruncated>

     <Version>
       <Key>Sample.jpg</Key>
       <VersionId>toxMzQlBsGyGCz1YuMWMp90cdXLzqOCH</VersionId>
       <IsLatest>true</IsLatest>
       <LastModified>2011-02-02T18:46:20.000Z</LastModified>
       <ETag>&quot;3305f2cfc46c0f04559748bb039d69ae&quot;</ETag>
       <Size>3191</Size>
       <Owner>
         <ID>852b113e7a2f25102679df27bb0ae12b3f85be6f290b936c4393484be31bebcc</ID>
         <DisplayName>display-name</DisplayName>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>

     <CommonPrefixes>
       <Prefix>photos/</Prefix>
     </CommonPrefixes>
     <CommonPrefixes>
       <Prefix>videos/</Prefix>
     </CommonPrefixes>
   </ListVersionsResult>

In addition to the delimiter parameter you can filter results by adding
a prefix parameter as shown in the following request:

.. code::

   GET /?versions&amp;prefix=photos/2006/&amp;delimiter=/ HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date: Wed, 02 Feb 2011 19:34:02 GMT
   Authorization: authorization string

In this case the response will include only objects keys that start with
the specified prefix. The value returned in the <CommonPrefixes> element
is a substring from the beginning of the key to the first occurrence of
the specified delimiter after the prefix.

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>example-bucket</Name>
     <Prefix>photos/2006/</Prefix>
     <KeyMarker></KeyMarker>
     <VersionIdMarker></VersionIdMarker>
     <MaxKeys>1000</MaxKeys>
     <Delimiter>/</Delimiter>
     <IsTruncated>false</IsTruncated>
     <Version>
       <Key>photos/2006/</Key>
       <VersionId>3U275dAA4gz8ZOqOPHtJCUOi60krpCdy</VersionId>
       <IsLatest>true</IsLatest>
       <LastModified>2011-02-02T18:47:27.000Z</LastModified>
       <ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag>
       <Size>0</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
         <DisplayName>display-name</DisplayName>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
     <CommonPrefixes>
       <Prefix>photos/2006/February/</Prefix>
     </CommonPrefixes>
     <CommonPrefixes>
       <Prefix>photos/2006/January/</Prefix>
     </CommonPrefixes>
     <CommonPrefixes>
       <Prefix>photos/2006/March/</Prefix>
     </CommonPrefixes>
   </ListVersionsResult>
