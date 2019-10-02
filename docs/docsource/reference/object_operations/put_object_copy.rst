.. _PUT Object - Copy:

PUT Object - Copy
=================

An implementation of the PUT operation, PUT Object - Copy creates a copy
of an object that is already stored. On internal data backends,
performing a PUT copy operation is the same as performing GET and then
PUT. On external cloud data backends, data is directly copied to the
designated backend. Adding the ``x-amz-copysource`` request header
causes the PUT operation to copy the source object into the destination
bucket.

By default, ``x-amz-copy-source`` identifies the current version of an
object to copy. To copy a different version, use the
``versionId`` subresource.

When copying an object, it is possible to preserve most of the metadata
(default behavior) or specify new metadata with the
``x-amz-metadata-directive`` header. In the case of copying an object to
a specific location constraint, the metadata directive must be set to
REPLACE and the location constraint header specified. Otherwise, the
default location for the object copied is the location constraint of the
destination bucket.

The ACL, however, is not preserved and is set to private for the user
making the request if no other ACL preference is sent with the request.

All copy requests must be authenticated and cannot contain a message
body. Additionally, READ access is required for the source object, and
WRITE access is required for the destination bucket.

To copy an object only under certain conditions, such as whether the
ETag matches or whether the object was modified before or after a
specified date, use the request headers
x-amz-copy-source-if-match, x-amz-copy-source-if-none-match, 
x-amz-copy-source-if-unmodified-since, or x-amz-copy-source-if-modified-since.

.. warning::

  When using v4 Authentication all headers prefixed with x-amz- must be
  signed, including x-amz-copy-source.

The source object being copied can be encrypted or unencrypted and the
destination object can be stored encrypted or unencrypted. If bucket
encryption is activated on the source bucket, the source object will
remain encrypted in its original location. If bucket encryption is
activated on the destination bucket, the destination object will be
encrypted. If bucket encryption is not activated on the destination
bucket, the object copy will be stored unencrypted

If the copy is successful, a response will generate that contains
information about the copied object.

Access Permissions
------------------

When copying an object, it is possible to specify the accounts or groups
that should be granted specific permissions on the new object. There are
two ways to grant the permissions using the request headers:

-  Specify a canned ACL using the x-amz-acl request header.
-  Specify access permissions explicitly using thex-amz-grant-read,
   x-amz-grant-read-acp, x-amz-grant-write-acp, and
   x-amz-grant-full-control headers. These headers map to the set of
   permissions Zenko supports in an ACL.

.. note::

  Access permissions can be explicitly specified or they can be enacted
  via a canned ACL. Both methods, however, cannot be deployed at the same
  time.

Requests
--------

Syntax
~~~~~~

The Request Syntax that follows is for sending the ACL in the request
body. If headers are used to specify the permissions for the object, the
ACL cannot be sent in the request body (refer to :ref:`Common Request Headers` for a list of available headers).

.. code::

   PUT /destinationObject HTTP/1.1
   Host: destinationBucket.s3.amazonaws.com
   x-amz-copy-source: /source_bucket/sourceObject
   x-amz-metadata-directive: metadata_directive
   x-amz-copy-source-if-match: etag
   x-amz-copy-source-if-none-match: etag
   x-amz-copy-source-if-unmodified-since: time_stamp
   x-amz-copy-source-if-modified-since: time_stamp
   <request metadata>
   Authorization: {{authorizationString}}
   Date: date

.. note::

  The syntax shows only a representative sample of the possible request
  headers. For a complete list, refer to :ref:`Common Request Headers`.

Parameters
~~~~~~~~~~

The PUT Object - Copy operation does not use request parameters.

Headers
~~~~~~~

The PUT Object - Copy operation can use the following optional request headers
in addition to those that are common to all operations (see :ref:`Common Request
Headers`).

