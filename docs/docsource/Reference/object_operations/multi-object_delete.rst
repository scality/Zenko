.. _Multi-Object Delete:

Multi-Object Delete
===================

The Multi-Object Delete operation enables the deletion of multiple objects from
a bucket using a single HTTP request. If object keys to be deleted are known,
this operation provides a suitable alternative to sending individual delete 
requests, reducing per-request overhead. Refer to :ref:`DELETE Object`.

The Multi-Object Delete request contains a list of up to 1000 keys that
can be deleted. In the XML, provide the object key names. Optionally,
provide version ID to delete a specific version of the object from a
versioning-enabled bucket. For each key, Zenko performs a delete operation and
returns the result of that delete, success or failure, in the response.
If the object specified in the request is not found, Zenko returns the result
as deleted.

The Multi-Object Delete operation supports two modes for the
response—verbose and quiet. By default, the operation uses verbose mode
in which the response includes the result of deletion of each key in the
request. In quiet mode the response includes only keys where the delete
operation encountered an error. For a successful deletion, the operation
does not return any information about the delete in the response body.

Finally, the Content-MD5 header is required for all Multi-Object Delete
requests. Amazon S3 uses the header value to ensure that your request
body has not be altered in transit.

Requests
--------

**Request Syntax**

.. code::

   POST / ?delete HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Authorization: {{authorizationString}}
   Content-Length: {{length}}
   Content-MD5: {{MD5}}

   <?xml version="1.0" encoding="UTF-8"?>
   <Delete>
       <Quiet>true</Quiet>
       <Object>
            <Key>Key</Key>
            <VersionId>VersionId</VersionId>
       </Object>
       <Object>
            <Key>Key</Key>
       </Object>
       ...
   </Delete>

**Request Parameters**

The Multi-Object Delete operation requires a single query string
parameter called “delete” to distinguish it from other bucket POST
operations.

**Request Headers**

The Multi-Object Delete operation uses two request headers —
Content-MD5, and Content-Length — in addition to those that are common
to all operations (refer to :ref:`Common Request Headers`).

.. tabularcolumns:: X{0.20\textwidth}X{0.10\textwidth}X{0.65\textwidth}
.. table::

   +-----------------------+-----------------------+-----------------------+
   | Header                | Type                  | Description           |
   +=======================+=======================+=======================+
   | Content-MD5           | string                | The base64-encoded    |
   |                       |                       | 128-bit MD5 digest of |
   |                       |                       | the data. This header |
   |                       |                       | must be used as a     |
   |                       |                       | message integrity     |
   |                       |                       | check to verify that  |
   |                       |                       | the request body was  |
   |                       |                       | not corrupted in      |
   |                       |                       | transit.              |
   +-----------------------+-----------------------+-----------------------+
   | Content-Length        | string                | Length of the body    |
   |                       |                       | according to RFC      |
   |                       |                       | 2616.                 |
   +-----------------------+-----------------------+-----------------------+

**Request Elements**

The Multi-Object Delete operation can request the following items:

.. tabularcolumns:: X{0.15\textwidth}X{0.15\textwidth}X{0.65\textwidth}
.. table::

   +-----------+-----------+---------------------------------------------------+
   | Element   | Type      | Description                                       |
   +===========+===========+===================================================+
   | Delete    | Container | Container for the request                         | 
   |           |           |                                                   |
   |           |           | **Ancestor:** None                                |
   |           |           |                                                   |
   |           |           | **Children:** One or more Object elements and an  |
   |           |           | optional Quiet element                            |
   +-----------+-----------+---------------------------------------------------+
   | Quiet     | Boolean   | Element to enable quiet mode for the request      |
   |           |           | (when added, the element must be set to true)     |
   |           |           |                                                   |
   |           |           | **Ancestor:** Delete                              |
   +-----------+-----------+---------------------------------------------------+
   | Object    | Container | Element that describes the delete request for an  |
   |           |           | object                                            | 
   |           |           |                                                   |
   |           |           | **Ancestor:** Delete                              |
   |           |           |                                                   |
   |           |           | **Children:** Key element and an optional         |
   |           |           | VersionId element                                 |
   +-----------+-----------+---------------------------------------------------+
   | Key       | String    | Key name of the object to delete                  |
   |           |           |                                                   |
   |           |           | **Ancestor:** Object                              |
   +-----------+-----------+---------------------------------------------------+
   | VersionId | String    | VersionId for the specific version of the object  |
   |           |           | to delete                                         |
   |           |           |                                                   |
   |           |           | **Ancestor:** Object                              |
   +-----------+-----------+---------------------------------------------------+

