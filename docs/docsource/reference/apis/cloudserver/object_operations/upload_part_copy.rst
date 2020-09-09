.. _Upload Part - Copy:

Upload Part - Copy
==================

The Upload Part - Copy operation is used to upload a part by copying
data from an existing object as data source. The data source is
specified by adding the request header x-amz-copy-source to the request,
and a byte range is specified by adding the request header
x-amz-copy-source-range to the request.

The minimum allowable part size for a multipart upload is 5 MB.

.. tip::

  Instead of using an existing object as part data, it is possible to use
  the Upload Part operation and provide data in the request. For more
  information, refer to :ref:`Upload Part`.

A multipart upload must be initiated before uploading any part. In
response to the initiate request, S3 Connector returns a unique identifier — the
*upload ID* — that must be included in the upload part request.

Requests
--------

Request Syntax
~~~~~~~~~~~~~~

.. code::

   PUT /{{objectName}}?partNumber={{partNumber}}&uploadId={{uploadId}} HTTP/1.1
   Host: {{BucketName}}.s3.example.com
   x-amz-copy-source: /{{sourceBucket}}/{{sourceObject}}
   x-amz-copy-source-range:bytes={{first-Last}}
   x-amz-copy-source-if-match: {{etag}}
   x-amz-copy-source-if-none-match: {{etag}}
   x-amz-copy-source-if-unmodified-since: {{timeStamp}}
   x-amz-copy-source-if-modified-since: {{timeStamp}}
   Date: {{date}}
   Authorization: {{authorizationString}}

Request Parameters
~~~~~~~~~~~~~~~~~~

The Upload Part-Copy operation does not use request parameters.

Request Headers
~~~~~~~~~~~~~~~

The Upload Part-Copy operation can use a number of optional request headers
in addition to those that are common to all operations (refer to :ref:`Common
Request Headers`).

.. tabularcolumns:: llL
.. table::
   :widths: 30 10 60

   +-------------------------+-----------------------+-------------------------+
   | Header                  | Type                  | Description             |
   +=========================+=======================+=========================+
   | x-amz-copy-source       | String                | The name of the         |
   |                         |                       | source bucket and the   |
   |                         |                       | source object key       |
   |                         |                       | name separated by a     |
   |                         |                       | slash ('/').            |
   |                         |                       |                         |
   |                         |                       | Default: None           |
   +-------------------------+-----------------------+-------------------------+
   | x-amz-copy-source-range | Integer               | The range of bytes to   |
   |                         |                       | copy from the source    |
   |                         |                       | object. The range       |
   |                         |                       | value must use the      |
   |                         |                       | form                    |
   |                         |                       | bytes=first-last,       |
   |                         |                       | where the first and     |
   |                         |                       | last are the            |
   |                         |                       | zero-based byte         |
   |                         |                       | offsets to copy         |
   |                         |                       | (e.g., bytes=0-9        |
   |                         |                       | indicates copying the   |
   |                         |                       | first ten bytes of      |
   |                         |                       | the source).            |
   |                         |                       |                         |
   |                         |                       | x-amz-copy-source-range |
   |                         |                       | is not required when    |
   |                         |                       | copying an entire       |
   |                         |                       | source object.          |
   |                         |                       |                         |
   |                         |                       | Default: None           |
   +-------------------------+-----------------------+-------------------------+

The following conditional headers are based on the object that the
x-amz-copy-source header specifies.

