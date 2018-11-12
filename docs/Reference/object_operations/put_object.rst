.. _PUT Object:

PUT Object
==========

The PUT Object operation adds an object to a bucket (WRITE permission on
a bucket is necessary to add an object to it).

.. note::

  Zenko Enterprise never adds partial objects; if a success response is received, Zenko Enterprise added the
  entire object to the bucket.

Object locking is not supported. If an object with the same name is
added to the bucket by multiple PUT Object operations, only the last
request is not overwritten.

To ensure that data is not corrupted traversing the network, use the
Content-MD5 header. When this header is in use, the system checks the
object against the provided MD5 value and returns an error if they do
not match. In addition, the MD5 can be calculated while putting an
object into the system, and the returned ETag can subsequently be
compared to the calculated MD5 value.

Use the ``100-continue`` HTTP status code to configure your application
to send the Request Headers before sending the request body. For PUT
operations, this provides a means for avoiding the sending of the
message body if the message is rejected based on the headers (e.g.,
because of authentication failure or redirect).

When uploading an object, it is possible to optionally specify the
accounts or groups that should be granted specific permissions on an
object. Two ways exist for granting the appropriate permissions using
the request headers:

-  Specify a canned (predefined) ACL using the x-amz-acl request header

-  Specify access permissions explicitly using thex-amz-grant-read,
   x-amz-grant-read-acpand x-amz-grant-write-acp, and
   x-amz-grant-full-control headers. These headers map to the set of
   permissions supported in an ACL.

.. note::

  It is not possible to both use a canned ACL and explicitly specify
  access permissions.

Requests
--------

**Request Syntax**

.. code::

   PUT /ObjectName HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

**Request Parameters**

The PUT Object operation does not use Request Parameters.

**Request Headers**

The PUT Object operation can use a number of optional request headers in
addition to those that are common to all operations (refer to :ref:`Common
Request Headers`).

+-----------------------+-----------------------+-----------------------+
| Header                | Type                  | Description           |
+=======================+=======================+=======================+
| Cache-Control         | string                | Can be used to        |
|                       |                       | specify caching       |
|                       |                       | behavior along the    |
|                       |                       | request/reply chain   |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| Content-Disposition   | string                | Specifies             |
|                       |                       | presentational        |
|                       |                       | information for the   |
|                       |                       | object                |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| Content-Encoding      | string                | Specifies what        |
|                       |                       | content encodings     |
|                       |                       | have been applied to  |
|                       |                       | the object and the    |
|                       |                       | decoding mechanisms   |
|                       |                       | that must be applied  |
|                       |                       | to obtain the         |
|                       |                       | media-type referenced |
|                       |                       | by the Content-Type   |
|                       |                       | header field          |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| Content-Length        | string                | The size of the       |
|                       |                       | object, in bytes.     |
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
| Content-Type          | string                | A standard MIME type  |
|                       |                       | describing the format |
|                       |                       | of the contents       |
|                       |                       |                       |
|                       |                       | Default:              |
|                       |                       | binary/octet-stream   |
|                       |                       |                       |
|                       |                       | Valid Values:         |
|                       |                       | MIME types            |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| Expect                | string                | When the application  |
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
|                       |                       | no longer cacheable   |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| x-amz-meta-\*         | string                | Headers starting with |
|                       |                       | this prefix are       |
|                       |                       | user-defined          |
|                       |                       | metadata, each of     |
|                       |                       | which is stored and   |
|                       |                       | returned as a set of  |
|                       |                       | key-value pairs.      |
|                       |                       | Zenko Enterprise does |
|                       |                       | not validate or       |
|                       |                       | interpret             |
|                       |                       | user-defined          |
|                       |                       | metadata. Within the  |
|                       |                       | PUT request header,   |
|                       |                       | the user-defined      |
|                       |                       | metadata is limited   |
|                       |                       | in size to 2 KB.      |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| x-amz-meta-scal-locat | string                | Setting this heading  |
| ion-constraint        |                       | with a                |
|                       |                       | locationConstraint on |
|                       |                       | a PUT request defines |
|                       |                       | where the object will |
|                       |                       | be saved. If no       |
|                       |                       | header is sent with a |
|                       |                       | PUT object request,   |
|                       |                       | the location          |
|                       |                       | constraint of the     |
|                       |                       | bucket will determine |
|                       |                       | where the data is     |
|                       |                       | saved. If the bucket  |
|                       |                       | has no location       |
|                       |                       | constraint, the       |
|                       |                       | endpoint of the PUT   |
|                       |                       | request will be used  |
|                       |                       | to determine          |
|                       |                       | location. Within the  |
|                       |                       | PUT request header,   |
|                       |                       | the user-defined      |
|                       |                       | metadata is limited   |
|                       |                       | in size to 2 KB.      |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: The      |
|                       |                       | value must be a       |
|                       |                       | location constraint   |
|                       |                       | listed in             |
|                       |                       | locationConfig.json.  |
+-----------------------+-----------------------+-----------------------+
| x-amz-website         | string                | When a bucket is      |
| -redirect-location    |                       | configured as a       |
|                       |                       | website, this         |
|                       |                       | metadata can be set   |
|                       |                       | on the object so the  |
|                       |                       | website endpoint will |
|                       |                       | evaluate the request  |
|                       |                       | for the object as a   |
|                       |                       | 301 redirect to       |
|                       |                       | another object in the |
|                       |                       | same bucket or an     |
|                       |                       | external URL.         |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: The      |
|                       |                       | value must be         |
|                       |                       | prefixed by, "/",     |
|                       |                       | "http://" or          |
|                       |                       | "https://". The       |
|                       |                       | length of the value   |
|                       |                       | is limited to 2 KB.   |
+-----------------------+-----------------------+-----------------------+