Responses
---------

**Response Headers**

Implementation of the Multi-Object Delete operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

**Response Elements**

The Multi-Object Delete operation can return the following XML elements
of the response:

.. tabularcolumns:: llX{0.60\textwidth}
.. table::
   :class: longtable

   +-----------------------+-----------------------+-----------------------+
   | Element               | Type                  | Description           |
   +=======================+=======================+=======================+
   | DeleteResult          | Container             | Container for the     |
   |                       |                       | response              |
   |                       |                       |                       |
   |                       |                       | Ancestor: None        |
   |                       |                       |                       |
   |                       |                       | Children: Deleted,    |
   |                       |                       | Error                 |
   +-----------------------+-----------------------+-----------------------+
   | Deleted               | Container             | Container element for |
   |                       |                       | a successful delete   |
   |                       |                       | (identifies the       |
   |                       |                       | object that was       |
   |                       |                       | successfully deleted) |
   |                       |                       |                       |
   |                       |                       | Ancestor:             |
   |                       |                       | DeleteResult          |
   |                       |                       |                       |
   |                       |                       | Children: Key,        |
   |                       |                       | VersionId             |
   +-----------------------+-----------------------+-----------------------+
   | Key                   | String                | Key name for the      |
   |                       |                       | object that Amazon S3 |
   |                       |                       | attempted to delete   |
   |                       |                       |                       |
   |                       |                       | Ancestor: Deleted,    |
   |                       |                       | Error                 |
   +-----------------------+-----------------------+-----------------------+
   | VersionId             | String                | Version ID of the     |
   |                       |                       | versioned object      |
   |                       |                       | Zenko attempted to    |
   |                       |                       | delete. Includes this |
   |                       |                       | element only in case  |
   |                       |                       | of a versioned-delete |
   |                       |                       | request.              |
   |                       |                       |                       |
   |                       |                       | Ancestor: Deleted or  |
   |                       |                       | Error                 |
   +-----------------------+-----------------------+-----------------------+
   | DeleteMarker          | Boolean               | DeleteMarker element  |
   |                       |                       | with a true value     |
   |                       |                       | indicates that the    |
   |                       |                       | request accessed a    |
   |                       |                       | delete marker. If a   |
   |                       |                       | specific delete       |
   |                       |                       | request either        |
   |                       |                       | creates or deletes a  |
   |                       |                       | delete marker, this   |
   |                       |                       | element is returned   |
   |                       |                       | in the response with  |
   |                       |                       | a value of true. This |
   |                       |                       | is the case only when |
   |                       |                       | your Multi-Object     |
   |                       |                       | Delete request is on  |
   |                       |                       | a bucket that has     |
   |                       |                       | versioning enabled or |
   |                       |                       | suspended.            |
   |                       |                       |                       |
   |                       |                       | Ancestor: Deleted     |
   +-----------------------+-----------------------+-----------------------+
   | DeleteMarkerVersionId | String                | Version ID of the     |
   |                       |                       | delete marker         |
   |                       |                       | accessed (deleted or  |
   |                       |                       | created) by the       |
   |                       |                       | request.              |
   |                       |                       |                       |
   |                       |                       | If the specific       |
   |                       |                       | delete request in the |
   |                       |                       | Multi-Object Delete   |
   |                       |                       | either creates or     |
   |                       |                       | deletes a delete      |
   |                       |                       | marker, Zenko returns |
   |                       |                       | this element in       |
   |                       |                       | response with the     |
   |                       |                       | version ID of the     |
   |                       |                       | delete marker. @hen   |
   |                       |                       | deleting an object in |
   |                       |                       | a bucket with         |
   |                       |                       | versioning enabled,   |
   |                       |                       | this value is present |
   |                       |                       | for the following     |
   |                       |                       | two reasons:          |
   |                       |                       |                       |
   |                       |                       | -  A non-versioned    |
   |                       |                       |    delete request is  |
   |                       |                       |    sent; that is,     |
   |                       |                       |    only the object    |
   |                       |                       |    key is specified   |
   |                       |                       |    and not the        |
   |                       |                       |    version ID. In     |
   |                       |                       |    this case, S3      |
   |                       |                       |    Connector creates  |
   |                       |                       |    a delete marker    |
   |                       |                       |    and returns its    |
   |                       |                       |    version ID in the  |
   |                       |                       |    response.          |
   |                       |                       | -  A versioned delete |
   |                       |                       |    request is sent;   |
   |                       |                       |    that is, an object |
   |                       |                       |    key and a version  |
   |                       |                       |    ID are specified   |
   |                       |                       |    in the request;    |
   |                       |                       |    however, the       |
   |                       |                       |    version ID         |
   |                       |                       |    identifies a       |
   |                       |                       |    delete marker. In  |
   |                       |                       |    this case, S3      |
   |                       |                       |    Connector deletes  |
   |                       |                       |    the delete marker  |
   |                       |                       |    and returns the    |
   |                       |                       |    specific version   |
   |                       |                       |    ID in response.    |
   |                       |                       |                       |
   |                       |                       | Ancestor: Deleted     |
   +-----------------------+-----------------------+-----------------------+
   | Error                 | String                | Container for a       |
   |                       |                       | failed delete         |
   |                       |                       | operation that        |
   |                       |                       | describes the object  |
   |                       |                       | that Zenko    	   |
   |                       |                       | attempted to          |
   |                       |                       | delete and the error  |
   |                       |                       | it encountered.       |
   |                       |                       |                       |
   |                       |                       | Ancestor:             |
   |                       |                       | DeleteResult          |
   |                       |                       |                       |
   |                       |                       | Children: Key,        |
   |                       |                       | VersionId, Code,      |
   |                       |                       | Message               |
   +-----------------------+-----------------------+-----------------------+
   | Key                   | String                | Key for the object    |
   |                       |                       | Zenko attempted to	   |
   |                       |                       | delete         	   |
   |                       |                       |                       |
   |                       |                       | Ancestor: Error       |
   +-----------------------+-----------------------+-----------------------+
   | Code                  | String                | Status code for the   |
   |                       |                       | result of the failed  |
   |                       |                       | delete                |
   |                       |                       |                       |
   |                       |                       | Valid Values:         |
   |                       |                       | ``AccessDenied``,     |
   |                       |                       | ``InternalError``     |
   |                       |                       |                       |
   |                       |                       | Ancestor: Error       |
   +-----------------------+-----------------------+-----------------------+
   | Message               | String                | Error description     |
   |                       |                       |                       |
   |                       |                       | Ancestor: Error       |
   +-----------------------+-----------------------+-----------------------+