.. tabularcolumns:: llX{0.40\textwidth}
.. table::
   :widths: 40 10 50
   :class: longtable

   +---------------------------------------+-----------------------+---------------------------------------+
   | Header                                | Type                  | Description                           |
   +=======================================+=======================+=======================================+
   | x-amz-copy-source-if-match            | String                | Perform a copy if the                 |
   |                                       |                       | source object entity                  |
   |                                       |                       | tag (ETag) matches                    |
   |                                       |                       | the specified value.                  |
   |                                       |                       | If the value does not                 |
   |                                       |                       | match, S3 Connector                   |
   |                                       |                       | returns an                            |
   |                                       |                       | HTTP status code                      |
   |                                       |                       | ``412 Precondition Failed``           |
   |                                       |                       | error.                                |
   |                                       |                       |                                       |
   |                                       |                       | .. note::                             |
   |                                       |                       |                                       |   
   |                                       |                       |    If both the                        |
   |                                       |                       |    x-amz-copy-source-if-match and     |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since headers are present in the   |
   |                                       |                       |    request as follows:                |
   |                                       |                       |                                       |
   |                                       |                       |    x-amz-copy-source-if-match         |
   |                                       |                       |    condition evaluates                |
   |                                       |                       |    to true, and;                      |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since condition evaluates          |
   |                                       |                       |    to false;                          |
   |                                       |                       |    then S3 returns                    |
   |                                       |                       |    ``200 OK`` and copies              |
   |                                       |                       |    the data.                          |
   |                                       |                       |                                       |
   |                                       |                       | Default: None                         |
   +---------------------------------------+-----------------------+---------------------------------------+
   | x-amz-copy-source-if-none-match       | String                | Perform a copy if the                 |
   |                                       |                       | source object entity                  |
   |                                       |                       | tag (ETag) is                         |
   |                                       |                       | different than the                    |
   |                                       |                       | value specified using                 |
   |                                       |                       | this header. If the                   |
   |                                       |                       | values match,                         |
   |                                       |                       | S3 Connector returns                  |
   |                                       |                       | an HTTP status code                   |
   |                                       |                       | ``412 Precondition Failed``           |
   |                                       |                       | error.                                |
   |                                       |                       |                                       |
   |                                       |                       | .. note:: If both the                 |
   |                                       |                       |    x-amz-copy-source-if-none-match    |
   |                                       |                       |    and                                |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since headers are present          |
   |                                       |                       |    in the request as follows:         |
   |                                       |                       |                                       |
   |                                       |                       |    x-amz-copy-source-if-none-match    |
   |                                       |                       |    condition evaluates                |
   |                                       |                       |    to false, and                      |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since condition evaluates          |
   |                                       |                       |    to true, then S3 returns a         |
   |                                       |                       |    ``412 Precondition Failed``        |
   |                                       |                       |    response code.                     |
   |                                       |                       |                                       |
   |                                       |                       | Default: None                         |
   +---------------------------------------+-----------------------+---------------------------------------+
   | x-amz-copy-source-if-unmodified-since | String                | Perform a copy if the                 |
   |                                       |                       | source object is not                  |
   |                                       |                       | modified after the                    |
   |                                       |                       | time specified using                  |
   |                                       |                       | this header. If the                   |
   |                                       |                       | source object is                      |
   |                                       |                       | modified, S3                          |
   |                                       |                       | Connector returns an                  |
   |                                       |                       | HTTP status code                      |
   |                                       |                       | ``412 Precondition Failed``           |
   |                                       |                       | error.                                |
   |                                       |                       |                                       |
   |                                       |                       | .. note::                             |
   |                                       |                       |                                       |
   |                                       |                       |    If both the                        |
   |                                       |                       |    x-amz-copy-source-if-match and     |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since headers are present          |
   |                                       |                       |    in the request as follows:         |
   |                                       |                       |                                       |
   |                                       |                       |    x-amz-copy-source-if-match         |
   |                                       |                       |    condition evaluates                |
   |                                       |                       |    to true, and                       |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since condition evaluates          |
   |                                       |                       |    to false, then S3 returns          |
   |                                       |                       |    ``200 OK`` and copies the data.    |
   |                                       |                       |                                       |
   |                                       |                       | Default: None                         |
   +---------------------------------------+-----------------------+---------------------------------------+
   | x-amz-copy-source-if-modified-since   | String                | Perform a copy if the                 |
   |                                       |                       | source object is                      |
   |                                       |                       | modified after the                    |
   |                                       |                       | time specified using the              |
   |                                       |                       | x-amz-copy-source-if-modified-since   |
   |                                       |                       | header. If the source                 |
   |                                       |                       | object is not                         |
   |                                       |                       | modified, S3                          |
   |                                       |                       | Connector returns an                  |
   |                                       |                       | HTTP status code                      |
   |                                       |                       | ``412 Precondition Failed``           |
   |                                       |                       | error.                                |
   |                                       |                       |                                       |
   |                                       |                       | .. note::                             |
   |                                       |                       |                                       |   
   |                                       |                       |    If both the                        |
   |                                       |                       |    x-amz-copy-source-if-none-match    |
   |                                       |                       |    and                                |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since headers are present          |
   |                                       |                       |    in the request as follows:         |
   |                                       |                       |                                       |
   |                                       |                       |    x-amz-copy-source-if-none-match    |
   |                                       |                       |    condition evaluates to false and   |
   |                                       |                       |    x-amz-copy-source-if-unmodified-\  |
   |                                       |                       |    since condition evaluates to true, |
   |                                       |                       |    then S3 returns a                  |
   |                                       |                       |    ``412 Precondition Failed``        |
   |                                       |                       |    response code.                     |
   |                                       |                       |                                       |
   |                                       |                       | Default: None                         |
   +---------------------------------------+-----------------------+---------------------------------------+