In addition, access control-related headers can be used with this
operation. By default, all objects are private: only the owner has full
control. When adding a new object, it is possible to grant permissions
to individual accounts or predefined groups. These permissions are then
used to create the Access Control List (ACL) on the object.

*Specifying a Canned ACL*

Zenko Enterprise supports a set of canned ACLs, each of which has a predefined set of
grantees and permissions.

+-----------------------+-----------------------+-----------------------+
| Header                | Type                  | Description           |
+=======================+=======================+=======================+
| x-amz-acl             | string                | The canned ACL to     |
|                       |                       | apply to the bucket   |
|                       |                       | you are creating      |
|                       |                       |                       |
|                       |                       | Default: ``private``  |
|                       |                       |                       |
|                       |                       | Valid Values:         |
|                       |                       | ``private`` \|        |
|                       |                       | ``public-read`` \|    |
|                       |                       | ``public-read-write`` |
|                       |                       | \|                    |
|                       |                       | ``authenticated-read` |
|                       |                       | `                     |
|                       |                       | \|                    |
|                       |                       | ``bucket-owner-read`` |
|                       |                       | \|                    |
|                       |                       | ``bucket-owner-full-c |
|                       |                       | ontrol``              |
|                       |                       |                       |
|                       |                       | Constrains: None      |
+-----------------------+-----------------------+-----------------------+

*Explicitly Specifying Access Permissions*

A set of headers is available for explicitly granting access permissions
to specific Zenko Enterprise accounts or groups, each of which maps to specific
permissions Zenko Enterprise supports in an ACL.

In the header value, specify a list of grantees who get the specific
permission.

+-----------------------+-----------------------+-----------------------+
| Header                | Type                  | Description           |
+=======================+=======================+=======================+
| x-amz-grant-read      | string                | Allows grantee to     |
|                       |                       | read the object data  |
|                       |                       | and its metadata      |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| x-amz-grant-read-acp  | string                | Allows grantee to     |
|                       |                       | read the object ACL   |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| x-amz-grant-write-acp | string                | Allows grantee to     |
|                       |                       | write the ACL for the |
|                       |                       | applicable object     |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| x-amz-grant-full-cont | string                | Allows grantee the    |
| rol                   |                       | READ, READ_ACP, and   |
|                       |                       | WRITE_ACP permissions |
|                       |                       | on the object         |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+

Each grantee is specified as a ``type=value`` pair, where the type can
be one any one of the following:

-  ``emailAddress`` (if value specified is the email address of an
   account)
-  ``id`` (if value specified is the canonical user ID of an account)
-  ``uri`` (if granting permission to a predefined group)

For example, the following x-amz-grant-read header grants list objects
permission to the accounts identified by their email addresses:

.. code::

   x-amz-grant-read: emailAddress="xyz@scality.com", emailAddress="abc@scality.com"

Responses
---------

**Response Headers**

The PUT Object operation uses the x-amz-version-id response header in
addition to response headers that are common to all operations (refer to
:ref:`Common Response Headers`).

