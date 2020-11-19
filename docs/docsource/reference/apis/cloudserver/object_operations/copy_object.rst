.. _Copy Object:

Copy Object
===========

Creates a copy of an object stored by XDM.

.. note::

   To copy an object greater than 5 GB, use the :ref:`Upload Part - Copy` API.

All copy requests must be authenticated. Additionally, you must have read access
to the source object and write access to the destination bucket. Both the region
you want to copy the object from and the region you want to copy the object to
must be enabled for your account.

A copy request might return an error when XDM   receives the copy request
or while XDM   is copying the files. If the error occurs before the copy
operation starts, you receive a standard S3 error. If the error occurs
during the copy operation, the error response is embedded in the ``200 OK``
response. This means that a ``200 OK`` response can contain either a success or
an error. Design your application to parse the contents of the response and
handle it appropriately.

If the copy is successful, you receive a response with information about the
copied object.

Metadata
--------

When copying an object, you can preserve all metadata (default) or specify new
metadata. However, the ACL is not preserved and is set to private for the user
making the request. To override the default ACL setting, specify a new ACL when
generating a copy request. For more information, see `Managing Access with ACLs`_.

To specify whether to copy the object metadata from the source object or to
replace it with metadata provided in the request, add the
x-amz-metadata-directive header. Grant permissions using the
s3:x-amz-metadata-directive condition key to enforce metadata behaviors when
objects are uploaded. For more information, see `Amazon S3 Condition Keys`_. For
a complete list of Amazon S3-specific condition keys, see Actions, Resources,
and Condition Keys for Amazon S3.

x-amz-copy-source-if Headers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To copy an object only under certain conditions, such as when the Etag matches
or the object was modified before or after a specified date, use the
following request parameters:

* ``x-amz-copy-source-if-match``

* ``x-amz-copy-source-if-none-match``

* ``x-amz-copy-source-if-unmodified-since``

* ``x-amz-copy-source-if-modified-since``

If both the ``x-amz-copy-source-if-match`` and
``x-amz-copy-source-if-unmodified-since`` headers are present in the request and
evaluate as follows, XDM   returns ``200 OK`` and copies the data:

* ``x-amz-copy-source-if-match`` condition evaluates to ``true``.

* ``x-amz-copy-source-if-unmodified-since`` condition evaluates to ``false``.

If both the ``x-amz-copy-source-if-none-match`` and
``x-amz-copy-source-if-modified-since`` headers are present in the request and
evaluate as follows, XDM   returns the ``412 Precondition Failed`` response
code:

* ``x-amz-copy-source-if-none-match`` condition evaluates to ``false``.

* ``x-amz-copy-source-if-modified-since`` condition evaluates to ``true``.

.. note::

   All headers with the ``x-amz-`` prefix, including ``x-amz-copy-source``, must
   be signed.

Encryption
----------

The source object being copied can be encrypted or unencrypted. It can be
encrypted on the server side using Scality-managed encryption keys
(SSE-S3). With server-side encryption, XDM   encrypts the data as it
writes it to disk and decrypts the data when you access it. Server-side
encryption can also be requested for the target object, regardless of whether the
source object was encrypted.

ACL-Specific Request Headers
----------------------------

When copying an object, you can grant ACL-based permissions using headers. By
default, all objects are private. Only the owner has full access control. When
adding a new object, you can grant permissions to individual XDM  
accounts or to predefined groups defined by S3. These permissions are added
to the ACL on the object. For more, see `Access Control List (ACL) Overview`_
and `Managing ACLs Using the REST API`_.

Storage Class Options
---------------------

You cannot use the CopyObject operation to change the storage class. S3
Connector does not implement or recognize storage classes. It accepts the
STANDARD class if the client sets it, but it maps to no storage class.

Versioning
----------

By default, ``x-amz-copy-source`` identifies the current version of an object to
copy. If the current version is a delete marker, XDM   behaves as if the
object were deleted. To copy a different version, use the versionId subresource.

