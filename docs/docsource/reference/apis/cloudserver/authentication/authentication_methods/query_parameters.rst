Query Parameters
================

Along with the Authorization request header, authentication information
can also be provided via query string parameters. This method is useful
for expressing requests entirely in a URL (referred to as presigning a
URL). A use case scenario for this is when it is necessary to grant
temporary access (e.g., a presigned URL can be embedded on a website or
alternatively used in a command line client to download objects).

Two approaches are available for authenticating S3 Connector requests using query parameters:

-  V2 Authentication—Query Parameters (based on AWS Signature Version 2)
-  V4 Authentication—Query Parameters (based on AWS Signature Version 4)

V2 Authentication—Query Parameters
----------------------------------

V2 Authentication—Query Parameters adheres to a strict step sequence in
performing authentication.

  #. Ensures the request is not expired by checking the Expires query
     parameter.
  #. Obtains the ``accessKey`` from the AWSAccessKeyID query parameter.
  #. Obtains the signature from the Signature query parameter.
  #. Builds the ``StringToSign``.

     .. code::

        HTTP-Verb + "\n" +
        Content-MD5 + "\n" +
        Content-Type + "\n" +
        Date (or Expiration for query Auth) + "\n" +
        CanonicalizedAmzHeaders +
        CanonicalizedResource;

  #. Performs UTF-8 encoding of the ``StringToSign``.
  #. Sends information to Vault:

     -  User-provided signature
     -  Encoded ``StringToSign``
     -  User ``accessKey``

  #. Vault processes the information provided and returns either a value
     either ``true`` (authentication confirmed, request moves forward) or
     ``false`` (request rejected).

     a. Vault pulls the ``secretKey`` for the user based on the
        ``accessKey``.
     b. Vault creates a digest, using an encryption algorithm (either
        HMAC-SHA1 or HMAC-SHA256, depending on the length of the signature
        in the request) with the ``secretKey`` and the utf8-encoded
        ``StringToSign`` as inputs.
     c. Vault Base64 encodes the digest, which results in the
        reconstructed signature.
     d. Vault compares the reconstructed signature with the signature
        provided by the request to confirm authentication.


V4 Authentication—Query Parameters
----------------------------------

V4 Authentication using query parameters is similar to V4 authentication
using authorization header, with the difference being that certain
values—\ ``scopeDate``, ``region``, ``accessKey``, and
``credentialScope``—are obtained from the query string.
