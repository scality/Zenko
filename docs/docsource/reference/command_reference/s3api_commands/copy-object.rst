.. _copy-object:

copy-object
===========

Creates a copy of an object stored in XDM.

.. note::
   
   To copy an object greater than 5 GB, use the Multipart Upload Upload Part-
   Copy API.

All copy requests must be authenticated. Additionally, you must have read access
to the source object and write access to the destination bucket. Your account
must have permissions for both the region from which you want to copy the object
and the region to which you want to copy the object.

A copy request might return an error when XDM   receives the copy request
or while XDM   is copying the files. If the error occurs before the copy
operation starts, you receive a standard S3 error. If the error occurs during
the copy operation, the error response is embedded in the ``200 OK``
response. This means that a ``200 OK`` response can contain either a success or
an error. Parse and manage the contents of the response appropriately.

If the copy is successful, you receive a response with information about the
copied object.

Metadata
--------

When copying an object, you can preserve all metadata (default) or specify new
metadata. However, the ACL is not preserved and is set to private for the user
making the request. To override the default ACL setting, specify a new ACL when
generating a copy request. See `Managing Access with ACLs`_.


Add the x-amz-metadata-directive header to specify whether you want the object
metadata copied from the source object or replaced with metadata provided in the
request. When granting permissions, you use the s3:x-amz-metadata-directive
condition key to enforce certain metadata behavior on object uploads. 

x-amz-copy-source-if Headers
----------------------------

To copy an object only under certain conditions, such as whether the Etag
matches or whether the object was modified before or after a specified date, use
the following request parameters:

* ``x-amz-copy-source-if-match``
* ``x-amz-copy-source-if-none-match``
* ``x-amz-copy-source-if-unmodified-since``
* ``x-amz-copy-source-if-modified-since``

If both the x-amz-copy-source-if-match and x-amz-copy-source-if-unmodified-since
headers are present in the request and evaluate as follows, XDM   returns
``200 OK`` and copies the data:

* ``x-amz-copy-source-if-match`` condition evaluates to true
* ``x-amz-copy-source-if-unmodified-since`` condition evaluates to false

If both the x-amz-copy-source-if-none-match and
x-amz-copy-source-if-modified-since headers are present in the request and
evaluate as follows, XDM   returns the ``412 Precondition Failed``
response code:

* ``x-amz-copy-source-if-none-match`` condition evaluates to false
* ``x-amz-copy-source-if-modified-since`` condition evaluates to true

.. note::

   All headers with the x-amz- prefix, including x-amz-copy-source , must be
   signed.

Encryption
----------

The source object being copied can be encrypted or unencrypted. The source
object can be encrypted with server-side encryption using Scality-managed
encryption keys (SSE-S3). With server-side encryption, XDM   encrypts
data as it writes it to disk and decrypts the data when you access it.

You can request server-side encryption for the target object regardless of
whether the source object was encrypted.

ACL-Specific Request Headers
----------------------------

When copying an object, you may use headers to grant permissions based on access
control lists (ACLs). By default, all objects are private. Only the owner has
full access control. When adding a new object, you can grant permissions to
individual AWS accounts or to predefined groups defined by XDM. These
permissions are then added to the ACL on the object.

Storage Class Options
---------------------

You can use the CopyObject operation to change the storage class of an object
that is already stored in XDM   using the StorageClass parameter.

Versioning
----------
	
By default, x-amz-copy-source identifies the current version of an object to
copy. If the current version is a delete marker, XDM   behaves as if the
object were deleted. To copy a different version, use the versionId subresource.

If you enable versioning on the target bucket, XDM   generates a unique
version ID for the object being copied. This version ID is different from the
version ID of the source object. XDM   returns the version ID of the
copied object in the x-amz-version-id response header in the response.

If you do not enable versioning or suspend it on the target bucket, XDM  
generates a null version ID.

The following operations are related to CopyObject :

* PutObject
* GetObject

Synopsis
--------

.. code::
   
   copy-object
      [--acl <value>]
      --bucket <value>
      [--cache-control <value>]
      [--content-disposition <value>]
      [--content-encoding <value>]
      [--content-language <value>]
      [--content-type <value>]
      --copy-source <value>
      [--copy-source-if-match <value>]
      [--copy-source-if-modified-since <value>]
      [--copy-source-if-none-match <value>]
      [--copy-source-if-unmodified-since <value>]
      [--expires <value>]
      [--grant-full-control <value>]
      [--grant-read <value>]
      [--grant-read-acp <value>]
      [--grant-write-acp <value>]
      --key <value>
      [--metadata <value>]
      [--metadata-directive <value>]
      [--tagging-directive <value>]
      [--server-side-encryption <value>]
      [--storage-class <value>]
      [--website-redirect-location <value>]
      [--tagging <value>]
      [--object-lock-mode <value>]
      [--object-lock-retain-until-date <value>]
      [--object-lock-legal-hold-status <value>]
      [--cli-input-json <value>]

