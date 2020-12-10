.. _head-object:

head-object
===========

The HEAD operation retrieves metadata from an object without returning the
object itself. This operation is useful if you're only interested in an object's
metadata. To use HEAD, you must have read access to the object.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/HeadObject>`_.

Synopsis
--------

::

  head-object
    --bucket <value>
    [--if-match <value>]
    [--if-modified-since <value>]
    [--if-none-match <value>]
    [--if-unmodified-since <value>]
    --key <value>
    [--range <value>]
    [--version-id <value>]
    [--part-number <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--if-match`` (string)

  Return the object only if its entity tag (ETag) is the same as the one
  specified; otherwise return a ``412`` (precondition failed).

``--if-modified-since`` (timestamp)

  Return the object only if it has been modified since the specified time;
  otherwise return a ``304`` (not modified).

``--if-none-match`` (string)

  Return the object only if its entity tag (ETag) is different from the one
  specified; otherwise return a ``304`` (not modified).

``--if-unmodified-since`` (timestamp)

  Return the object only if it has not been modified since the specified time;
  otherwise return a ``412`` (precondition failed).

``--key`` (string)

``--range`` (string)

  Downloads the specified range bytes of an object. For more information about
  the HTTP Range header, go to
  http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.

``--version-id`` (string)

  VersionId used to reference a specific version of the object.

``--part-number`` (integer)

  Part number of the object being read. This is a positive integer between 1 and
  10,000. Effectively performs a 'ranged' HEAD request for the part
  specified. This is useful for querying the size of the part and the number of
  parts in an object.

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command retrieves metadata for an object in a bucket named
"my-bucket"::

  $ aws s3api head-object --bucket my-bucket --key index.html

Output::

  {
      "AcceptRanges": "bytes",
      "ContentType": "text/html",
      "LastModified": "Thu, 16 Apr 2015 18:19:14 GMT",
      "ContentLength": 77,
      "VersionId": "null",
      "ETag": "\"30a6ec7e1a9ad79c203d05a589c8b400\"",
      "Metadata": {}
  }

Output
------

DeleteMarker -> (Boolean)

  Specifies whether the object retrieved was (``true``) or was not (``false``) a
  delete marker. If ``false``, this response header does not appear in the
  response.

AcceptRanges -> (string)

Expiration -> (string)

  If the object expiration is configured (see :ref:`PUT Bucket Lifecycle`), the
  response includes this header. It includes the ``expiry-date`` and ``rule-id``
  key value pairs providing object expiration information. The value of
  ``rule-id`` is URL-encoded.

Restore -> (string)

  Provides information about object restoration operation and the expiration
  time of the restored object copy.

LastModified -> (timestamp)

  Last modified date of the object

ContentLength -> (long)

  Size of the body, in bytes
  
ETag -> (string)

  An ETag is an opaque identifier assigned by a web server to a specific version
  of a resource found at an URL.

MissingMeta -> (integer)

  This is set to the number of metadata entries not returned in x-amz-meta
  headers. This can happen if you create metadata using an API like SOAP that
  supports more flexible metadata than the REST API. For example, using SOAP,
  you can create metadata whose values are not legal HTTP headers.
  
VersionId -> (string)

  Version of the object

CacheControl -> (string)

  Specifies caching behavior along the request/reply chain.

ContentDisposition -> (string)

  Specifies presentational information for the object.

ContentEncoding -> (string)

  Specifies what content encodings have been applied to the object and thus what
  decoding mechanisms must be applied to obtain the media-type referenced by the
  Content-Type header field.
  
ContentLanguage -> (string)

  The language the content is in.

ContentType -> (string)

  A standard MIME type describing the format of the object data.

Expires -> (timestamp)

  The date and time at which the object is no longer cacheable.

WebsiteRedirectLocation -> (string)

  If the bucket is configured as a website, redirects requests for this object
  to another object in the same bucket or to an external URL. |product| stores
  the value of this header in the object metadata.

ServerSideEncryption -> (string)

  The server-side encryption algorithm used when storing this object (e.g.,
  ``AES256``, ``aws:kms``).

Metadata -> (map)

  A map of metadata to store with the object.

  key -> (string)

  value -> (string)

StorageClass -> (string)

ReplicationStatus -> (string)

PartsCount -> (integer)

  The count of parts in this object.

ObjectLockMode -> (string)

  The object lock mode currently in place for this object

ObjectLockRetainUntilDate -> (timestamp)

  The date and time this object's object lock expires.

ObjectLockLegalHoldStatus -> (string)

  The specified object's legal hold status.