Server-Side Encryption-Specific Request Headers
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If the source object is encrypted using server-side encryption with a customer-\
provided encryption key, you must use the following headers providing encryption
information so that S3 Connector can decrypt the object for copying.

.. tabularcolumns:: X{0.4\textwidth}lX{0.45\textwidth}
.. table::
   :widths: 35 10 55

   +-------------------------------------------------------------+--------+-------------------------------------------------------------+
   | Header                                                      | Type   | Description                                                 |
   +=============================================================+========+=============================================================+
   | x-amz-copy-source-server-side-encryption-customer-algorithm | String | Specifies algorithm to use when decrypting the source       |
   |                                                             |        | object.                                                     |
   |                                                             |        |                                                             |
   |                                                             |        | Default: None                                               |
   |                                                             |        |                                                             |
   |                                                             |        | Valid Values: ``AES256``                                    |
   |                                                             |        |                                                             |
   |                                                             |        | Constraints: Must be accompanied by valid                   |
   |                                                             |        | x-amz-copy-source-server-side-encryption-customer-key and   |
   |                                                             |        | x-amz-copy-source-server-side-encryption-customer-key-MD5   |
   |                                                             |        | headers.                                                    |
   +-------------------------------------------------------------+--------+-------------------------------------------------------------+
   | x-amz-copy-source-server-side-encryption-customer-key       | String | Specifies the customer-provided base-64-encoded encryption  |
   |                                                             |        | key for S3 Connector to use to decrypt the source object.   |
   |                                                             |        | The encryption key provided in this header must be one      |
   |                                                             |        | that was used when the source object was created.           |
   |                                                             |        |                                                             |
   |                                                             |        | Default: None                                               |
   |                                                             |        |                                                             |
   |                                                             |        | Constraints: Must be accompanied by valid                   |
   |                                                             |        | x-amz-copy-source-server-side-encryption-customer-algorithm |
   |                                                             |        | and                                                         |
   |                                                             |        | x-amz-copy-source-server-side-encryption-customer-key-MD5   |
   |                                                             |        | headers.                                                    |
   +-------------------------------------------------------------+--------+-------------------------------------------------------------+
   | x-amz-copy-source-server-side-encryption-customer-key-MD5   | String | Specifies the base64-encoded 128-bit MD5 digest of the      |
   |                                                             |        | encryption key according to RFC 1321. S3 Connector uses     |
   |                                                             |        | this header for a message integrity check to ensure the     |
   |                                                             |        | encryption key was transmitted without error.               |
   |                                                             |        |                                                             |
   |                                                             |        | Default: None                                               |
   |                                                             |        |                                                             |
   |                                                             |        | Constraints: Must be accompanied by valid                   |
   |                                                             |        | x-amz-copy-source-server-side-encryption-customer-algorithm |
   |                                                             |        | and                                                         |
   |                                                             |        | x-amz-copy-source-server-side-encryption-customer-key       |
   |                                                             |        | headers.                                                    |
   +-------------------------------------------------------------+--------+-------------------------------------------------------------+

Request Elements
~~~~~~~~~~~~~~~~

The Upload Part - Copy operation does not return request elements.

Versioning
----------

If a bucket has versioning enabled, it is possible to have multiple
versions of the same object. By default, x-amz-copy-source identifies
the current version of the object to copy. If the current version is a
delete marker and a versionId is not specified in the x-amz-copy-source,
S3 Connector returns a 404 error, because the object does not exist. If versionId is
specified in the x-amz-copy-source and the versionId is a delete marker,
S3 Connector returns an HTTP 400 error, because a delete marker cannot be specified
as a version for the x-amz-copy-source.

Optionally, a specific version of the source object to copy can be
specified by adding the versionId subresource, as shown:

.. code::

   x-amz-copy-source: /bucket/object?versionId=version id

Responses
---------

Response Headers
~~~~~~~~~~~~~~~~

Implementation of the Upload Part - Copy operation can include the
following response headers in addition to the response headers that are
common to all operations (refer to :ref:`Common Response Headers`).