Examples
--------

**Multi-Object Delete Resulting in Mixed Success/Error Response**

The request sample illustrates a Multi-Object Delete request to delete
objects that result in mixed success and error responses.

*Request Sample*

The request deletes two objects from {{bucketname}} (in this example,
the requester does not have permission to delete the sample2.txt
object).

.. code::

   POST /?delete HTTP/1.1
   Host: {{bucketname}}.s3.scality.com
   Accept: */*
   x-amz-date: Wed, 12 Oct 2009 17:50:00 GMT
   Content-MD5: p5/WA/oEr30qrEE121PAqw==
   Authorization: {{authorizationString}}
   Content-Length: {{length}}
   Connection: Keep-Alive

.. code::


   <Delete>
     <Object>
       <Key>sample1.txt</Key>
     </Object>
     <Object>
       <Key>sample2.txt</Key>
     </Object>
   </Delete>

*Response Sample*

The response includes a DeleteResult element that includes a Deleted
element for the item that Zenko successfully deleted and an Error element that
Zenko did not delete because the user didn’t have permission to delete the
object.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: 5h4FxSNCUS7wP5z92eGCWDshNpMnRuXvETa4HH3LvvH6VAIr0jU7tH9kM7X+njXx
   x-amz-request-id: A437B3B641629AEE
   Date: Fri, 02 Dec 2011 01:53:42 GMT
   Content-Type: application/xml
   Server: ScalityS3
   Content-Length: 251

::

   <?xml version="1.0" encoding="UTF-8"?>
   <DeleteResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
   <Deleted>
   <Key>sample1.txt</Key>
   </Deleted>
   <Error>
   <Key>sample2.txt</Key>
   <Code>AccessDenied</Code>
   <Message>Access Denied</Message>
   </Error>
   </DeleteResult>

**Deleting Object from a Versioned Bucket**

In deleting an item from a versioning enabled bucket, all versions of
that object remain in the bucket; however, Zenko inserts a delete marker.

The following scenarios describe the behavior of a Multi-Object Delete
request when versioning is enabled for a bucket.

**Scenario 1: Simple Delete**

As shown, the Multi-Object Delete request specifies only one key.

.. code::

   POST /?delete HTTP/1.1
   Host: {{bucketname}}.s3.scality.com
   Accept: */*
   x-amz-date: Wed, 30 Nov 2011 03:39:05 GMT
   Content-MD5: p5/WA/oEr30qrEEl21PAqw==
   Authorization: {{authorizationString}}
   Content-Length: {{length}}
   Connection: Keep-Alive

   <Delete>
     <Object>
       <Key>SampleDocument.txt</Key>
     </Object>
   </Delete>