.. tabularcolumns:: X{0.45\textwidth}X{0.10\textwidth}X{0.40\textwidth}
.. table::
   :class: longtable

   +-------------------------------------------+--------+------------------------------------------+
   | Header                                    | Type   | Description                              |
   +===========================================+========+==========================================+
   | ``x-amz-copy-source``                     | string | The name of the source bucket and key    |
   |                                           |        | name of the source object, separated by  |
   |                                           |        | a slash (/). If versioning is enabled,   |
   |                                           |        | this will copy the latest version of the |
   |                                           |        | key by default. To specify another       |
   |                                           |        | version, append ?versionId={{version     |
   |                                           |        | id}} after the object key.               |
   |                                           |        |                                          |
   |                                           |        | **Default:** None                        |
   |                                           |        |                                          |
   |                                           |        | **Constraints:** This string must be     |
   |                                           |        | URL-encoded. Additionally, the source    |
   |                                           |        | bucket must be valid and READ access to  |
   |                                           |        | the valid source object is required.     |
   +-------------------------------------------+--------+------------------------------------------+
   | ``x-amz-metadata-directive``              | string | Specifies whether the metadata is copied |
   |                                           |        | from the source object or replaced with  |
   |                                           |        | metadata provided in the request.        |
   |                                           |        |                                          |
   |                                           |        | If copied, the metadata, except for the  |
   |                                           |        | version ID, remains unchanged. In        |
   |                                           |        | addition, the server-side-encryption     |
   |                                           |        | storage-class, and website-redirect-\    |
   |                                           |        | location metadata from the source is not |
   |                                           |        | copied. If you specify this metadata     |
   |                                           |        | explicitly in the copy request, Zenko    |
   |                                           |        | adds this metadata to the resulting      |
   |                                           |        | object. If you specify headers in the    |
   |                                           |        | request specifying any user-defined      |
   |                                           |        | metadata, the connector ignores these    |
   |                                           |        | headers. To use new user-defined         |
   |                                           |        | metadata, REPLACE must be selected.      |
   |                                           |        |                                          |
   |                                           |        | If replaced, all original metadata is    |
   |                                           |        | replaced by the specified metadata.      |
   |                                           |        |                                          |
   |                                           |        | **Default:** COPY                        |
   |                                           |        |                                          |
   |                                           |        | **Valid Values:** COPY, REPLACE          |
   |                                           |        |                                          |
   |                                           |        | **Constraints:** Values other than COPY  |
   |                                           |        | or REPLACE result in an immediate 400-   |
   |                                           |        | based error response. An object cannot be|
   |                                           |        | copied to itself unless the              |
   |                                           |        | MetadataDirective header is specified    |
   |                                           |        | and its value set to REPLACE (or, at the |
   |                                           |        | least, some metadata is changed, such as |
   |                                           |        | storage class).                          |
   +-------------------------------------------+--------+------------------------------------------+
   | ``x-amz-copy-source-if-match``            | string | Copies the object if its entity tag      |
   |                                           |        | (ETag) matches the specified tag;        |
   |                                           |        | otherwise, the request returns a 412     |
   |                                           |        | HTTP status code error (failed           |
   |                                           |        | precondition).                           |
   |                                           |        |                                          |
   |                                           |        | **Default:** None                        |
   |                                           |        |                                          |
   |                                           |        | **Constraints:** Can be used with        |
   |                                           |        | x-amz-copy-source-if-unmodified-since,   |
   |                                           |        | but cannot be used with other            |
   |                                           |        | conditional copy headers.                |
   +-------------------------------------------+--------+------------------------------------------+
   | ``x-amz-copy-source-if-none-match``       | string | Copies the object if its entity tag      |
   |                                           |        | (ETag) is different than the specified   |
   |                                           |        | ETag; otherwise, the request returns a   |
   |                                           |        | 412 HTTP status code error (failed       |
   |                                           |        | precondition).                           |
   |                                           |        |                                          |
   |                                           |        | **Default:** None                        |
   |                                           |        |                                          |
   |                                           |        | **Constraints:** Can be used with        |
   |                                           |        | x-amz-copy-source-if-modified-since,     |
   |                                           |        | but cannot be used with other            | 
   |                                           |        | conditional copy headers.                |
   +-------------------------------------------+--------+------------------------------------------+
   | ``x-amz-copy-source-if-unmodified-since`` | string | Copies the object if it hasn't been      |
   |                                           |        | modified since the specified time;       |
   |                                           |        | otherwise, the request returns a 412     |
   |                                           |        | HTTP status code error (failed           |
   |                                           |        | precondition).                           |
   |                                           |        |                                          |
   |                                           |        | **Default:** None                        |
   |                                           |        |                                          |
   |                                           |        | **Constraints:** This must be a valid    |
   |                                           |        | HTTP date. This header can be used with  |
   |                                           |        | x-amz-copy-source-if-match, but cannot   |
   |                                           |        | be used with other conditional copy      |
   |                                           |        | headers.                                 |
   +-------------------------------------------+--------+------------------------------------------+
   | ``x-amz-copy-source-if-modified-since``   | string | Copies the object if it has been         |
   |                                           |        | modified since the specified time;       |
   |                                           |        | otherwise, the request returns a 412     |
   |                                           |        | HTTP status code error (failed           |
   |                                           |        | condition).                              |
   |                                           |        |                                          |
   |                                           |        | **Default:** None                        |
   |                                           |        |                                          |
   |                                           |        | **Constraints:** This must be a valid    |
   |                                           |        | HTTP date. This header can be used with  |
   |                                           |        | x-amz-copy-source-if-none-match, but     |
   |                                           |        | cannot be used with other conditional    |
   |                                           |        | copy headers.                            |
   +-------------------------------------------+--------+------------------------------------------+
   | ``x-amz-storage-class``                   | enum   | The default storage class is “Standard.” |
   |                                           |        | Currently, Zenko only suports one level  |
   |                                           |        | level of storage class.                  |
   |                                           |        |                                          |
   |                                           |        | **Default:** Standard                    |
   |                                           |        |                                          |
   |                                           |        | **Valid Values:** STANDARD, STANDARD_IA, |
   |                                           |        | REDUCED_REDUNDANCY                       |
   +-------------------------------------------+--------+------------------------------------------+