If you enable versioning on the target bucket, XDM   generates a unique
version ID for the object being copied. This version ID is different from the
source object's version ID. XDM   returns the copied object's version ID
in the x-amz-version-id response header.

If you do not enable versioning or suspend it on the target bucket, XDM  
generates a null version ID.

The following operations are related to CopyObject:

* :ref:`Put Object`
* :ref:`Get Object`

For more, see `Copying Objects`_.

Request Syntax
--------------

.. code::
   
   PUT /Key+ HTTP/1.1
   Host: bucket.s3.example.com
   x-amz-acl: ACL
   Cache-Control: CacheControl
   Content-Disposition: ContentDisposition
   Content-Encoding: ContentEncoding
   Content-Language: ContentLanguage
   Content-Type: ContentType
   x-amz-copy-source: CopySource
   x-amz-copy-source-if-match: CopySourceIfMatch
   x-amz-copy-source-if-modified-since: CopySourceIfModifiedSince
   x-amz-copy-source-if-none-match: CopySourceIfNoneMatch
   x-amz-copy-source-if-unmodified-since: CopySourceIfUnmodifiedSince
   Expires: Expires
   x-amz-grant-full-control: GrantFullControl
   x-amz-grant-read: GrantRead
   x-amz-grant-read-acp: GrantReadACP
   x-amz-grant-write-acp: GrantWriteACP
   x-amz-metadata-directive: MetadataDirective
   x-amz-tagging-directive: TaggingDirective
   x-amz-server-side-encryption: ServerSideEncryption
   x-amz-storage-class: STANDARD
   x-amz-website-redirect-location: WebsiteRedirectLocation
   x-amz-tagging: Tagging
   x-amz-object-lock-mode: ObjectLockMode
   x-amz-object-lock-retain-until-date: ObjectLockRetainUntilDate
   x-amz-object-lock-legal-hold: ObjectLockLegalHoldStatus

URI Request Parameters
----------------------

The request uses the following URI parameters.

Bucket

    The name of the destination bucket.

    Required
    
Cache-Control

    Specifies caching behavior along the request/reply chain.
    
Content-Disposition

    Specifies presentational information for the object.

Content-Encoding

    Specifies what content encodings have been applied to the object and thus
    what decoding mechanisms must be applied to obtain the media-type referenced
    by the Content-Type header field.

Content-Language

    The language the content is in.
    
Content-Type

    A standard MIME type describing the format of the object data.
    
Expires

    The date and time at which the object is no longer cacheable.
    
Key

    The key of the destination object.

    Minimum length of 1

    Required
    
x-amz-acl

    The canned ACL to apply to the object.

    Valid Values: ``private`` | ``public-read`` | ``public-read-write`` | ``authenticated-read``
    | ``aws-exec-read`` | ``bucket-owner-read`` | ``bucket-owner-full-control``

x-amz-copy-source

    The name of the source bucket and key name of the source object, separated
    by a slash (/). Must be URL-encoded.

    Pattern: ``\/.+\/.+``

    Required
    
x-amz-copy-source-if-match

    Copies the object if its entity tag (ETag) matches the specified tag.
    
x-amz-copy-source-if-modified-since

    Copies the object if it has been modified since the specified time.

x-amz-copy-source-if-none-match

    Copies the object if its entity tag (ETag) is different than the specified
    ETag.
    
x-amz-copy-source-if-unmodified-since

    Copies the object if it hasn't been modified since the specified time.

x-amz-grant-full-control

    Gives the grantee READ, READ_ACP, and WRITE_ACP permissions on the object.

x-amz-grant-read

    Allows grantee to read the object data and its metadata.

x-amz-grant-read-acpe

    Allows grantee to read the object ACL.
    
x-amz-grant-write-acp

    Allows grantee to write the ACL for the applicable object.
    
