.. _List Object Versions:

List Object Versions
====================

Returns metadata about all of the versions of objects in a bucket. You can also
use request parameters as selection criteria to return metadata about a subset
of all the object versions.

.. note::

   A ``200 OK`` response can contain valid or invalid XML. Design your
   application to parse the contents of the response and handle it
   appropriately.

Using this operation requires READ access to the bucket.

Request Syntax
--------------
 
.. code::

   GET /?versions&Delimiter=Delimiter&EncodingType=EncodingType&KeyMarker=KeyMarker&MaxKeys=MaxKeys&Prefix=Prefix&VersionIdMarker=VersionIdMarker HTTP/1.1
   Host: Bucket.s3.example.com

URI Request Parameters
~~~~~~~~~~~~~~~~~~~~~~

The request uses the following URI parameters.

   ``Bucket``
   
      The bucket name that contains the objects.

      When using this API with an access point, you must direct requests to the
      access point hostname. The access point hostname takes the form
      ``AccessPointName-AccountId.s3-accesspoint. Region.example.com``.

      Required: Yes

   ``delimiter``

      A delimiter is a character that you specify to group keys. All keys that
      contain the same string between the ``prefix`` and the first occurrence of
      the delimiter are grouped under a single result element in
      CommonPrefixes. These groups are counted as one result against the
      max-keys limitation. These keys are not returned elsewhere in the
      response.

   ``encoding-type``
   
      Requests XDM   to encode the object keys in the response,
      specifying the encoding method. An object key may contain any Unicode
      character; however, the XML 1.0 parser may not be able to parse some
      characters. For characters not supported in XML 1.0, add this parameter to
      request that XDM   encode the keys in the response.

      Valid Values: ``url``

   ``key-marker``
   
      Specifies the key to start with when listing objects in a bucket.

   ``max-keys``
   
      Sets the maximum number of keys returned in the response. By default, the
      API returns up to 1,000 key names. If additional keys satisfy the search
      criteria, but were not returned because max-keys was exceeded, the
      response contains <isTruncated>true</isTruncated>. To return the
      additional keys, see ``key-marker`` and ``version-id-marker``.

   ``prefix``
   
      Use this parameter to select only keys beginnig with the specified
      prefix. You can use prefixes to separate a bucket into different groupings
      of keys. (You can think of using prefix to make groups in the same way
      you'd use a folder in a file system.) You can use prefix with delimiter to
      roll up numerous objects into a single result under ``CommonPrefixes``.

   ``version-id-marker``
   
      Specifies the object version you want to start listing from.

Request Body
~~~~~~~~~~~~

The request does not have a request body.

Response Syntax
---------------

.. code::

   HTTP/1.1 200
   <?xml version="1.0" encoding="UTF-8"?>
   <ListObjectVersionsOutput>
      <IsTruncated>boolean</IsTruncated>
      <KeyMarker>string</KeyMarker>
      <VersionIdMarker>string</VersionIdMarker>
      <NextKeyMarker>string</NextKeyMarker>
      <NextVersionIdMarker>string</NextVersionIdMarker>
      <Version>
         <ETag>string</ETag>
         <IsLatest>boolean</IsLatest>
         <Key>string</Key>
         <LastModified>timestamp</LastModified>
         <Owner>
            <DisplayName>string</DisplayName>
            <ID>string</ID>
         </Owner>
         <Size>integer</Size>
         <StorageClass>string</StorageClass>
         <VersionId>string</VersionId>
      </Version>
      ...
      <DeleteMarker>
         <IsLatest>boolean</IsLatest>
         <Key>string</Key>
         <LastModified>timestamp</LastModified>
         <Owner>
            <DisplayName>string</DisplayName>
            <ID>string</ID>
         </Owner>
         <VersionId>string</VersionId>
      </DeleteMarker>
      ...
      <Name>string</Name>
      <Prefix>string</Prefix>
      <Delimiter>string</Delimiter>
      <MaxKeys>integer</MaxKeys>
      <CommonPrefixes>
         <Prefix>string</Prefix>
      </CommonPrefixes>
      ...
      <EncodingType>string</EncodingType>
   </ListObjectVersionsOutput>

Response Elements
~~~~~~~~~~~~~~~~~

On success, the service returns an ``HTTP 200`` response with the following
XML-formatted data:

   ``ListObjectVersionsOutput``
   
      Root-level tag for the ListObjectVersionsOutput parameters.

      Required.

   ``CommonPrefixes``

      All of the keys under a common prefix count as a single return when
      calculating the number of returns.

      Type: Array of ``CommonPrefix`` data types

   ``DeleteMarker``

      Container for a delete marker object.

      Type: Array of ``DeleteMarkerEntry`` data types

   ``Delimiter``
   
      A delimiter is a character you specify to group keys. All keys containing
      the same string between the prefix and the first occurrence of the
      delimiter are grouped under a single result element in
      ``CommonPrefixes``. These groups are counted as one result against the
      max-keys limitation. These keys are not returned elsewhere in the
      response.

      Type: String

   ``EncodingType``

      Encoding type used by XDM   to encode object key names in the XML
      response.

      If you specify an ``encoding-type`` request parameter, XDM  
      includes this element in the response, and returns encoded key name values
      in the following response elements:

      ``KeyMarker``, ``NextKeyMarker``, ``Prefix``, ``Key``, and ``Delimiter``.

      Type: String

      Valid Values: ``url``

   ``IsTruncated``
   
      This flag indicates whether XDM   returned all results satisfying
      the search. If the results were truncated, you can issue a follow-up
      paginated request starting with the ``NextKeyMarker`` and
      ``NextVersionIdMarker`` response parameters to return the rest of the
      results.

      Type: Boolean

   ``KeyMarker``

      Indicates the last key returned in a truncated response.

      Type: String

   ``MaxKeys``
   
      Specifies the maximum number of objects to return.

      Type: Integer

   ``Name``

      Bucket name

      Type: String

   ``NextKeyMarker``
   
      When the number of responses exceeds the value of ``MaxKeys``,
      ``NextKeyMarker`` specifies the first key satisfying the search criteria
      that has not been returned. Use this value for the ``key-marker`` request
      parameter in a subsequent request.

      Type: String

   ``NextVersionIdMarker``
   
      When the number of responses exceeds the value of ``MaxKeys``,
      ``NextVersionIdMarker`` specifies the first object version satisfying the
      search criteria that has not been returned. Use this value for the
      ``version-id-marker`` request parameter in a subsequent request.

      Type: String

   ``Prefix``
   
      Selects objects that start with the value supplied by this parameter.

      Type: String

   ``Version``
   
      Container for version information.

      Type: Array of ``ObjectVersion`` data types

   ``VersionIdMarker``
   
      Marks the last version of the key returned in a truncated response.

      Type: String


Examples
--------

Sample Request
~~~~~~~~~~~~~~

The following request returns all of the versions of all of the objects in the
specified bucket.

.. code::

   GET /?versions HTTP/1.1
   Host: BucketName.s3.<Region>.example.com
   Date: Wed, 28 Oct 2009 22:32:00 +0000
   Authorization: authorization string 
            

Sample Response
~~~~~~~~~~~~~~~

.. code::

   <?xml version="1.0" encoding="UTF-8"?>

   <ListVersionsResult xmlns="http://s3.example.com/doc/2006-03-01">
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
           <ETag>"fba9dede5f27731c9771645a39863328"</ETag>
           <Size>434234</Size>
           <StorageClass>STANDARD</StorageClass>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>username@amazon.com</DisplayName>
           </Owner>
       </Version>
       <DeleteMarker>
           <Key>my-second-image.jpg</Key>
           <VersionId>03jpff543dhffds434rfdsFDN943fdsFkdmqnh892</VersionId>
           <IsLatest>true</IsLatest>
           <LastModified>2009-11-12T17:50:30.000Z</LastModified>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>username@example.com</DisplayName>
           </Owner>    
       </DeleteMarker>
       <Version>
           <Key>my-second-image.jpg</Key>
           <VersionId>QUpfdndhfd8438MNFDN93jdnJFkdmqnh893</VersionId>
           <IsLatest>false</IsLatest>
           <LastModified>2009-10-10T17:50:30.000Z</LastModified>
           <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
           <Size>166434</Size>
           <StorageClass>STANDARD</StorageClass>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>username@example.com</DisplayName>
           </Owner>
       </Version>
       <DeleteMarker>
           <Key>my-third-image.jpg</Key>
           <VersionId>03jpff543dhffds434rfdsFDN943fdsFkdmqnh892</VersionId>
           <IsLatest>true</IsLatest>
           <LastModified>2009-10-15T17:50:30.000Z</LastModified>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>username@example.com</DisplayName>
           </Owner>    
       </DeleteMarker>   
       <Version>
           <Key>my-third-image.jpg</Key>
           <VersionId>UIORUnfndfhnw89493jJFJ</VersionId>
           <IsLatest>false</IsLatest>
           <LastModified>2009-10-11T12:50:30.000Z</LastModified>
           <ETag>"772cf535f27731c974343645a3985328"</ETag>
           <Size>64</Size>
           <StorageClass>STANDARD</StorageClass>
           <Owner>
               <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
               <DisplayName>username@example.com</DisplayName>
           </Owner>
        </Version>
   </ListVersionsResult>

Sample Request
~~~~~~~~~~~~~~

The following request returns objects in the order they were stored, returning
the most recently stored object first, starting with the value for key-marker.

.. code::

   GET /?versions&key-marker=key2 HTTP/1.1
   Host: s3.example.com
   Pragma: no-cache
   Accept: image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, */*
   Date: Thu, 10 Dec 2009 22:46:32 +0000
   Authorization: signatureValue

Sample Response
~~~~~~~~~~~~~~~

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.example.com/doc/2006-03-01/">
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
       <ETag>"396fefef536d5ce46c7537ecf978a360"</ETag>
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
       <ETag>"396fefef536d5ce46c7537ecf978a360"</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>
            

Sample Request Using ``prefix``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This example returns objects whose keys begin with ``source``.

.. code::

   GET /?versions&prefix=source HTTP/1.1
   Host: bucket.s3.<Region>.example.com
   Date: Wed, 28 Oct 2009 22:32:00 +0000
   Authorization: authorization string

Sample Response
~~~~~~~~~~~~~~~

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.example.com/doc/2006-03-01/">
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
       <ETag>"396fefef536d5ce46c7537ecf978a360"</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>

Sample Request Using ``key-marker`` and ``version-id-marker`` parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following example returns objects starting at the specified key
(``key-marker``) and version ID (``version-id-marker``).

.. code::

   GET /?versions&key-marker=key3&version-id-marker=t46ZenlYTZBnj HTTP/1.1
   Host: bucket.s3.<Region>.example.com
   Date: Wed, 28 Oct 2009 22:32:00 +0000
   Authorization: signatureValue
            
Sample Response
~~~~~~~~~~~~~~~

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.example.com/doc/2006-03-01/">
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
       <ETag>"396fefef536d5ce46c7537ecf978a360"</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>

Sample Request Using ``key-marker``, ``version-id-marker``, and ``max-keys``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following request returns up to three (the value of ``max-keys``) objects
starting with the key specified by ``key-marker`` and the version ID specified
by ``version-id-marker``.

.. code::

   GET /?versions&key-marker=key3&version-id-marker=t46Z0menlYTZBnj&max-keys=3
   Host: bucket.s3.<Region>.example.com
   Date: Wed, 28 Oct 2009 22:32:00 +0000
   Authorization: authorization string
            
Sample Response
~~~~~~~~~~~~~~~

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.example.com/doc/2006-03-01/">
     <Name>mtp-versioning-fresh</Name>
     <Prefix/>
     <KeyMarker>key3</KeyMarker>
     <VersionIdMarker>null</VersionIdMarker>
     <NextKeyMarker>key3</NextKeyMarker>
     <NextVersionIdMarker>d-d309mfjFrUmoQ0DBsVqmcMV15OI.</NextVersionIdMarker>
     <MaxKeys>3</MaxKeys>
     <IsTruncated>true</IsTruncated>
     <Version>
       <Key>key3</Key>
       <VersionId>8XECiENpj8pydEDJdd-_VRrvaGKAHOaGMNW7tg6UViI.</VersionId>
       <IsLatest>false</IsLatest>
       <LastModified>2009-12-09T00:18:23.000Z</LastModified>
       <ETag>"396fefef536d5ce46c7537ecf978a360"</ETag>
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
       <ETag>"396fefef536d5ce46c7537ecf978a360"</ETag>
       <Size>217</Size>
       <Owner>
         <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       </Owner>
       <StorageClass>STANDARD</StorageClass>
     </Version>
   </ListVersionsResult>

Sample Request Using the ``delimiter`` and ``prefix`` parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Assume you have the following keys in example-bucket.

``photos/2006/January/sample.jpg``

``photos/2006/February/sample.jpg``

``photos/2006/March/sample.jpg``

``videos/2006/March/sample.wmv``

``sample.jpg``

The following GET versions request specifies the ``delimiter`` parameter with
value "/".

.. code::

   GET /?versions&delimiter=/ HTTP/1.1
   Host: example-bucket.s3.<Region>.example.com
   Date: Wed, 02 Feb 2011 20:34:56 GMT
   Authorization: authorization string
               

Sample Response
~~~~~~~~~~~~~~~

The list of keys from the specified bucket is shown in the following response.

The response returns the sample.jpg key in a ``<Version>`` element. However,
because all the other keys contain the specified delimiter, a distinct substring
from each of these keys--from the beginning of the key to the first occurrence
of the delimiter--is returned in a ``<CommonPrefixes>`` element. The ``Key``
substrings, ``photos/`` and ``videos/``, in the ``<CommonPrefixes>`` element
indicate that there are one or more keys with these key prefixes.

This is useful if you use ``Key`` prefixes for your objects to create a logical
folder-like structure. In this casee, the results indicate the folders
``photos/`` and ``videos/`` have one or more objects.

.. code::

   <ListVersionsResult xmlns="http://s3.example.com/doc/2006-03-01/">
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
       <ETag>"3305f2cfc46c0f04559748bb039d69ae"</ETag>
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

In addition to the ``delimiter`` parameter, you can filter results by adding a
prefix parameter as shown in the following request.

.. code::

   GET /?versions&prefix=photos/2006/&delimiter=/ HTTP/1.1
   Host: example-bucket.s3.<Region>.example.com
   Date: Wed, 02 Feb 2011 19:34:02 GMT
   Authorization: authorization string

In this case, the response includes only objects keys that start with the
specified prefix. The value returned in the ``<CommonPrefixes>`` element is a
substring from the beginning of the key to the first occurrence of the specified
delimiter after the prefix.

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListVersionsResult xmlns="http://s3.example.com/doc/2006-03-01/">
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
       <ETag>"d41d8cd98f00b204e9800998ecf8427e"</ETag>
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