Note the following additional considerations about the preceding request
headers:

#. If both of thex-amz-copy-source-if-match and
   x-amz-copy-source-if-unmodified-since headers are present in the request as
   follows, Zenko returns 200 OK and copies the data:

   .. code::

      x-amz-copy-source-if-match condition evaluates to true, and;
      x-amz-copy-source-if-unmodified-since condition evaluates to false;

#. If both of the x-amz-copy-source-if-none-match and
   x-amz-copy-source-if-modified-since headers are present in the request as
   follows, Zenko returns a 412 Precondition Failed response code:

   .. code::

      x-amz-copy-source-if-none-match condition evaluates to false, and;
      x-amz-copy-source-if-modified-since condition evaluates to true

Additionally, the following access control-related (ACL) headers can be used
with the PUT Object - Copy operation. By default, all objects are private; only
the owner has full access control. When adding a new object, it is possible to
grant permissions to individual AWS accounts or predefined groups defined by
Amazon S3. These permissions are then added to the Access Control List (ACL) on
the object. For more information, refer to :ref:`ACL (Access Control List)`.

Specifying a Canned ACL
```````````````````````

Zenko supports a set of predefined ACLs, each of which has a predefined set of
grantees and permissions.

To grant access permissions by specifying canned ACLs, use the x-amz-acl header
and specify the canned ACL name as its value.

.. note::

  Other access control specific headers cannot be used when the x-amz-acl
  header is in use.

.. tabularcolumns:: X{0.15\textwidth}X{0.10\textwidth}X{0.70\textwidth}
.. table::

   +---------------+--------+------------------------------------------------------+
   | Header        | Type   | Description                                          |
   +===============+========+======================================================+
   | ``x-amz-acl`` | string | The canned ACL to apply to the object.               |
   |               |        |                                                      |
   |               |        | **Default:** ``private``                             |
   |               |        |                                                      |
   |               |        | **Valid Values:** ``private`` \| ``public-read`` \|  |
   |               |        | ``public-read-write`` \| ``aws-exec-read`` \|        |
   |               |        | ``authenticated-read`` \| ``bucket-owner-read`` \|   |
   |               |        | ``bucket-owner-full-control``                        |
   |               |        |                                                      |
   |               |        | **Constraints:** None                                |
   +---------------+--------+------------------------------------------------------+

Explicitly Specifying Grantee Access Permissions
````````````````````````````````````````````````

A set of headers is available for explicitly granting access permissions
to specific accounts or groups.

.. note::

  Each of the x-amz-grant-permission headers maps to specific permissions
  that Zenko supports in an ACL. Please also note that the use of any of these
  ACL-specific headers negates the use of the x-amz-acl header to set a
  canned ACL.

.. tabularcolumns:: X{0.30\textwidth}X{0.10\textwidth}X{0.55\textwidth}
.. table::

   +------------------------------+--------+----------------------------------+
   | Header                       | Type   | Description                      |
   +==============================+========+==================================+
   | ``x-amz-grant-read``         | string | Allows grantee to read the       |
   |                              |        | object data and its metadata.    |
   |                              |        |                                  |
   |                              |        | **Default:** None                |
   |                              |        |                                  |
   |                              |        | **Constraints:** None            |
   +------------------------------+--------+----------------------------------+
   | ``x-amz-grant-write``        | string | Not applicable. This applies     |
   |                              |        | only when granting access        |
   |                              |        | permissions on a bucket.         |
   |                              |        |                                  |
   |                              |        | **Default:** None                |
   |                              |        |                                  |
   |                              |        | **Constraints:** None            |
   +------------------------------+--------+----------------------------------+
   | ``x-amz-grant-read-acp``     | string | Allows grantee to read the       |
   |                              |        | object ACL.                      |
   |                              |        |                                  |
   |                              |        | **Default:** None                |
   |                              |        |                                  |
   |                              |        | **Constraints:** None            |
   +------------------------------+--------+----------------------------------+
   | ``x-amz-grant-write-acp``    | string | Allows grantee to write the ACL  |
   |                              |        | for the applicable object.       |
   |                              |        |                                  |
   |                              |        | **Default:** None                |
   |                              |        |                                  |
   |                              |        | **Constraints:** None            |
   +------------------------------+--------+----------------------------------+
   | ``x-amz-grant-full-control`` | string | Allows grantee the READ,         |
   |                              |        | READ_ACP, and WRITE_ACP          |
   |                              |        | permissions on the object.       |
   |                              |        |                                  |
   |                              |        | **Default:** None                |
   |                              |        |                                  |
   |                              |        | **Constraints:** None            |
   +------------------------------+--------+----------------------------------+

For each header, the value is a comma-separated list of one or more grantees.
Each grantee is specified as a ``type=value`` pair, where the type can be
any one of the following:

-  ``emailAddress`` (if the value specified is the email address of an
   account)
-  ``id`` (if the value specified is the canonical user ID of an account)
-  ``uri`` (if granting permission to a predefined group)

For example, the following x-amz-grant-read header grants list objects
permission to two accounts identified by their email addresses:

.. code::

   x-amz-grant-read:  emailAddress="xyz@scality.com", emailAddress="abc@scality.com"

Elements
~~~~~~~~

The implementation of the operation does not use request Parameters.

Responses
---------

Headers
~~~~~~~

The PUT Object - Copy operation can include the
following response headers in addition to the response headers common to
all responses (refer to :ref:`Common Response Headers`).

.. tabularcolumns:: X{0.57\textwidth}X{0.07\textwidth}X{0.30\textwidth}
.. table::
   :class: longtable 

   +-----------------------------------------------------+--------+------------------------+
   | Header                                              | Type   | Description            |
   +=====================================================+========+========================+
   | ``x-amz-copy-source-version-id``                    | string | Returns the version    |
   |                                                     |        | ID of the retrieved    |
   |                                                     |        | object if it has a     |
   |                                                     |        | unique version ID.     |
   +-----------------------------------------------------+--------+------------------------+
   | ``x-amz-server-side-encryption``                    | string | If server-side         |
   |                                                     |        | encryption is          |
   |                                                     |        | specified either with  |
   |                                                     |        | an AWS KMS or          |
   |                                                     |        | Zenko-managed          |
   |                                                     |        | encryption key in the  |
   |                                                     |        | copy request, the      |
   |                                                     |        | response includes this |
   |                                                     |        | header, confirming the |
   |                                                     |        | encryption algorithm   |
   |                                                     |        | that was used to       |
   |                                                     |        | encrypt the object.    |
   +-----------------------------------------------------+--------+------------------------+
   | ``x-amz-server-side-encryption-aws-kms-key-id``     | string | If the                 |
   |                                                     |        | x-amz-server-side-\    |
   |                                                     |        | encryption             |
   |                                                     |        | is present and has     |
   |                                                     |        | the value of aws:kms,  |
   |                                                     |        | this header specifies  |
   |                                                     |        | the ID of the AWS Key  |
   |                                                     |        | Management Service     |
   |                                                     |        | (KMS) master           |
   |                                                     |        | encryption key that    |
   |                                                     |        | was used for the       |
   |                                                     |        | object.                |
   +-----------------------------------------------------+--------+------------------------+
   | ``x-amz-server-side-encryption-customer-algorithm`` | string | If server-side         |
   |                                                     |        | encryption with        |
   |                                                     |        | customer-provided      |
   |                                                     |        | encryption keys        |
   |                                                     |        | (SSE-C) encryption     |
   |                                                     |        | was requested, the     |
   |                                                     |        | response will include  |
   |                                                     |        | this header            |
   |                                                     |        | confirming the         |
   |                                                     |        | encryption algorithm   |
   |                                                     |        | used for the           |
   |                                                     |        | destination object.    |
   |                                                     |        |                        |
   |                                                     |        | **Valid Values:**      |
   |                                                     |        | ``AES256``             |
   +-----------------------------------------------------+--------+------------------------+
   | ``x-amz-server-side-encryption-customer-key-MD5``   | string | If SSE-C encryption    |
   |                                                     |        | was requested, the     |
   |                                                     |        | response includes      |
   |                                                     |        | this header to         |
   |                                                     |        | provide roundtrip      |
   |                                                     |        | message integrity      |
   |                                                     |        | verification of the    |
   |                                                     |        | customer-provided      |
   |                                                     |        | encryption key used    |
   |                                                     |        | to encrypt the         |
   |                                                     |        | destination object.    |
   +-----------------------------------------------------+--------+------------------------+
   | ``x-amz-version-id``                                | string | Version of the copied  |
   |                                                     |        | object in the          |
   |                                                     |        | destination bucket.    |
   +-----------------------------------------------------+--------+------------------------+

Elements
~~~~~~~~

.. tabularcolumns:: X{0.20\textwidth}X{0.15\textwidth}X{0.60\textwidth}
.. table::

   +-----------------------+-----------------------+-----------------------+
   | Header                | Type                  | Description           |
   +=======================+=======================+=======================+
   | ``CopyObjectResult``  | container             | Container for all     |
   |                       |                       | response elements.    |
   |                       |                       |                       |
   |                       |                       | **Ancestor:** None    |
   +-----------------------+-----------------------+-----------------------+
   | ``ETag``              | string                | Returns the ETag of   |
   |                       |                       | the new object. The   |
   |                       |                       | ETag reflects changes |
   |                       |                       | only to the contents  |
   |                       |                       | of an object, not its |
   |                       |                       | metadata. The source  |
   |                       |                       | and destination ETag  |
   |                       |                       | will be identical for |
   |                       |                       | a successfully copied |
   |                       |                       | object.               |
   |                       |                       |                       |
   |                       |                       | **Ancestor:**         |
   |                       |                       | ``CopyObjectResult``  |
   +-----------------------+-----------------------+-----------------------+
   | ``LastModified``      | string                | Returns the date the  |
   |                       |                       | object was last       |
   |                       |                       | modified.             |
   |                       |                       |                       |
   |                       |                       | **Ancestor:**         |
   |                       |                       | ``CopyObjectResult``  |
   +-----------------------+-----------------------+-----------------------+

Examples
--------

Copying a File into a Bucket with a Different Key Name
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample copies a pdf file into a bucket with a different key
name.

Request
```````

