.. _get-object:

get-object
==========

Retrieves objects from S3 Connector.

See also: :ref:`GET Object`.

Synopsis
--------

::

  get-object
    --bucket <value>
    [--if-match <value>]
    [--if-modified-since <value>]
    [--if-none-match <value>]
    [--if-unmodified-since <value>]
    --key <value>
    [--range <value>]
    [--response-cache-control <value>]
    [--response-content-disposition <value>]
    [--response-content-encoding <value>]
    [--response-content-language <value>]
    [--response-content-type <value>]
    [--response-expires <value>]
    [--version-id <value>]
    [--part-number <value>]
    outfile <value>

Options
-------

``--bucket`` (string)

``--if-match`` (string)

  Return the object only if its entity tag (ETag) is the same as the one
  specified, otherwise return a 412 (precondition failed).

``--if-modified-since`` (timestamp)

  Return the object only if it has been modified since the specified time,
  otherwise return a 304 (not modified).

``--if-none-match`` (string)

  Return the object only if its entity tag (ETag) is different from the one
  specified, otherwise return a 304 (not modified).

``--if-unmodified-since`` (timestamp)

  Return the object only if it has not been modified since the specified time,
  otherwise return a 412 (precondition failed).

``--key`` (string)

``--range`` (string)

  Downloads the specified range bytes of an object. For more information about
  the HTTP Range header, go to
  http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.

``--response-cache-control`` (string)

  Sets the Cache-Control header of the response.

``--response-content-disposition`` (string)

  Sets the Content-Disposition header of the response

``--response-content-encoding`` (string)

  Sets the Content-Encoding header of the response.

``--response-content-language`` (string)

  Sets the Content-Language header of the response.

``--response-content-type`` (string)

  Sets the Content-Type header of the response.

``--response-expires`` (timestamp)

  Sets the Expires header of the response.

``--version-id`` (string)

  VersionId used to reference a specific version of the object.

``--part-number`` (integer)

  Part number of the object being read. This is a positive integer between 1 and
  10,000. Effectively performs a 'ranged' GET request for the part
  specified. Useful for downloading just a part of an object.

``outfile`` (string)

  Filename where the content will be saved

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following example uses the ``get-object`` command to download an object from
S3 Connector::

  aws s3api get-object --bucket text-content --key dir/my_images.tar.bz2 my_images.tar.bz2

Note that the outfile parameter is specified without an option name such as
"--outfile". The name of the output file must be the last parameter in the
command.

The example below demonstrates the use of ``--range`` to download a specific
byte range from an object. Note the byte ranges needs to be prefixed with
"bytes="::

  aws s3api get-object --bucket text-content --key dir/my_data --range bytes=8888-9999 my_data_range

For more information about retrieving objects, see `Getting Objects`_ in the
*Amazon S3 Developer Guide*.

.. _`Getting Objects`: http://docs.aws.amazon.com/AmazonS3/latest/dev/GettingObjectsUsingAPIs.html

Output
------

Body -> (blob)

  Object data.

DeleteMarker -> (Boolean)

  Specifies whether the object retrieved was (true) or was not (false) a Delete
  Marker. If false, this response header does not appear in the response.

AcceptRanges -> (string)

Expiration -> (string)

  If the object expiration is configured (see PUT Bucket lifecycle), the
  response includes this header. It includes the expiry-date and rule-id key
  value pairs providing object expiration information. The value of the rule-id
  is URL encoded.

Restore -> (string)

  Provides information about object restoration operation and expiration time of
  the restored object copy.
  
LastModified -> (timestamp)

  Last modified date of the object

ContentLength -> (long)

  Size of the body in bytes.

ETag -> (string)

  An ETag is an opaque identifier assigned by a web server to a specific version
  of a resource found at a URL

MissingMeta -> (integer)

  This is set to the number of metadata entries not returned in x-amz-meta
  headers. This can happen if you create metadata using an API like SOAP that
  supports more flexible metadata than the REST API. For example, using SOAP,
  you can create metadata whose values are not legal HTTP headers.

VersionId -> (string)

  Version of the object.
  
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

ContentRange -> (string)

  The portion of the object returned in the response.
  
ContentType -> (string)

  A standard MIME type describing the format of the object data.

Expires -> (timestamp)

  The date and time at which the object is no longer cacheable.
  
WebsiteRedirectLocation -> (string)

  If the bucket is configured as a website, redirects requests for this object
  to another object in the same bucket or to an external URL. S3 Connector stores
  the value of this header in the object metadata.

ServerSideEncryption -> (string)

  The Server-side encryption algorithm used when storing this object in S3
  (e.g., AES256, aws:kms).

Metadata -> (map)

  A map of metadata to store with the object in S3.

  key -> (string)

  value -> (string)

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

StorageClass -> (string)

ReplicationStatus -> (string)

PartsCount -> (integer)

  The count of parts this object has.

TagCount -> (integer)

  The number of tags, if any, on the object.

ObjectLockMode -> (string)

  The object lock mode currently in place for this object.

ObjectLockRetainUntilDate -> (timestamp)

  The date and time when this object's object lock will expire.

ObjectLockLegalHoldStatus -> (string)

  Indicates whether this object has an active legal hold. This field is only
  returned if you have permission to view an object's legal hold status.