Options
-------

``--acl`` (string)

   The canned ACL to apply to the object.

   Possible values:
   
   * private
   * public-read
   * public-read-write
   * authenticated-read
   * aws-exec-read
   * bucket-owner-read
   * bucket-owner-full-control

``--bucket`` (string)

   The name of the destination bucket.

``--cache-control`` (string)

   Specifies caching behavior along the request/reply chain.

``--content-disposition`` (string)

   Specifies presentational information for the object.

``--content-encoding`` (string)

   Specifies what content encodings have been applied to the object and thus
   what decoding mechanisms must be applied to obtain the media-type referenced
   by the Content-Type header field.

``--content-language`` (string)

   The language the content is in.

``--content-type`` (string)

   A standard MIME type describing the format of the object data.

``--copy-source`` (string)

   The name of the source bucket and key name of the source object, separated by
   a slash (/). Must be URL-encoded.

``--copy-source-if-match`` (string)

   Copies the object if its entity tag (ETag) matches the specified tag.

``--copy-source-if-modified-since`` (timestamp)

   Copies the object if it has been modified since the specified time.

``--copy-source-if-none-match`` (string)

   Copies the object if its entity tag (ETag) is different than the specified
   ETag.

``--copy-source-if-unmodified-since`` (timestamp)

   Copies the object if it hasn't been modified since the specified time.

``--expires`` (timestamp)

   The date and time at which the object is no longer cacheable.

``--grant-full-control`` (string)

   Gives the grantee READ, READ_ACP, and WRITE_ACP permissions on the object.

``--grant-read`` (string)

   Allows grantee to read the object data and its metadata.

``--grant-read-acp`` (string)

   Allows grantee to read the object ACL.

``--grant-write-acp`` (string)

   Allows grantee to write the ACL for the applicable object.

``--key`` (string)

   The key of the destination object.

``--metadata`` (map)

   A map of metadata to store with the object in S3.

   **Shorthand Syntax:**

   .. code::
   
      KeyName1=string,KeyName2=string

   **JSON Syntax:**

   .. code::

      {"string": "string"
      ...}

``--metadata-directive`` (string)

   Specifies whether the metadata is copied from the source object or replaced
   with metadata provided in the request.

   Possible values:

   * COPY
   * REPLACE

``--tagging-directive`` (string)

   Specifies whether the object tag-set are copied from the source object or
   replaced with tag-set provided in the request.

   Possible values:

   * COPY
   * REPLACE

``--server-side-encryption`` (string)

   The server-side encryption algorithm used when storing this object in S3
   Connector (for example, AES256, aws:kms).

   Possible values:

   * AES256
   * aws:kms

``--storage-class`` (string)

   The type of storage to use for the object. Defaults to ``STANDARD``.

   Possible values:

   * STANDARD

``--website-redirect-location`` (string)

   If the bucket is configured as a website, redirects requests for this object
   to another object in the same bucket or to an external URL. XDM  
   stores the value of this header in the object metadata.

``--tagging`` (string)

   The tag-set for the object destination object this value must be used in
   conjunction with the TaggingDirective . The tag-set must be encoded as URL
   Query parameters.

``--object-lock-mode`` (string)

   The Object Lock mode that you want to apply to the copied object.

   Possible values:

   * GOVERNANCE
   * COMPLIANCE

``--object-lock-retain-until-date`` (timestamp)

   The date and time when you want the copied object's Object Lock to expire.

``--object-lock-legal-hold-status`` (string)

   Specifies whether you want to apply a Legal Hold to the copied object.

   Possible values:

   * ON
   * OFF

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
~~~~~~~~

The following command copies an object from bucket-1 to bucket-2:

.. code::

   $ aws s3api copy-object --copy-source bucket-1/test.txt --key test.txt --bucket bucket-2

Output
^^^^^^

.. code::
   
   {
      "CopyObjectResult": {
         "LastModified": "2015-11-10T01:07:25.000Z",
         "ETag": "\"589c8b79c230a6ecd5a7e1d040a9a030\""
         },
      "VersionId": "YdnYvTCVDqRRFA.NFJjy36p0hxifMlkA"
   }

Output
^^^^^^

CopyObjectResult -> (structure)

   Container for all response elements.

ETag -> (string)

   Returns the ETag of the new object. The ETag reflects only changes to the
   contents of an object, not its metadata. The source and destination ETag is
   identical for a successfully copied object.

LastModified -> (timestamp)

   Returns the date that the object was last modified.

Expiration -> (string)

   If the object expiration is configured, the response includes this header.

CopySourceVersionId -> (string)

   Version of the copied object in the destination bucket.

VersionId -> (string)

   Version ID of the newly created copy.

ServerSideEncryption -> (string)

   The server-side encryption algorithm used when storing this object in S3
   Connector (for example, AES256, aws:kms).


.. _Managing Access with ACLs: https://docs.aws.amazon.com/AmazonS3/latest/dev/S3_ACLs_UsingACLs.html   