.. code::

   PUT /my-document.pdf HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   Date: Wed, 21 Sep 2016 18:18:00 GMT
   x-amz-copy-source: /{{bucketName}}/my-pdf-document.pdf
   Authorization: {{authorizationString}}

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-copy-source-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   x-amz-version-id: QUpfdndhfd8438MNFDN93jdnJFkdmqnh893
   Date: Wed, 21 Sep 2016 18:18:00 GMT
   Connection: close
   Server: ScalityS3

.. code::

   <CopyObjectResult>
      <LastModified>2009-10-28T22:32:00</LastModified>
      <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   </CopyObjectResult>

x-amz-version-id returns the version ID of the object in the destination
bucket, and x-amz-copy-source-version-id returns the version ID of the
source object.

Copying a Specified Version of an Object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample copies a pdf file with a specified version ID and
copies it into the bucket {{bucketname}} and gives it a different key
name.

Request
```````

.. code::

   PUT /my-document.pdf HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   Date: Wed, 21 Sep 2016 18:18:00 GMT
   x-amz-copy-source: /{{bucketName}}/my-pdf-document.pdf?versionId=3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   Authorization: {{authorizationString}}

Response: Copying a Versioned Object to a Version-Enabled Bucket
````````````````````````````````````````````````````````````````

The response sample shows that an object was copied into a target bucket
where Versioning is enabled.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-version-id: QUpfdndhfd8438MNFDN93jdnJFkdmqnh893
   x-amz-copy-source-version-id: 09df8234529fjs0dfi0w52935029wefdj
   Date: Wed, 21 Sep 2016 18:18:00 GMT
   Connection: close
   Server: ScalityS3

.. code::


   <?xml version="1.0" encoding="UTF-8"?>
   <CopyObjectResult>
      <LastModified>2009-10-28T22:32:00</LastModified>
      <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   </CopyObjectResult>

Response: Copying a Versioned Object to a Version-Suspended Bucket
``````````````````````````````````````````````````````````````````

The response sample shows that an object was copied into a target bucket
where versioning is suspended. Note that the response header
x-amz-version-id does not appear.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-copy-source-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   Date: Wed, 21 Sep 2016 18:18:00 GMT
   Connection: close
   Server: ScalityS3

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <CopyObjectResult>
     <LastModified>2009-10-28T22:32:00</LastModified>
     <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   </CopyObjectResult>

Copying an Unencrypted Object to a Server-Side Encrypted Object Using Your Encryption Keys
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample specifies the HTTP PUT header to copy an unencrypted object
to an object encrypted with server-side encryption with customer-provided
encryption keys (SSE-C).

Request
```````