+------------------+--------+------------------------+
| Header           | Type   | Description            |
+==================+========+========================+
| x-amz-version-id | string | Version of the object. |
+------------------+--------+------------------------+

**Response Elements**

The PUT Object operation does not return response elements.

Examples
--------

**Upload an Object**

*Request Sample*

Places the ``my-document.pdf`` object in the ``myDocsBucket`` bucket:

.. code::

   PUT /my-document.pdf HTTP/1.1
   Host: myDocsBucket.s3.scality.com
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Authorization: {{authorizationString}}
   Content-Type: text/plain
   Content-Length: 11434
   x-amz-meta-author: CharlieParker
   Expect: 100-continue
   [11434 bytes of object data]

*Response Sample with Versioning Suspended*

.. code::

   HTTP/1.1 100 Continue

   HTTP/1.1 200 OK
   x-amz-id-2: LriYPLdmOdAiIfgSm/F1YsViT1LW94/xUQxMsF7xiEb1a0wiIOIxl+zbwZ163pt7
   x-amz-request-id: 0A49CE4060975EAC
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   ETag: "1b2cf535f27731c974343645a3985328"
   Content-Length: 0
   Connection: close
   Server: ScalityS3

*Response Sample with Versioning Enabled*

.. code::

   HTTP/1.1 100 Continue

   HTTP/1.1 200 OK
   x-amz-id-2: LriYPLdmOdAiIfgSm/F1YsViT1LW94/xUQxMsF7xiEb1a0wiIOIxl+zbwZ163pt7
   x-amz-request-id: 0A49CE4060975EAC
   x-amz-version-id: 43jfkodU8493jnFJD9fjj3HHNVfdsQUIFDNsidf038jfdsjGFDSIRp
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   ETag: "fbacf535f27731c9771645a39863328"
   Content-Length: 0
   Connection: close
   Server: ScalityS3

**Upload an Object (Specify Access Permission Explicitly)**

*Request Sample: Uploading an Object and Specifying Access Permissions Explicitly*

The request sample stores the file TestObject.txtin the bucket
myDocsBucket. The request specifies various ACL headers to grant
permission to accounts specified using canonical user ID and email
address.

.. code::

   PUT TestObject.txt HTTP/1.1
   Host: myDocsBucket.s3.scality.com
   x-amz-date: Fri, 13 Apr 2012 05:40:14 GMT
   Authorization: {{authorizationString}}
   x-amz-grant-write-acp: id=8a6925ce4adf588a4532142d3f74dd8c71fa124ExampleCanonicalUserID
   x-amz-grant-full-control: emailAddress="ExampleUser@scality.com"
   x-amz-grant-write: emailAddress="ExampleUser1@scality.com", emailAddress="ExampleUser2@scality.com"
   Content-Length: 300
   Expect: 100-continue
   Connection: Keep-Alive
   ...Object data in the body...

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: RUxG2sZJUfS+ezeAS2i0Xj6w/ST6xqF/8pFNHjTjTrECW56SCAUWGg+7QLVoj1GH
   x-amz-request-id: 8D017A90827290BA
   Date: Fri, 13 Apr 2012 05:40:25 GMT
   ETag: "dd038b344cf9553547f8b395a814b274"
   Content-Length: 0
   Server: ScalityS3

**Upload an Object (Specify Access Permission Using Canned ACL)**

*Request Sample: Using a Canned ACL to Set Access Permissions*

The request sample stores the file TestObject.txt in the bucket
myDocsBucket. The request uses an x-amz-acl header to specify a canned
ACL to grant READ permission to the public.

.. code::

   ...Object data in the body...
   PUT TestObject.txt HTTP/1.1
   Host: myDocsBucket.s3.scality.com
   x-amz-date: Fri, 13 Apr 2012 05:54:57 GMT
   x-amz-acl: public-read
   Authorization: {{authorizationString}}
   Content-Length: 300
   Expect: 100-continue
   Connection: Keep-Alive
   ...Object data in the body...

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Yd6PSJxJFQeTYJ/3dDO7miqJfVMXXW0S2Hijo3WFs4bz6oe2QCVXasxXLZdMfASd
   x-amz-request-id: 80DF413BB3D28A25
   Date: Fri, 13 Apr 2012 05:54:59 GMT
   ETag: "dd038b344cf9553547f8b395a814b274"
   Content-Length: 0
   Server: ScalityS3