.. tabularcolumns:: X{0.4\textwidth}lX{0.45\textwidth}
.. table::
   :widths: 35 10 55
   :class: longtable

   +-------------------------------------------------+-----------------------+------------------------------+
   | Header                                          | Type                  | Description                  |
   +=================================================+=======================+==============================+
   | x-amz-copy-source-version-id                    | String                | The version of the           |
   |                                                 |                       | source object that           |
   |                                                 |                       | was copied, if you           |
   |                                                 |                       | have enabled                 |
   |                                                 |                       | versioning on the            |
   |                                                 |                       | source bucket.               |
   +-------------------------------------------------+-----------------------+------------------------------+
   | x-amz-server-side-encryption                    | String                | If you specified             |
   |                                                 |                       | server-side                  |
   |                                                 |                       | encryption either            |
   |                                                 |                       | with an AWS KMS or           |
   |                                                 |                       | S3 Connector-managed         |
   |                                                 |                       | encryption key in            |
   |                                                 |                       | your initiate                |
   |                                                 |                       | multipart upload             |
   |                                                 |                       | request, the response        |
   |                                                 |                       | includes this header.        |
   |                                                 |                       | It confirms the              |
   |                                                 |                       | encryption algorithm         |
   |                                                 |                       | that S3 Connector used       |
   |                                                 |                       | to encrypt the               |
   |                                                 |                       | object.                      |
   +-------------------------------------------------+-----------------------+------------------------------+
   | x-amz-server-side-encryption-aws-kms-key-id     | String                | If the                       |
   |                                                 |                       | x-amz-server-side-encryption |
   |                                                 |                       | is present and has           |
   |                                                 |                       | the value of aws:kms,        |
   |                                                 |                       | this header specifies        |
   |                                                 |                       | the ID of the AWS Key        |
   |                                                 |                       | Management Service           |
   |                                                 |                       | (KMS) master                 |
   |                                                 |                       | encryption key that          |
   |                                                 |                       | was used for the             |
   |                                                 |                       | object.                      |
   +-------------------------------------------------+-----------------------+------------------------------+
   | x-amz-server-side-encryption-customer-algorithm | String                | If server-side               |
   |                                                 |                       | encryption with              |
   |                                                 |                       | customer-provided            |
   |                                                 |                       | encryption keys              |
   |                                                 |                       | encryption was               |
   |                                                 |                       | requested, the               |
   |                                                 |                       | response will include        |
   |                                                 |                       | this header                  |
   |                                                 |                       | confirming the               |
   |                                                 |                       | encryption algorithm         |
   |                                                 |                       | used.                        |
   |                                                 |                       |                              |
   |                                                 |                       | Valid Values:                |
   |                                                 |                       | ``AES256``                   |
   +-------------------------------------------------+-----------------------+------------------------------+
   | x-amz-server-side-encryption-customer-key-MD5   | String                | If server-side               |
   |                                                 |                       | encryption with              |
   |                                                 |                       | customer-provided            |
   |                                                 |                       | encryption keys              |
   |                                                 |                       | encryption was               |
   |                                                 |                       | requested, the               |
   |                                                 |                       | response includes            |
   |                                                 |                       | this header to               |
   |                                                 |                       | provide roundtrip            |
   |                                                 |                       | message integrity            |
   |                                                 |                       | verification of the          |
   |                                                 |                       | customer-provided            |
   |                                                 |                       | encryption key.              |
   +-------------------------------------------------+-----------------------+------------------------------+

Response Elements
~~~~~~~~~~~~~~~~~

The Upload Part - Copy operation can return the following XML elements
of the response (includes XML containers):

.. tabularcolumns:: llL
.. table::
   :widths: auto

   +----------------+-----------+----------------------------------------------+
   | Element        | Type      | Description                                  |
   +================+===========+==============================================+
   | CopyPartResult | container | Container for all response elements.         |
   |                |           |                                              |
   |                |           | Ancestor: None                               |
   +----------------+-----------+----------------------------------------------+
   | ETag           | string    | Returns the Etag of the new part.            |
   +----------------+-----------+----------------------------------------------+
   | LastModified   | string    | Returns the date the part was last modified. |
   +----------------+-----------+----------------------------------------------+

.. warning::

  Part boundaries are factored into ETag calculations, so if the part
  boundary on the source is different than on the destination, then the
  ETag data will not match between the two. However, data integrity checks
  are performed with each copy to ensure that the data written to the
  destination matches the data at the source.

