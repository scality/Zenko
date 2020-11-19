.. _create-multipart-upload:

create-multipart-upload
=======================

Initiates a multipart upload and returns an upload ID.

.. note::

   After you initiate multipart upload and upload one or more parts, you must
   either complete or abort multipart upload. |product| only frees up the
   parts storage after you either complete or abort multipart upload.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/CreateMultipartUpload>`_.

Synopsis
--------

::

  create-multipart-upload
    [--acl <value>]
    --bucket <value>
    [--cache-control <value>]
    [--content-disposition <value>]
    [--content-encoding <value>]
    [--content-language <value>]
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

``--bucket`` (string)

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

``--metadata`` (map)

  A map of metadata to store with the object in S3.

Shorthand Syntax::

    KeyName1=string,KeyName2=string

JSON Syntax::

  {"string": "string"
    ...}

``--server-side-encryption`` (string)

  The Server-side encryption algorithm used when storing this object in S3 (e.g., AES256, aws:kms).

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

  The tag-set for the object. The tag-set must be encoded as URL Query
  parameters

``--object-lock-mode`` (string)

  Specifies the object lock mode that you want to apply to the uploaded object.

  Possible values:
  
  *   ``GOVERNANCE``
  
  *   ``COMPLIANCE``

``--object-lock-retain-until-date`` (timestamp)

  Specifies the date and time when you want the object lock to expire.

``--object-lock-legal-hold-status`` (string)

  Specifies whether you want to apply a Legal Hold to the uploaded object.

  Possible values:
  
  *   ``ON``
  
  *   ``OFF``

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command creates a multipart upload in the bucket ``my-bucket``
with the key ``multipart/01``::

  $ aws s3api create-multipart-upload --bucket my-bucket --key 'multipart/01'

Output::

  {
      "Bucket": "my-bucket",
      "UploadId": "dfRtDYU0WWCCcH43C3WFbkRONycyCpTJJvxu2i5GYkZljF.Yxwh6XG7WfS2vC4to6HiV6Yjlx.cph0gtNBtJ8P3URCSbB7rjxI5iEwVDmgaXZOGgkk5nVTW16HOQ5l0R",
      "Key": "multipart/01"
  }

The completed file will be named "01" in a folder called "multipart" in
my-bucket. Save the upload ID, key and bucket name for use with the upload-part
command.

Output
------

AbortDate -> (timestamp)

  Date when multipart upload will become eligible for abort operation by lifecycle.
  
AbortRuleId -> (string)

  Id of the lifecycle rule that makes a multipart upload eligible for abort operation.

Bucket -> (string)

  Name of the bucket to which the multipart upload was initiated.
  
Key -> (string)

  Object key for which the multipart upload was initiated.

UploadId -> (string)

  ID for the initiated multipart upload.

ServerSideEncryption -> (string)

  The server-side encryption algorithm used when storing this object in S3
  (e.g., AES256, aws:kms).


