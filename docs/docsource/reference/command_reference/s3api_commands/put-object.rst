.. _put-object:

put-object
==========

Adds an object to a bucket.

See also: :ref:`PUT Object`.

Synopsis
--------

::

  put-object
    [--acl <value>]
    [--body <value>]
    --bucket <value>
    [--cache-control <value>]
    [--content-disposition <value>]
    [--content-encoding <value>]
    [--content-language <value>]
    [--content-length <value>]
    [--content-md5 <value>]
    [--content-type <value>]
    [--expires <value>]
    [--grant-full-control <value>]
    [--grant-read <value>]
    [--grant-read-acp <value>]
    [--grant-write-acp <value>]
    --key <value>
    [--metadata <value>]
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
  
  *   ``private``

  *   ``public-read``

  *   ``public-read-write``

  *   ``authenticated-read``

  *   ``aws-exec-read``

  *   ``bucket-owner-read``

  *   ``bucket-owner-full-control``

``--body`` (blob)

  Object data.

``--bucket`` (string)

  Name of the bucket to which the PUT operation was initiated.

``--cache-control`` (string)

  Specifies caching behavior along the request/reply chain.

``--content-disposition`` (string)

  Specifies presentational information for the object.

``--content-encoding`` (string)

  Specifies what content encodings have been applied to the object and thus what
  decoding mechanisms must be applied to obtain the media-type referenced by the
  Content-Type header field.

``--content-language`` (string)

  The language the content is in.
  
``--content-length`` (long)

  Size of the body in bytes. This parameter is useful when the size of the body
  cannot be determined automatically.

``--content-md5`` (string)

  The base64-encoded 128-bit MD5 digest of the part data. This parameter is
  auto-populated when using the command from the CLI. This parameter is required
  if object lock parameters are specified.

``--content-type`` (string)

  A standard MIME type describing the format of the object data.

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

  Object key for which the PUT operation was initiated.

``--metadata`` (map)

  A map of metadata to store with the object in S3.

Shorthand Syntax::

    KeyName1=string,KeyName2=string

JSON Syntax::

  {"string": "string"
    ...}

``--server-side-encryption`` (string)

  The server-side encryption algorithm used when storing this object in S3
  (e.g., AES256, aws:kms).

  Possible values:
  
  *   ``AES256``

  *   ``aws:kms``

``--storage-class`` (string)

  The type of storage to use for the object. Defaults to ``STANDARD``.

  Possible values:

  *   ``STANDARD``

``--website-redirect-location`` (string)

  If the bucket is configured as a website, redirects requests for this object
  to another object in the same bucket or to an external URL. |product| stores
  the value of this header in the object metadata.

``--tagging`` (string)

  The tag-set for the object. The tag-set must be encoded as URL Query parameters. (For example, "Key1=Value1")

``--object-lock-mode`` (string)

  The object lock mode that you want to apply to this object.

  Possible values:
  
  *   ``GOVERNANCE``
  
  *   ``COMPLIANCE``

``--object-lock-retain-until-date`` (timestamp)

  The date and time when you want this object's object lock to expire.

``--object-lock-legal-hold-status`` (string)

  The Legal Hold status that you want to apply to the specified object.

  Possible values:
  
  *   ``ON``
  
  *   ``OFF``

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following example uses the ``put-object`` command to upload an object to
|product|  ::

    $ aws s3api put-object --bucket text-content --key dir-1/my_images.tar.bz2 --body my_images.tar.bz2

The following example shows an upload of a video file (specified using Windows
file system syntax)::

    $ aws s3api put-object --bucket text-content --key dir-1/big-video-file.mp4 --body e:\media\videos\f-sharp-3-data-services.mp4

For more information about uploading objects, see `Uploading Objects`_ in the
*Amazon S3 Developer Guide*.

.. _`Uploading Objects`: http://docs.aws.amazon.com/AmazonS3/latest/dev/UploadingObjects.html

Output
------

Expiration -> (string)
  
  If the object expiration is configured, this will contain the expiration date
  (expiry-date) and rule ID (rule-id). The value of rule-id is URL encoded.
  
ETag -> (string)
  
  Entity tag for the uploaded object.
  
ServerSideEncryption -> (string)
  
  The Server-side encryption algorithm used when storing this object in S3
  (e.g., AES256, aws:kms).
  
VersionId -> (string)
  
  Version of the object.
  
SSECustomerAlgorithm -> (string)
  
  If server-side encryption with a customer-provided encryption key was
  requested, the response will include this header confirming the encryption
  algorithm used.
  
SSECustomerKeyMD5 -> (string)
  
  If server-side encryption with a customer-provided encryption key was
  requested, the response will include this header to provide round trip message
  integrity verification of the customer-provided encryption key.
  
SSEKMSKeyId -> (string)
  
  If present, specifies the ID of the AWS Key Management Service (KMS) master
  encryption key that was used for the object.
  
SSEKMSEncryptionContext -> (string)
  
  If present, specifies the AWS KMS Encryption Context to use for object
  encryption. The value of this header is a base64-encoded UTF-8 string holding
  JSON with the encryption context key-value pairs.

  