Special Errors
~~~~~~~~~~~~~~

.. tabularcolumns:: LL
.. table::
   :widths: auto

   +-----------------------------------+-----------------------------------+
   | Error                             | Description                       |
   +===================================+===================================+
   | NoSuchUpload error (HTTP 404 Not  | The specified multipart upload    |
   | Found status code)                | does not exist. The upload ID     |
   |                                   | might be invalid, or the          |
   |                                   | multipart upload might have been  |
   |                                   | aborted or completed.             |
   +-----------------------------------+-----------------------------------+
   | InvalidRequest (HTTP 400 Bad      | The specified copy source is not  |
   | Request status code)              | supported as a byte-range copy    |
   |                                   | source.                           |
   +-----------------------------------+-----------------------------------+

Examples
--------

PUT Request Uploading One Part of a Multipart Upload
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request Sample A
^^^^^^^^^^^^^^^^

The PUT request uploads a part — part number 2 — in a multipart upload.
The request specifies a byte range from an existing object as the source
of this upload. The request includes the upload ID received in response
to an :ref:`Initiate Multipart Upload` request.

.. code::

   PUT /{{objectName}}?partNumber={{partNumber}}&uploadId={{uploadId}} HTTP/1.1
   Host: {{BucketName}}.s3.example.com
   x-amz-copy-source: /{{sourceBucket}}/{{sourceObject}}
   x-amz-copy-source-range:bytes={{first-Last}}
   x-amz-copy-source-if-match: {{etag}}
   x-amz-copy-source-if-none-match: {{etag}}
   x-amz-copy-source-if-unmodified-since: {{timeStamp}}
   x-amz-copy-source-if-modified-since: {{timeStamp}}
   Date: {{date}}
   Authorization: {{authorizationString}}

Response Sample A
^^^^^^^^^^^^^^^^^

The response includes the ETag header, a value that is needed for
sending the :ref:`Complete Multipart Upload` request.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Vvag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date:  Mon, 7 Nov 2016 20:34:56 GMT
   Server: ScalityS3

.. code::

   <CopyPartResult>
   <LastModified>2009-10-28T22:32:00</LastModified>
   <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   </CopyPartResult>

Request Sample B
^^^^^^^^^^^^^^^^

The PUT request uploads a part (part number 2) in a multipart upload.
The request does not specify the optional byte range header, but
requests the entire source object copy as part 2. The request includes
the upload ID received in response to an :ref:`Initiate Multipart
Upload` request.

.. code::

   PUT /newobject?partNumber=2&uploadId=VCVsb2FkIElEIGZvciBlbZZpbmcncyBteS1tb3ZpZS5tMnRzIHVwbG9hZR HTTP/1.1
   Host: example-bucket.s3.example.com
   Date:  Mon, 7 Nov 2016 20:34:56 GMT
   x-amz-copy-source: /source-bucket/sourceobject
   Authorization: {{authorizationString}}
   Sample Response

Response Sample B
^^^^^^^^^^^^^^^^^

.. note::

  The Request Sample B response structure is similar to the one specified
  in Response Sample A.

Request Sample C
^^^^^^^^^^^^^^^^

The PUT request uploads a part (part number 2) in a multipart upload.
The request specifies a specific version of the source object to copy by
adding the versionId subresource. The byte range requests 6MB of data,
starting with byte 500, as the part to be uploaded.

.. code::

   PUT /newobject?partNumber=2&uploadId=VCVsb2FkIElEIGZvciBlbZZpbmcncyBteS1tb3ZpZS5tMnRzIHVwbG9hZR HTTP/1.1
   Host: example-bucket.s3.example.com
   Date:  Mon, 7 Nov 2016 20:34:56 GMT
   x-amz-copy-source: /source-bucket/sourceobject?versionId=3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   x-amz-copy-source-range:bytes=500-6291456
   Authorization: {{authorizationString}}

Response Sample C
^^^^^^^^^^^^^^^^^

The response includes the ETag header, a value that is needed for
sending the :ref:`Complete Multipart
Upload` request.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Vvag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   x-amz-copy-source-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   Date:  Mon, 7 Nov 2016 20:34:56 GMT
   Server: ScalityS3

.. code::

   <CopyPartResult>
   <LastModified>2009-10-28T22:32:00</LastModified>
   <ETag>"9b2cf535f27731c974343645a3985328"</ETag>
   </CopyPartResult>
