.. _GET Bucket (List Objects) v.2:

GET Bucket (List Objects) Version 2
===================================

The Version 2 GET operation returns some or all (up to 
1000) of the objects in a bucket. The request parameters can be used as 
selection criteria to return a subset of the objects in a bucket. A 200 OK 
response can contain valid or invalid XML. Design applications to parse the 
contents of the response and to handle them appropriately.

.. note::

   Using the v2 implementation requires READ access to the bucket.

To use this operation in an AWS Identity and Access Management (IAM) policy,
perform the s3:ListBucket action. By dsefault, the bucket owner has this
permission and can grant it to others. For more information about permissions,
see `Permissions Related to Bucket Operations`_ and `Identity and Access
Management in Amazon S3`_ in the `Amazon Simple Storage Service Developer
Guide`_.

.. important::

   Use the revision of the API described in this topic,
   GET Bucket (List Objects) version 2, for application development. For
   backward compatibility, support is maintained for the prior version of this
   API operation, :ref:`GET Bucket (List Objects)`.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /?list-type=2 HTTP/1.1
   Host: BucketName.s3.scality.com
   Date: date
   Authorization: authorization string

Parameters
~~~~~~~~~~

GET Bucket (List Objects) Version 2 uses the following parameters:

.. tabularcolumns:: X{0.20\textwidth}X{0.60\textwidth}X{0.15\textwidth}
.. table::
   :class: longtable

   +------------------------+---------------------------------------------+----------+
   | Parameter              | Description                                 | Required |
   +========================+=============================================+==========+
   | ``delimiter``          | A delimiter is a character for grouping     | No       |
   |                        | keys.                                       |          |
   |                        |                                             |          |
   |                        | If specifying a prefix, all keys that       |          |
   |                        | contain the same string between the prefix  |          |
   |                        | and the first delimiter occurring after     |          |
   |                        | the prefix are grouped under a single       |          |
   |                        | result element, ``CommonPrefixes``.         |          |
   |                        | If the prefixparameter is not specified,    |          |
   |                        | the substring starts at the beginning of    |          |
   |                        | the key. Keys grouped under the             |          |
   |                        | ``CommonPrefixes`` result element are not   |          |
   |                        | returned elsewhere in the response.         |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** None                           |          |
   +------------------------+---------------------------------------------+----------+
   | ``encoding-type``      | Requests Zenko to encode the response and   | No       |
   |                        | specifies the encoding method to use.       |          |
   |                        |                                             |          |
   |                        | An object key can contain any Unicode       |          |
   |                        | character. However, XML 1.0 parsers cannot  |          |
   |                        | parse some characters, such as characters   |          |
   |                        | with an ASCII value from 0 to 10. For       |          |
   |                        | characters not supported in XML 1.0, add    |          |
   |                        | this parameter to request S3 to encode      |          |
   |                        | the keys in the response.                   |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** None                           |          |
   |                        |                                             |          |
   |                        | **Valid value:** ``url``                    |          |
   +------------------------+---------------------------------------------+----------+
   | ``max-keys``           | Sets the maximum number of keys returned in | No       |
   |                        | the response body. To retrieve fewer than   |          |
   |                        | the default 1,000 keys, add this to the     |          |
   |                        | request.                                    |          |
   |                        |                                             |          |
   |                        | The response may contain fewer than the     |          |
   |                        | specified value of keys, but never contains |          |
   |                        | more. If additional keys that satisfy the   |          |
   |                        | search were not returned because max-keys   |          |
   |                        | was exceeded, the response contains         |          |
   |                        | ``<IsTruncated>true</IsTruncated>``.        |          |
   |                        | To return these additional keys, see        |          |
   |                        | NextContinuationToken_.                     |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** 1000                           |          |
   +------------------------+---------------------------------------------+----------+
   | ``prefix``             | Limits the response to keys that begin with | No       |
   |                        | the specified prefix.                       |          |
   |                        |                                             |          |
   |                        | Prefixes can be used to separate a bucket   |          |
   |                        | into different groupings of keys. (You can  |          |
   |                        | think of using ``prefix`` to group objects  |          |
   |                        | as you'd use a folder in a file system.)    |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** None                           |          |
   +------------------------+---------------------------------------------+----------+
   | ``list-type``          | Version 2 of the API requires this          | Yes      |
   |                        | parameter. Its value must be set to 2.      |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** Value is always 2.             |          |
   +------------------------+---------------------------------------------+----------+
   | ``continuation-token`` | When the response to this API call is       | No       |
   |                        | truncated (that is, the ``IsTruncated``     |          |
   |                        | response element value is true), the        |          |
   |                        | response also includes the                  |          |
   |                        | ``NextContinuationToken`` element.          |          |
   |                        | To list the next set of objects, use the    |          |
   |                        | ``NextContinuationTokenelement`` in the     |          |
   |                        | next request as the ``continuation-token``. |          |
   |                        |                                             |          |
   |                        | * The continuation token is an opaque value |          |
   |                        |   that Zenko understands.                   |          |
   |                        | * Zenko lists objects in UTF-8 character    |          |
   |                        |   encoding in lexicographic order.          |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** None                           |          |
   +------------------------+---------------------------------------------+----------+
   | ``fetch-owner``        | By default, the API does not return         | No       |
   |                        | ``Owner`` information in the response.      |          |
   |                        | To get owner information in the response,   |          |
   |                        | set this parameter to true.                 |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** false                          |          |
   +------------------------+---------------------------------------------+----------+
   | ``start-after``        | Add this parameter to request the API to    | No       |
   |                        | return key names after a specific object    |          |
   |                        | key in your key space. Zenko lists objects  |          |
   |                        | in UTF-8 character encoding in              |          |
   |                        | lexicographic order.                        |          |
   |                        |                                             |          |
   |                        | This parameter is valid only in a first     |          |
   |                        | request. If the response is truncated,      |          |
   |                        | specifying this parameter along with the    |          |
   |                        | ``continuation-token`` parameter causes     |          |
   |                        | CloudServer to ignore this parameter.       |          |
   |                        |                                             |          |
   |                        | **Type:** String                            |          |
   |                        |                                             |          |
   |                        | **Default:** None                           |          |
   +------------------------+---------------------------------------------+----------+

Elements
~~~~~~~~

This operation does not use request elements.

Headers
~~~~~~~

This operation uses only request headers that are common
to all operations (see :ref:`Common Request Headers`).

Responses
---------

Headers
~~~~~~~

This operation uses only response headers that are
common to most responses (see :ref:`Common Response Headers`).

Elements
~~~~~~~~

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::
   :class: longtable

   +----------------------------+-----------------------------------------------+
   | Name                       | Description                                   |
   +============================+===============================================+
   | ``Contents``               | Metadata about each object returned.          |
   |                            |                                               |
   |                            | **Type:** XML metadata                        |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``CommonPrefixes``         | All of the keys rolled up into a common       |
   |                            | prefix count as a single return when          |
   |                            | calculating the number of returns. See        |
   |                            | MaxKeys.                                      |
   |                            |                                               |
   |                            | * A response can contain ``CommonPrefixes``   |
   |                            |    only if a delimiter has been specified.    |
   |                            | * ``CommonPrefixes`` contains any existing    |
   |                            |   keys between ``Prefix`` and the next        |
   |                            |   occurrence of the string specified by a     |
   |                            |   delimiter.                                  |
   |                            | * ``CommonPrefixes`` lists keys that act like |
   |                            |   subdirectories in the directory specified   |
   |                            |   by Prefix.                                  |
   |                            |                                               |
   |                            | For example, if the prefix is ``notes/`` and  |
   |                            | the delimiter is a slash (/), as in           |
   |                            | ``notes/summer/july``, the common prefix is   |
   |                            | ``notes/summer/``. All keys that roll up into |
   |                            | a common prefix count as a single return when |
   |                            | calculating the number of returns. See        |
   |                            | MaxKeys.                                      |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``Delimiter``              | Causes keys containing the same string        |
   |                            | between the prefix and first occurrence of    |
   |                            | the delimiter to be rolled up into a single   |
   |                            | result element in the CommonPrefixes          |
   |                            | collection. These rolled-up keys are not      |
   |                            | returned elsewhere in the response. Each      |
   |                            | rolled-up result counts as only one return    |
   |                            | against the MaxKeys value.                    |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``DisplayName``            | Object owner's name.                          |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents.Owner |
   +----------------------------+-----------------------------------------------+
   | ``Encoding-Type``          | Encoding type used by Zenko to encode object  |
   |                            | key names in the XML response.                |
   |                            |                                               |
   |                            | If you specify encoding-type request          |
   |                            | parameter, Zenko includes this element in the |
   |                            | response, and returns encoded key name values |
   |                            | in the ``Delimiter``, ``Prefix``, ``Key``,    |
   |                            | and ``StartAfter`` response elements.         |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``ETag``                   | The entity tag is an MD5 hash of the object.  |
   |                            | ETag reflects only changes to the contents of |
   |                            | an object, not its metadata.                  |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents       |
   +----------------------------+-----------------------------------------------+
   | ``ID``                     | Object owner's ID                             |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents.Owner |
   +----------------------------+-----------------------------------------------+
   | ``IsTruncated``            | Set to false if all results were returned.    |
   |                            |                                               |
   |                            | Set to true if more keys are available to     |
   |                            | return.                                       |
   |                            |                                               |
   |                            | If the number of results exceeds that         |
   |                            | specified by MaxKeys, all of the results      |
   |                            | might not be returned.                        |
   |                            |                                               |
   |                            | **Type:** Boolean                             |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``Key``                    | The object's key                              |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents       |
   +----------------------------+-----------------------------------------------+
   | ``LastModified``           | Date and time the object was last modified    |
   |                            |                                               |
   |                            | **Type:** Date                                |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents       |
   +----------------------------+-----------------------------------------------+
   | .. _MaxKeys: ``MaxKeys``   | The maximum number of keys returned in the    | 
   |                            | response body                                 |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``Name``                   | Name of the bucket                            |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``Owner``                  | Bucket owner                                  |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Children:** DisplayName, ID                 |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents \|    |
   |                            | CommonPrefixes                                |
   +----------------------------+-----------------------------------------------+
   | ``Prefix``                 | Keys that begin with the indicated prefix     |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``Size``                   | Size of the object (in bytes)                 |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents       |
   +----------------------------+-----------------------------------------------+
   | ``StorageClass``           | STANDARD \| STANDARD_IA \| REDUCED_REDUNDANCY |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult.Contents       |
   +----------------------------+-----------------------------------------------+
   | ``ContinuationToken``      | If ContinuationToken was sent with the        |
   |                            | request, it is included in the response.      |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``KeyCount``               | Returns the number of keys included in the    |
   |                            | response. The value is always less than or    |
   |                            | equal to the MaxKeys value.                   |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``NextContinuationToken``  | .. _NextContinuationToken:                    |
   |                            |                                               |
   |                            | If the response is truncated, Zenko returns   |
   |                            | this parameter with a continuation token.     |
   |                            | You can specify the token as the              |
   |                            | continuation-token in your next request to    |
   |                            | retrieve the next set of keys.                |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+
   | ``StartAfter``             | If StartAfter was sent with the request, it   |
   |                            | is included in the response.                  |
   |                            |                                               |
   |                            | **Type:** String                              |
   |                            |                                               |
   |                            | **Ancestor:** ListBucketResult                |
   +----------------------------+-----------------------------------------------+

Special Errors
~~~~~~~~~~~~~~

This operation does not return special errors. For general information about the
AWS errors Zenko uses, and a list of error codes, see :ref:`Error Messages`.

Examples
--------

Listing Keys
~~~~~~~~~~~~

This request returns the objects in BucketName. The request specifies the
list-type parameter, which indicates version 2 of the API.

Request
```````

.. code::

  GET /?list-type=2 HTTP/1.1
  Host: bucket.s3.scality.com
  x-amz-date: 20181108T233541Z
  Authorization: authorization string
  Content-Type: text/plain

Response
````````

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
     <Name>foob</Name>
     <Prefix/>
     <MaxKeys>1000</MaxKeys>
     <EncodingType>url</EncodingType>
     <IsTruncated>false</IsTruncated>
     <FetchOwner>undefined</FetchOwner>
     <Contents>
       <Key>fill-00</Key>
       <LastModified>2018-11-09T20:08:05.396Z</LastModified>
       <ETag>"f1c9645dbc14efddc7d8a322685f26eb"</ETag>
       <Size>10485760</Size>
       <StorageClass>STANDARD</StorageClass>
     </Contents>
     <Contents>
     ...
     </Contents>
   </ListBucketResult>

Listing Keys Using the max-keys, prefix, and start-after Parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In addition to the list-type parameter that indicates version 2 of the API, the request
also specifies additional parameters to retrieve up to three keys in the quotes bucket
that start with E and occur lexicographically after ExampleGuide.pdf.

Request
```````

.. code::

  GET /?list-type=2&max-keys=3&prefix=E&start-after=ExampleGuide.pdf HTTP/1.1
  Host: quotes.s3.scality.com
  x-amz-date: 20181108T232933Z
  Authorization: authorization string

Response
````````

.. code::

  HTTP/1.1 200 OK
  x-amz-id-2: gyB+3jRPnrkN98ZajxHXr3u7EFM67bNgSAxexeEHndCX/7GRnfTXxReKUQF28IfP
  x-amz-request-id: 3B3C7C725673C630
  Date: Thu, 08 Nov 2018 23:29:37 GMT
  Content-Type: application/xml
  Content-Length: length
  Connection: close
  Server: ScalityS3

  <?xml version="1.0" encoding="UTF-8"?>
  <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  Server: S3Connector
    <Name>quotes</Name>
    <Prefix>E</Prefix>
    <StartAfter>ExampleGuide.pdf</StartAfter>
    <KeyCount>1</KeyCount>
    <MaxKeys>3</MaxKeys>
    <IsTruncated>false</IsTruncated>
    <Contents>
      <Key>ExampleObject.txt</Key>
      <LastModified>2013-09-17T18:07:53.000Z</LastModified>
      <ETag>&quot;599bab3ed2c697f1d26842727561fd94&quot;</ETag>
      <Size>857</Size>
      <StorageClass>REDUCED_REDUNDANCY</StorageClass>
    </Contents>
  </ListBucketResult>

Listing Keys Using the prefix and delimiter Parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

This example illustrates the use of the prefix and the delimiter parameters
in the request. This example assumes the following keys are in your bucket:

* sample.jpg
* photos/2006/January/sample.jpg
* photos/2006/February/sample2.jpg
* photos/2006/February/sample3.jpg
* photos/2006/February/sample4.jpg

The following GET request specifies the delimiter parameter with value /.

.. code::

  GET /?list-type=2&delimiter=/ HTTP/1.1
  Host: s3connector.scality.com
  x-amz-date: 20181108T235931Z
  Authorization: authorization string

Response
````````

The sample.jpg key does not contain the delimiter character, and Zenko returns
it in the Contents element in the response. However, all other keys contain the
delimiter character. Zenko groups these keys and returns a single
``CommonPrefixes`` element with the prefix value ``photos/``. The element is a
substring that starts at the beginning of these keys and ends at the first
occurrence of the specified delimiter.

.. code::

  <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <Name>example-bucket</Name>
    <Prefix></Prefix>
    <KeyCount>2</KeyCount>
    <MaxKeys>1000</MaxKeys>
    <Delimiter>/</Delimiter>
    <IsTruncated>false</IsTruncated>
    <Contents>
      <Key>sample.jpg</Key>
      <LastModified>2017-02-26T01:56:20.000Z</LastModified>
      <ETag>&quot;bf1d737a4d46a19f3bced6905cc8b902&quot;</ETag>
      <Size>142863</Size>
      <StorageClass>STANDARD</StorageClass>
    </Contents>

     <CommonPrefixes>
       <Prefix>photos/</Prefix>
     </CommonPrefixes>
   </ListBucketResult>

Request
```````

The following GET request specifies the delimiter parameter with value /, and
the prefix parameter with valuephotos/2006/.

.. code::

  GET /?list-type=2&prefix=photos/2006/&delimiter=/ HTTP/1.1
  Host: s3connector.scality.com
  x-amz-date: 20181108T000433Z
  Authorization: authorization string

Response
````````

In response, Zenko returns only the keys that start with the specified
prefix. Further, it uses the delimiter character to group keys that contain the
same substring until the first occurrence of the delimiter character after the
specified prefix. For each such key group Zenko returns one CommonPrefixes
element in the response. The keys grouped under this CommonPrefixes element are
not returned elsewhere in the response. The value returned in the CommonPrefixes
element is a substring that starts at the beginning of the key and ends at the
first occurrence of the specified delimiter after the prefix.

.. code::

  <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <Name>example-bucket</Name>
    <Prefix>photos/2006/</Prefix>
    <KeyCount>3</KeyCount>
    <MaxKeys>1000</MaxKeys>
    <Delimiter>/</Delimiter>
    <IsTruncated>false</IsTruncated>
    <Contents>
      <Key>photos/2006/</Key>
      <LastModified>2016-04-30T23:51:29.000Z</LastModified>
      <ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag>
      <Size>0</Size>
      <StorageClass>STANDARD</StorageClass>
    </Contents>

    <CommonPrefixes>
      <Prefix>photos/2016/February/</Prefix>
    </CommonPrefixes>
    <CommonPrefixes>
      <Prefix>photos/2016/January/</Prefix>
    </CommonPrefixes>
  </ListBucketResult>

Using a Continuation Token
~~~~~~~~~~~~~~~~~~~~~~~~~~

In this example, the initial request returns more than 1000 keys. In response to
this request, Zenko returns the IsTruncated element with the value set to true
and with a NextContinuationToken element.

Request
```````

.. code::

  GET /?list-type=2 HTTP/1.1
  Host: s3connector.scality.com
  Date: Thu, 08 Nov 2018 23:17:07 GMT
  Authorization: authorization string

Response
````````

The following is a sample response:

.. code::

  HTTP/1.1 200 OK
  x-amz-id-2: gyB+3jRPnrkN98ZajxHXr3u7EFM67bNgSAxexeEHndCX/7GRnfTXxReKUQF28IfP
  x-amz-request-id: 3B3C7C725673C630
  Date: Thu, 08 Nov 2018 23:29:37 GMT
  Content-Type: application/xml
  Content-Length: length
  Connection: close
  Server: ScalityS3

  <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <Name>bucket</Name>
    <Prefix></Prefix>
    <NextContinuationToken>1ueGcxLPRx1Tr/XYExHnhbYLgveDs2J/wm36Hy4vbOwM=</NextContinuationToken>
    <KeyCount>1000</KeyCount>
    <MaxKeys>1000</MaxKeys>
    <IsTruncated>true</IsTruncated>
    <Contents>
      <Key>happyface.jpg</Key>
      <LastModified>2014-11-21T19:40:05.000Z</LastModified>
      <ETag>&quot;70ee1738b6b21e2c8a43f3a5ab0eee71&quot;</ETag>
      <Size>11</Size>
      <StorageClass>STANDARD</StorageClass>
    </Contents>
     ...
  </ListBucketResult>

Request
```````

In the subsequent request, a continuation-token query parameter is included
in the request with the ``<NextContinuationToken>`` value from the preceding
response.

.. code::

  GET /?list-type=2 HTTP/1.1
  GET /?list-type=2&continuation-token=1ueGcxLPRx1Tr/XYExHnhbYLgveDs2J/wm36Hy4vbOwM= HTTP/1.1

  Host: s3connector.scality.com
  Date: Thu, 08 Nov 2018 23:17:07 GMT
  Authorization: authorization string

Response
````````

Zenko returns a list of the next set of keys starting where the previous
request ended.

.. code::

  HTTP/1.1 200 OK
  x-amz-id-2: gyB+3jRPnrkN98ZajxHXr3u7EFM67bNgSAxexeEHndCX/7GRnfTXxReKUQF28IfP
  x-amz-request-id: 3B3C7C725673C630
  Date: Thu, 08 Nov 2018 23:29:37 GMT
  Content-Type: application/xml
  Content-Length: length
  Connection: close
  Server: ScalityS3

  <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <Name>bucket</Name>
    <Prefix></Prefix>
    <ContinuationToken>1ueGcxLPRx1Tr/XYExHnhbYLgveDs2J/wm36Hy4vbOwM=</ContinuationToken>
    <KeyCount>112</KeyCount>
    <MaxKeys>1000</MaxKeys>
    <IsTruncated>false</IsTruncated>
    <Contents>
      <Key>happyfacex.jpg</Key>
      <LastModified>2014-11-21T19:40:05.000Z</LastModified>
      <ETag>&quot;70ee1738b6b21e2c8a43f3a5ab0eee71&quot;</ETag>
      <Size>1111</Size>
      <StorageClass>STANDARD</StorageClass>
    </Contents>
     ...
  </ListBucketResult>

.. _`Permissions Related to Bucket Operations`: https://docs.aws.amazon.com/AmazonS3/latest/dev/using-with-s3-actions.html#using-with-s3-actions-related-to-buckets

.. _`Identity and Access Management in Amazon S3`: https://docs.aws.amazon.com/AmazonS3/latest/dev/s3-access-control.html

.. _`Amazon Simple Storage Service Developer Guide`: https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html

.. _`GET Service`: ../service_operations/get_service.html

.. _`Error Responses`: https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html