.. code::

   PUT ExampleObject.txt?acl HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   x-amz-acl: public-read
   Accept: */*
   Authorization: {{authorizationString}}
   Host: s3.scality.com
   Connection: Keep-Alive
   PUT /exampleDestinationObject HTTP/1.1
   Host: example-destination-bucket.s3.amazonaws.com
   x-amz-server-side-encryption-customer-algorithm: AES256
   x-amz-server-side-encryption-customer-key: Base64{{customerProvidedKey}})
   x-amz-server-side-encryption-customer-key-MD5 : Base64(MD5{{customerProvidedKey}})
   x-amz-metadata-directive: metadata_directive
   x-amz-copy-source: /example_source_bucket/exampleSourceObject
   x-amz-copy-source-if-match: {{etag}}
   x-amz-copy-source-if-none-match: {{etag}}
   x-amz-copy-source-if-unmodified-since: {{timeStamp}}
   x-amz-copy-source-if-modified-since: {{timeStamp}}
   <request metadata>
   Authorization: {{authorizationString}}
   Date: {{date}}

Copying from an SSE-C-Encrypted Object to an SSE-C-Encrypted Object 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample specifies the HTTP PUT header to copy an object encrypted
with server-side encryption with customer-provided encryption keys to an object
encrypted with server-side encryption with customer-provided encryption keys for
key rotation.

Request
```````

.. code::

   PUT /exampleDestinationObject HTTP/1.1
   Host: example-destination-bucket.s3.amazonaws.com
   x-amz-server-side-encryption-customer-algorithm: AES256
   x-amz-server-side-encryption-customer-key: Base64({{customerProvidedKey}})
   x-amz-server-side-encryption-customer-key-MD5: Base64(MD5{{customerProvidedKey}})
   x-amz-metadata-directive: metadata_directive
   x-amz-copy-source: /source_bucket/sourceObject
   x-amz-copy-source-if-match: {{etag}}
   x-amz-copy-source-if-none-match: {{etag}}
   x-amz-copy-source-if-unmodified-since: {{timeStamp}}
   x-amz-copy-source-if-modified-since: {{timeStamp}}
   x-amz-copy-source-server-side-encryption-customer-algorithm: AES256
   x-amz-copy-source-server-side-encryption-customer-key: Base64({{oldKey}})
   x-amz-copy-source-server-side-encryption-customer-key-MD5: Base64(MD5{{oldKey}})
   <request metadata>
   Authorization: {{authorizationString}}
   Date: {{date}}