As versioning is enabled on the bucket, Zenko does not delete the object,
instead adding a delete marker. The response indicates that a delete
marker was added (the DeleteMarker element in the response has a value
of true) and the version number of the added delete marker.

.. code::

   HTTP/1.1 201 OK
   x-amz-id-2: P3xqrhuhYxlrefdw3rEzmJh8z5KDtGzb+/FB7oiQaScI9Yaxd8olYXc7d1111ab+
   x-amz-request-id: 264A17BF16E9E80A
   Date: Wed, 30 Nov 2011 03:39:32 GMT
   Content-Type: application/xml
   Server: ScalityS3
   Content-Length: 276

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <DeleteResult xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Deleted>
       <Key>SampleDocument.txt</Key>
       <DeleteMarker>true</DeleteMarker>
       <DeleteMarkerVersionId>NeQt5xeFTfgPJD8B4CGWnkSLtluMr11s</DeleteMarkerVersionId>
     </Deleted>
   </DeleteResult>

**Scenario 2: Versioned Delete**

As shown, the Multi-Object Delete attempts to delete a specific version
of an object.

.. code::

   POST /?delete HTTP/1.1
   Host: {{bucketname}}.s3.scality.com
   Accept: */*
   x-amz-date: Wed, 30 Nov 2011 03:39:05 GMT
   Content-MD5: p5/WA/oEr30qrEEl21PAqw==
   Authorization: {{authorizationString}}
   Content-Length: {{length}}
   Connection: Keep-Alive

.. code::

   <Delete>
   <Object>
   <Key>sampledocument.txt</Key>
   <VersionId>OYcLXagmS.WaD..oyH4KRguB95_YhLs7</VersionId>
   </Object>
   </Delete>

In this case, Zenko deletes the specific object version from the bucket and
returns the following response. In the response, Zenko returns the key and
version ID of the deleted object.

.. code::

   HTTP/1.1 201 OK
   x-amz-id-2: P3xqrhuhYxlrefdw3rEzmJh8z5KDtGzb+/FB7oiQaScI9Yaxd8olYXc7d1111xx+
   x-amz-request-id: 264A17BF16E9E80A
   Date: Wed, 30 Nov 2011 03:39:32 GMT
   Content-Type: application/xml
   Server: ScalityS3
   Content-Length: 219

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <DeleteResult xmlns="http://s3.scality.com/doc/2006-03-01/">
   <Deleted>
   <Key>sampledocument.txt</Key>
   <VersionId>OYcLXagmS.WaD..oyH4KRguB95_YhLs7</VersionId>
   </Deleted>
   </DeleteResult>

**Scenario 3: Versioned Delete of a Delete Marker**

In the preceding example, the request refers to a delete marker (in lieu
of an object), then Zenko deletes the delete marker. The effect of this
operation is to make the object reappear in the bucket. The response
returned by Zenko indicates the deleted delete marker (DeleteMarker element
with value true) and the version ID of the delete marker.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: IIPUZrtolxDEmWsKOae9JlSZe6yWfTye3HQ3T2iAe0ZE4XHa6NKvAJcPp51zZaBr
   x-amz-request-id: D6B284CEC9B05E4E
   Date: Wed, 30 Nov 2011 03:43:25 GMT
   Content-Type: application/xml
   Server: ScalityS3
   Content-Length: {{length}}

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <DeleteResult xmlns="http://s3.scalitys3.com/doc/2006-03-01/">
   <Deleted>
   <Key>sampledocument.txt</Key>
   <VersionId>NeQt5xeFTfgPJD8B4CGWnkSLtluMr11s</VersionId>
   <DeleteMarker>true</DeleteMarker>
   <DeleteMarkerVersionId>NeQt5xeFTfgPJD8B4CGWnkSLtluMr11s</DeleteMarkerVersionId>
   </Deleted>
   </DeleteResult>

In general, when a Multi-Object Delete request results in Zenko either adding
a delete marker or removing a delete marker, the response returns the
following elements:

.. code::

   <DeleteMarker>true</DeleteMarker>
   <DeleteMarkerVersionId>NeQt5xeFTfgPJD8B4CGWnkSLtluMr11s</DeleteMarkerVersionId>

**Malformed XML in the Request**

The request sample sends a malformed XML document (missing the Delete
end element).

*Request Sample*

.. code::

   POST /?delete HTTP/1.1
   Host: bucketname.S3.amazonaws.com
   Accept: */*
   x-amz-date: Wed, 30 Nov 2011 03:39:05 GMT
   Content-MD5: p5/WA/oEr30qrEEl21PAqw==
   Authorization: AWS AKIAIOSFODNN7EXAMPLE:W0qPYCLe6JwkZAD1ei6hp9XZIee=
   Content-Length: 104
   Connection: Keep-Alive

.. code::

   <Delete>
   <Object>
   <Key>404.txt</Key>
   </Object>
   <Object>
   <Key>a.txt</Key>
   </Object>

*Response Sample*

The response returns the Error messages that describe the error.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: P3xqrhuhYxlrefdw3rEzmJh8z5KDtGzb+/FB7oiQaScI9Yaxd8olYXc7d1111ab+
   x-amz-request-id: 264A17BF16E9E80A
   Date: Wed, 30 Nov 2011 03:39:32 GMT
   Content-Type: application/xml
   Server: AmazonS3
   Content-Length: 207

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <Error>
   <Code>MalformedXML</Code>
   <Message>The XML you provided was not well-formed or did not validate against our published schema</Message>
   <RequestId>264A17BF16E9E80A</RequestId>
   <HostId>P3xqrhuhYxlrefdw3rEzmJh8z5KDtGzb+/FB7oiQaScI9Yaxd8olYXc7d1111ab+</HostId>
   </Error>
