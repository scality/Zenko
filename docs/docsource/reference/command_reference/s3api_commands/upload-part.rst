.. _upload-part:

upload-part
===========

Uploads a part in a multipart upload.

 .. note::

    After you initiate multipart upload and upload one or more parts, you must
    either complete or abort multipart upload. Zenko only frees up parts
    storage after you either complete or abort multipart upload.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/UploadPart>`_.

Synopsis
--------

::

  upload-part
    [--body <value>]
    --bucket <value>
    [--content-length <value>]
    [--content-md5 <value>]
    --key <value>
    --part-number <value>
    --upload-id <value>
    [--cli-input-json <value>]

Options
-------

``--body`` (blob)

  Object data.

``--bucket`` (string)

  Name of the bucket to which the multipart upload was initiated.

``--content-length`` (long)

  Size of the body in bytes. This parameter is useful when the size of the body
  cannot be determined automatically.

``--content-md5`` (string)

  The base64-encoded 128-bit MD5 digest of the part data. This parameter is
  auto-populated when using the command from the CLI. This parameter is required
  if object lock parameters are specified.

``--key`` (string)

  Object key for which the multipart upload was initiated.

``--part-number`` (integer)

  Part number of part being uploaded. This is a positive integer between 1 and
  10,000.

``--upload-id`` (string)

  Upload ID identifying the multipart upload whose part is being uploaded.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.


Examples
--------

The following command uploads the first part in a multipart upload initiated
with the ``create-multipart-upload`` command::

  aws s3api upload-part --bucket my-bucket --key 'multipart/01' --part-number 1 --body part01 --upload-id  "dfRtDYU0WWCCcH43C3WFbkRONycyCpTJJvxu2i5GYkZljF.Yxwh6XG7WfS2vC4to6HiV6Yjlx.cph0gtNBtJ8P3URCSbB7rjxI5iEwVDmgaXZOGgkk5nVTW16HOQ5l0R"

The ``body`` option takes the name or path of a local file for upload (do not
use the file:// prefix). The minimum part size is 5 MB. Upload ID is returned by
``create-multipart-upload`` and can also be retrieved with
``list-multipart-uploads``. Bucket and key are specified when you create the
multipart upload.

Output::

  {
      "ETag": "\"e868e0f4719e394144ef36531ee6824c\""
  }

Save the ETag value of each part for later. They are required to complete the
multipart upload.

Output
------

ServerSideEncryption -> (string)

  The Server-side encryption algorithm used when storing this object in S3
  (e.g., AES256, aws:kms).

ETag -> (string)

  Entity tag for the uploaded object.

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
