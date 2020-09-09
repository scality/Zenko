.. _upload-part-copy:

upload-part-copy
================

Uploads a part by copying data from an existing object as data source.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/UploadPartCopy>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::
   
  upload-part-copy
    --bucket <value>
    --copy-source <value>
    [--copy-source-if-match <value>]
    [--copy-source-if-modified-since <value>]
    [--copy-source-if-none-match <value>]
    [--copy-source-if-unmodified-since <value>]
    [--copy-source-range <value>]
    --key <value>
    --part-number <value>
    --upload-id <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--copy-source`` (string)

  The name of the source bucket and key name of the source object, separated by
  a slash (/). Must be URL-encoded.
  
``--copy-source-if-match`` (string)

  Copies the object if its entity tag (ETag) matches the specified tag.
  
``--copy-source-if-modified-since`` (timestamp)

  Copies the object if it has been modified since the specified time.
  
``--copy-source-if-none-match`` (string)

  Copies the object if its entity tag (ETag) is different than the specified ETag.
  
``--copy-source-if-unmodified-since`` (timestamp)

  Copies the object if it hasn't been modified since the specified time.
  
``--copy-source-range`` (string)

  The range of bytes to copy from the source object. The range value must use
  the form bytes=first-last, where the first and last are the zero-based byte
  offsets to copy. For example, bytes=0-9 indicates that you want to copy the
  first ten bytes of the source. You can copy a range only if the source object
  is greater than 5 MB.
  
``--key`` (string)
  
``--part-number`` (integer)

  Part number of part being copied. This is a positive integer between 1 and 10,000.
  
``--upload-id`` (string)

  Upload ID identifying the multipart upload whose part is being copied.
  
    
``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Output
------

CopySourceVersionId -> (string)
  
  The version of the source object that was copied, if you have enabled
  versioning on the source bucket.
  
CopyPartResult -> (structure)
  
  ETag -> (string)
    
    Entity tag of the object.
    
  LastModified -> (timestamp)
    
    Date and time at which the object was uploaded.
  
ServerSideEncryption -> (string)
  
  The Server-side encryption algorithm used when storing this object in S3
  (e.g., AES256, aws:kms).
    