x-amz-metadata-directive

    Specifies whether the metadata is copied from the source object or replaced
    with metadata provided in the request.

    Valid Values: ``COPY`` | ``REPLACE``
    
x-amz-object-lock-legal-hold

    Specifies whether to apply a legal hold to the copied object.

    Valid Values: ``ON`` | ``OFF``
    
x-amz-object-lock-mode

    The object lock mode to apply to the copied object.

    Valid Values: ``GOVERNANCE`` | ``COMPLIANCE``
    
x-amz-object-lock-retain-until-date

    The date and time the copied object's object lock shall expire.


x-amz-storage-class

    The type of storage to use for the object. Defaults to ``STANDARD``.

    Valid Values: ``STANDARD``

x-amz-tagging

    The tag set for the object destination object. This value must be used with
    ``TaggingDirective``.  The tag set must be encoded as URL Query parameters.

x-amz-tagging-directive

    Specifies whether the object's tag-set is copied from the source object or
    replaced with the tag set provided in the request.

    Valid Values: ``COPY`` | ``REPLACE``
    
x-amz-website-redirect-location

    If the bucket is configured as a website, this request parameter redirects
    requests for this object to another object in the same bucket or to an
    external URL. XDM   stores the value of this header in the object
    metadata.

Request Body
~~~~~~~~~~~~

This request does not have a request body.

Response Syntax
---------------

.. code::
   
   HTTP/1.1 200
   x-amz-expiration: Expiration
   x-amz-copy-source-version-id: CopySourceVersionId
   x-amz-version-id: VersionId
   x-amz-server-side-encryption: ServerSideEncryption
   <?xml version="1.0" encoding="UTF-8"?>
   <CopyObjectResult>
      <ETag>string</ETag>
      <LastModified>timestamp</LastModified>
   </CopyObjectResult>

Response Elements
-----------------

If the action is successful, the service sends back an HTTP 200 response.

The response returns the following HTTP headers.

x-amz-copy-source-version-id

    Version of the copied object in the destination bucket.

x-amz-expiration

    If the object expiration is configured, the response includes this header.

x-amz-request-charged

    If present, indicates that the requester was successfully charged for the
    request.

    Valid Values: requester

x-amz-server-side-encryption

    The server-side encryption algorithm used when storing this object in S3
    Connector (for example, AES256, aws:kms).

    Valid Values: AES256 | aws:kms

x-amz-server-side-encryption-context

    Specifies the AWS KMS Encryption Context to use for object encryption. The
    value of this header is a base64-encoded UTF-8 string holding JSON with the
    encryption context key-value pairs.

x-amz-version-id

    Version ID of the newly created copy.

S3 Cponnector returns the following data in XML format:

CopyObjectResult

    Root-level tag for the CopyObjectResult parameters.

    Required
    
ETag

    Returns the new object's ETag. The ETag only reflects changes to an object's
    contents, not to its metadata. For a successfully copied object, the source
    and destination ETags are identical.

    Type: String

LastModified

    Returns the date that the object was last modified.

    Type: Timestamp

Examples
--------

Sample Request
~~~~~~~~~~~~~~

This example copies my-image.jpg into the bucket bucket, with the key name my-second-image.jpg.

.. code::
   
    PUT /my-second-image.jpg HTTP/1.1
    Host: bucket.s3.<Region>.example.com
    Date: Wed, 28 Oct 2009 22:32:00 GMT
    x-amz-copy-source: /bucket/my-image.jpg
    Authorization: authorization string


Sample Response
~~~~~~~~~~~~~~~

.. code::
   
   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-copy-source-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   x-amz-version-id: QUpfdndhfd8438MNFDN93jdnJFkdmqnh893
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Connection: close
   Server: S3.example.com

   <CopyObjectResult>
      <LastModified>2009-10-28T22:32:00</LastModified>
      <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   <CopyObjectResult>


