.. _GET Bucket (List Objects):

GET Bucket (List Objects)
=========================

The GET Bucket (List Objects) operation returns some or all objects in a
bucket (up to 1000, which is also the default setting). By default, the
objects returned by the GET Bucket operation is limited to 1000, however
this can be changed via the ``max-keys`` parameter to any number less
than 1000.

The **Request Parameters** for GET Bucket (List Objects) can be used as
selection criteria to return a subset of the objects in a bucket. A
``200 OK`` response can contain valid or invalid XML. So applications
should be designed to parse the contents of the response and to handle
it appropriately.

Requests
--------

**Request Syntax**

.. code::

   GET / HTTP/1.1
   Host: {{BucketName}}.{{ConnectorName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

**Request Parameters**

The GET Bucket (List Objects) operation can use the following optional
parameters to return a subset of objects in a bucket:

.. tabularcolumns:: llL
.. table::
   :widths: auto

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
   |                       |                       | can be encoded in the |
   |                       |                       | response to ensure    |
   |                       |                       | they are legible.     |
   |                       |                       | Encoding is not set   |
   |                       |                       | by default. Currently |
   |                       |                       | the only valid value  |
   |                       |                       | is ``url``.           |
   +-----------------------+-----------------------+-----------------------+
   | marker                | integer               | Specifies the key to  |
   |                       |                       | start with when       |
   |                       |                       | listing objects in a  |
   |                       |                       | bucket. Zenko         |
   |                       |                       | returns object keys   |
   |                       |                       | in UTF-8 binary       |
   |                       |                       | order, starting with  |
   |                       |                       | key after the marker  |
   |                       |                       | in order.             |
   +-----------------------+-----------------------+-----------------------+
   | max-keys              | string                | Limits the number of  |
   |                       |                       | keys included in the  |
   |                       |                       | list. Default is      |
   |                       |                       | 1000. The IsTruncated |
   |                       |                       | element returns true  |
   |                       |                       | if the search         |
   |                       |                       | criteria results for  |
   |                       |                       | the request exceed    |
   |                       |                       | the value set for the |
   |                       |                       | max-keys parameter.   |
   +-----------------------+-----------------------+-----------------------+
   | prefix                | string                | Specifies a string    |
   |                       |                       | that must be present  |
   |                       |                       | at the beginning of a |
   |                       |                       | key in order for the  |
   |                       |                       | key to be included in |
   |                       |                       | the GET Bucket        |
   |                       |                       | response list.        |
   +-----------------------+-----------------------+-----------------------+

**Request Headers**

Implementation of the GET Bucket (List Objects) operation uses only
request headers that are common to all operations (refer to :ref:`Common
Request Headers`).

**Request Elements**

The GET Bucket (List Objects) operation does not use request elements.

Responses
---------

**Response Headers**

Implementation of the GET Bucket (List Objects) operation uses only
response headers that are common to all operations (refer to :ref:`Common Response
Headers`).

**Response Elements**

The GET Bucket (List Objects) operation can return the following
XML elements in the response:

.. tabularcolumns:: llX{0.65\textwidth}
.. table::
   :class: longtable

   +-----------------------+-----------------------+-----------------------+
   | Element               | Type                  | Description           |
   +=======================+=======================+=======================+
   | Contents              | XML metadata          | Metadata about each   |
   |                       |                       | object returned       |
   +-----------------------+-----------------------+-----------------------+
   | CommonPrefixes        | string                | A response can        |
   |                       |                       | contain               |
   |                       |                       | CommonPrefixes only   |
   |                       |                       | if Delimiter is       |
   |                       |                       | specified. When that  |
   |                       |                       | is the case,          |
   |                       |                       | CommonPrefixes        |
   |                       |                       | contains all (if      |
   |                       |                       | there are any) keys   |
   |                       |                       | between Prefix and    |
   |                       |                       | the next occurrence   |
   |                       |                       | of the string         |
   |                       |                       | specified by          |
   |                       |                       | Delimiter. In effect, |
   |                       |                       | CommonPrefixes lists  |
   |                       |                       | keys that act like    |
   |                       |                       | subdirectories in the |
   |                       |                       | directory specified   |
   |                       |                       | by Prefix. All of the |
   |                       |                       | keys rolled up in a   |
   |                       |                       | common prefix count   |
   |                       |                       | as a single return    |
   |                       |                       | when calculating the  |
   |                       |                       | number of returns.    |
   |                       |                       | Refer to MaxKeys.     |
   +-----------------------+-----------------------+-----------------------+
   | Delimiter             | string                | Causes keys that      |
   |                       |                       | contain the same      |
   |                       |                       | string between the    |
   |                       |                       | prefix and the first  |
   |                       |                       | occurrence of the     |
   |                       |                       | delimiter to be       |
   |                       |                       | rolled up into a      |
   |                       |                       | single result element |
   |                       |                       | in  CommonPrefixes    |
   |                       |                       | the collection.       |
   |                       |                       | These rolled-up keys  |
   |                       |                       | are not returned      |
   |                       |                       | elsewhere in the      |
   |                       |                       | response. Each rolled |
   |                       |                       | up result counts as   |
   |                       |                       | only one return       |
   |                       |                       | against the MaxKeys   |
   |                       |                       | value.                |
   +-----------------------+-----------------------+-----------------------+
   | DisplayName           | string                | Object owner's name   |
   +-----------------------+-----------------------+-----------------------+
   | Encoding-Type         | string                | Encoding type used by |
   |                       |                       | Zenko to encode object|
   |                       |                       | key names in the XML  |
   |                       |                       | response.             |
   |                       |                       |                       |
   |                       |                       | If encoding-type      |
   |                       |                       | request parameter is  |
   |                       |                       | specified, Zenko      |
   |                       |                       | includes this element |
   |                       |                       | in the response, and  |
   |                       |                       | returns encoded key   |
   |                       |                       | name values in the    |
   |                       |                       | following response    |
   |                       |                       | elements: Delimiter,  |
   |                       |                       | Marker, Prefix,       |
   |                       |                       | NextMarker, Key       |
   +-----------------------+-----------------------+-----------------------+
   | ETag                  | string                | The entity tag is an  |
   |                       |                       | MD5 hash of the       |
   |                       |                       | object. The ETag only |
   |                       |                       | reflects changes to   |
   |                       |                       | the contents of an    |
   |                       |                       | object, not its       |
   |                       |                       | metadata.             |
   +-----------------------+-----------------------+-----------------------+
   | ID                    | string                | Object owner's ID     |
   +-----------------------+-----------------------+-----------------------+
   | IsTruncated           | Boolean               | Specifies whether     |
   |                       |                       | (true) or not (false) |
   |                       |                       | all of the results    |
   |                       |                       | were returned. All of |
   |                       |                       | the results may not   |
   |                       |                       | be returned if the    |
   |                       |                       | number of results     |
   |                       |                       | exceeds that          |
   |                       |                       | specified by MaxKeys. |
   +-----------------------+-----------------------+-----------------------+
   | Key                   | string                | The object's key      |
   |                       |                       | specified by MaxKeys. |
   +-----------------------+-----------------------+-----------------------+
   | LastModified          | date                  | Date and time the     |
   |                       |                       | object was last       |
   |                       |                       | modified              |
   +-----------------------+-----------------------+-----------------------+
   | Marker                | string                | Indicates where in    |
   |                       |                       | the bucket listing    |
   |                       |                       | begins; Marker is     |
   |                       |                       | included in the       |
   |                       |                       | response if it was    |
   |                       |                       | sent with the request |
   +-----------------------+-----------------------+-----------------------+
   | MaxKeys               | string                | The maximum number of |
   |                       |                       | keys returned in the  |
   |                       |                       | response body         |
   +-----------------------+-----------------------+-----------------------+
   | Name                  | string                | Name of the bucket    |
   +-----------------------+-----------------------+-----------------------+
   | NextMarker            | string                | When response is      |
   |                       |                       | truncated (the        |
   |                       |                       | (IsTruncated element  |
   |                       |                       | value in the response |
   |                       |                       | is true), the key     |
   |                       |                       | name can be used in   |
   |                       |                       | this field as marker  |
   |                       |                       | as marker in the      |
   |                       |                       | subsequent request to |
   |                       |                       | get next set of       |
   |                       |                       | objects. Zenko lists  |
   |                       |                       | objects in UTF-8      |
   |                       |                       | binary order.         |
   |                       |                       |                       |
   |                       |                       | Note that Zenko       |
   |                       |                       | returns the           |
   |                       |                       | NextMarker only if a  |
   |                       |                       | Delimiter request     |
   |                       |                       | parameter is          |
   |                       |                       | specified (which runs |
   |                       |                       | counter to AWS        |
   |                       |                       | practice).            |
   +-----------------------+-----------------------+-----------------------+
   | Owner                 | string                | Bucket owner          |
   +-----------------------+-----------------------+-----------------------+
   | Prefix                | string                | Keys that begin with  |
   |                       |                       | the indicated prefix  |
   +-----------------------+-----------------------+-----------------------+
   | Size                  | string                | Size in bytes of the  |
   |                       |                       | object                |
   +-----------------------+-----------------------+-----------------------+

Examples
--------

**Getting Objects in the Backup Bucket**

*Request Sample*

.. code::

   GET / HTTP/1.1
   Host: backup.s3.scality.com
   Date: Thu, 31 Mar 2016 15:11:47 GMT
   Authorization: AWS pat:6nYhPMw6boadLgjywjSIyhfwRIA=

**Presenting a Single Object**

*Response Sample*

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
     <ListBucketResult xmlns="http://s3.scality.com/doc/2006-03-01/">
       <Name>backup</Name>
       <Prefix></Prefix>
       <Marker></Marker>
       <MaxKeys>1000</MaxKeys>
       <Delimiter>/</Delimiter>
       <IsTruncated>false</IsTruncated>
     <Contents>
       <Key>support-20110614.md5</Key>
       <LastModified>2011-06-14T05:08:57.000Z</LastModified>
       <ETag>&amp;quot;8aad2888fd4fafaeabb643ccdaa77872&amp;quot;</ETag>
       <Size>155</Size>
       <Owner>
         <ID>3452783832C94517345278000000004000000120</ID>
         <DisplayName>Patrick</DisplayName
       </Owner>
     <Contents>
     </ListBucketResult>

**Using the max_keys Parameter**

List up to four keys in the demo bucket.

*Request Sample*

.. code::

   GET /?max-keys=4 HTTP/1.1
   Host: demo.s3.scality.com
   Accept: */*
   Authorization: AWS pat:0YPPNCCa9yAbKOFdlLD/ixMLayg=
   Date: Tue, 28 Jun 2011 09:27:15 GMT
   Connection: close

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   Date: Tue, 28 Jun 2011 09:27:15 GMT
   Server: RestServer/1.0
   Content-Length: 1499
   Content-Type: application/xml
   Cache-Control: no-cache
   Connection: close

   <?xml version="1.0" encoding="UTF-8"?>
     <ListBucketResult xmlns="http://s3.scality.com/doc/2006-03-01/">
       <Name>confpat</Name>
       <Prefix></Prefix>
       <Marker></Marker>
       <MaxKeys>4</MaxKeys>
       <IsTruncated>true</IsTruncated>
      <Contents>
        <Key>DS_Store</Key>
        <LastModified>2011-06-26T23:45:35.000Z</LastModified>
        <ETag>>&quot;02674163a1999de7c3fe664ae6f3085e&quot;</ETag>
        <Size>12292</Size>
        <Owner>
          <ID>3452783832C94517345278000000004000000120</ID>
          <DisplayName>pat</DisplayName>
        </Owner>
        <StorageClass>STANDARD</StorageClass>
      </Contents>
      <Contents>
        <Key>Aziende/cluster.sh</Key>
        <LastModified>2011-05-20T14:33:37.000Z</LastModified>
        <ETag>&quot;45ecf8f5ebc7740b034c40e0412250ec&quot;</ETag>
        <Size>74</Size>
        <Owner>
          <ID>3452783832C94517345278000000004000000120</ID>
          <DisplayName>pat</DisplayName>
        </Owner>
        <StorageClass>STANDARD</StorageClass>
      </Contents>
   </ListBucketResult>

**Using Prefix and Delimiter**

*Request Sample*

The following keys are present in the sample bucket:

-  greatshot.raw
-  photographs/2006/January/greatshot.raw
-  photographs/2006/February/greatshot_a.raw
-  photographs/2006/February/greatshot_b.raw
-  photographs/2006/February/greatshot_c.raw

The following GET request specifies the delimiter parameter with value
“/”.

.. code::

   GET /?delimiter=/ HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date: Wed, 01 Mar  2006 12:00:00 GMT
   Authorization: {{authorizationString}}

The key greatshot.raw does not contain the delimiter character, and
Zenko returns it in the Contents element in the response. However, all other
keys contain the delimiter character. Zenko groups these keys and return a
single CommonPrefixes element with the common prefix value
``photographs/``, which is a substring from the beginning of these keys
to the first occurrence of the specified delimiter.

.. code::

   <ListBucketResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>example-bucket</Name>
     <Prefix></Prefix>
     <Marker></Marker>
     <MaxKeys>1000</MaxKeys>
     <Delimiter>/</Delimiter>
     <IsTruncated>false</IsTruncated>
     <Contents>
       <Key>greatshot.raw</Key>
       <LastModified>2011-02-26T01:56:20.000Z</LastModified>
       <ETag>&amp;quot;bf1d737a4d46a19f3bced6905cc8b902&amp;quot;</ETag>
       <Size>142863</Size>
       <Owner>
         <ID>accessKey-user-id</ID>
         <DisplayName>display-name</DisplayName>
       </Owner>
     </Contents>
     <CommonPrefixes>
       <Prefix>photographs/</Prefix>
     </CommonPrefixes>
   </ListBucketResult>

The following GET request specifies the delimiter parameter with value
“/”, and the prefix parameter with value ``photographs/2006/``.

.. code::

   GET /?prefix=photographs/2006/&amp;delimiter=/ HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date: Wed, 01 Mar  2006 12:00:00 GMT
   Authorization: {{authorizationString}}

In response, Zenko returns only the keys that start with the specified prefix.
Further, it uses the delimiter character to group keys that contain the
same substring until the first occurrence of the delimiter character
after the specified prefix. For each such key group Zenko returns one
CommonPrefixes element in the response. The keys grouped under this
CommonPrefixes element are not returned elsewhere in the response. The
value returned in the CommonPrefixes element is a substring, from the
beginning of the key to the first occurrence of the specified delimiter
after the prefix.

.. code::

   <ListBucketResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Name>example-bucket</Name>
     <Prefix>photographs/2006/</Prefix>
     <Marker></Marker>
     <MaxKeys>1000</MaxKeys>
     <Delimiter>/</Delimiter>
     <IsTruncated>false</IsTruncated>
     <CommonPrefixes>
       <Prefix>photographs/2006/February/</Prefix>
    </CommonPrefixes>
     <CommonPrefixes>
       <Prefix>photographs/2006/January/</Prefix>
     </CommonPrefixes>
   </ListBucketResult>