Sample Request: Copying a Specified Version of an Object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following request copies the my-image.jpg key with the specified version ID,
copies it into the bucket bucket, and gives it the my-second-image.jpg key.

.. code::
   
   PUT /my-second-image.jpg HTTP/1.1
   Host: bucket.s3.<Region>.example.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   x-amz-copy-source: /bucket/my-image.jpg?versionId=3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   Authorization: authorization string


Successful Response: Copying a Versioned Object to a Version-Enabled Bucket
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following response shows an object was copied to a target bucket with
versioning enabled.

.. code::
   
    HTTP/1.1 200 OK
    x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
    x-amz-request-id: 318BC8BC148832E5
    x-amz-version-id: QUpfdndhfd8438MNFDN93jdnJFkdmqnh893
    x-amz-copy-source-version-id: 09df8234529fjs0dfi0w52935029wefdj
    Date: Wed, 28 Oct 2009 22:32:00 GMT
    Connection: close
    Server: S3.example.com

    <?xml version="1.0" encoding="UTF-8"?>
    <CopyObjectResult>
      <LastModified>2009-10-28T22:32:00</LastModified>
      <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   <CopyObjectResult>


Success Response: Copying a Versioned Object to a Version-Suspended Bucket
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following response shows that an object was copied to a target bucket where
versioning is suspended. The VersionId parameter does not appear.

.. code::
   
   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-copy-source-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Connection: close
   Server: S3.example.com

   <?xml version="1.0" encoding="UTF-8"?>
    <CopyObjectResult>
      <LastModified>2009-10-28T22:32:00</LastModified>
      <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   <CopyObjectResult>


Example: Copy from an Unencrypted Object to a Server-Side Encrypted Object Using Customer-Provided Encryption Keys
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following example specifies the HTTP PUT header to copy an unencrypted
object to an object encrypted with server-side encryption with customer-provided
encryption keys (SSE-C).

.. code::
   
   PUT /exampleDestinationObject HTTP/1.1
   Host: example-destination-bucket.s3.<Region>.example.com
   x-amz-metadata-directive: metadata_directive
   x-amz-copy-source: /example_source_bucket/exampleSourceObject
   x-amz-copy-source-if-match: etag
   x-amz-copy-source-if-none-match: etag
   x-amz-copy-source-if-unmodified-since: time_stamp
   x-amz-copy-source-if-modified-since: time_stamp

   <request metadata>

   Authorization: authorization string
   Date: date

Example: Copy from an Object Encrypted with SSE-C to an Object Encrypted with SSE-C
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This example shows the HTTP PUT header written to copy an object encrypted with
server-side encryption using customer-provided encryption keys to an object
encrypted with server-side encryption with customer-provided encryption keys for
key rotation.

.. code::

   PUT /exampleDestinationObject HTTP/1.1
   Host: example-destination-bucket.s3.<Region>.example.com
   x-amz-metadata-directive: metadata_directive
   x-amz-copy-source: /source_bucket/sourceObject
   x-amz-copy-source-if-match: etag
   x-amz-copy-source-if-none-match: etag
   x-amz-copy-source-if-unmodified-since: time_stamp
   x-amz-copy-source-if-modified-since: time_stamp

   <request metadata>
   
   Authorization: authorization string
   Date: date


.. _Managing Access with ACLs: https://docs.aws.amazon.com/AmazonS3/latest/dev/S3_ACLs_UsingACLs.html

.. _Amazon S3 Condition Keys: https://docs.aws.amazon.com/AmazonS3/latest/dev/amazon-s3-policy-keys.html

.. _Protecting data using server-side encryption: https://docs.aws.amazon.com/AmazonS3/latest/dev/serv-side-encryption.html

.. _Access Control List (ACL) Overview: https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html

.. _Managing ACLs Using the REST API: https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-using-rest-api.html

.. _Copying Objects: https://docs.aws.amazon.com/AmazonS3/latest/dev/CopyingObjectsExamples.html
