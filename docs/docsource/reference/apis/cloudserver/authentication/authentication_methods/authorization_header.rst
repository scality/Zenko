Authorization Header
====================

Using the HTTP Authorization header is the most common method of
authenticating an request, and in fact all of the bucket and object
operations provide authentication information.

The API uses the standard HTTP Authorization header to pass
authentication information. (The name of the standard header is
unfortunate because it carries authentication information, not
authorization.) Under the S3 Connector authentication scheme, the Authorization
header has the following form:

.. code::

   Authorization: AWS {{AccessKeyId}}:{{Signature}}

An access key ID and secret access key can be issued for accounts or IAM
users. The recommended approach is to issue keys for IAM users and not
for accounts, and to grant users the permissions needed to access only
those resources they require.

As stated previously, the Signature part of the Authorization header
varies from request to request. If the request signature calculated by
the system matches the Signature included with the request, the
requester has demonstrated possession of the secret access key. The
request is then processed under the identity, and with the authority, of
the developer to whom the key was issued.

Two approaches are available for authenticating S3 Connector requests using the Authorization header:

-  V2 Authentication—Authorization Header (based on AWS Signature
   Version 2)
-  V4 Authentication—Authorization Header (based on AWS Signature
   Version 4)

.. note::

  **checkauth**

  If there is an Authorization header on the request object, the
  ``checkAuth`` operation determines whether V2
  Authentication—Authorization Header or V4 Authentication—Authorization
  Header is applicable by parsing the header string. If there is no
  Authorization header on the request object, ``checkAuth`` determines
  whether V2 Authentication—Query Parameters or V4 Authentication—Query
  Parameters is applicable by checking which query parameters are included
  on the request object.

V2 Authentication—Authorization Header
--------------------------------------

V2 Authentication—Headers adheres to a strict step sequence in
performing authentication.

  #. Ensures the request is not more than 15 minutes old, returning an
     error in the event the time restriction is exceeded.
  #. Obtains the accessKey and signature by parsing the string value of
     the Authorization header on the request object.
  #. Builds the StringToSign.

     .. code::

        HTTP-Verb + "\n" +
        Content-MD5 + "\n" +
        Content-Type + "\n" +
        Date (or Expiration for query Auth) + "\n" +
        CanonicalizedAmzHeaders +
        CanonicalizedResource;

  #. Performs UTF-8 encoding of the StringToSign.
  #. Sends information to Vault:

     -  User-provided signature
     -  Encoded ``StringToSign``
     -  User ``accessKey``

  #. Vault processes the information provided and returns a value either
     true (authentication confirmed, request moves forward) or false
     (request rejected).

     a. Vault pulls the secretKey for the user based on the accessKey.
     b. Vault creates a digest, using an encryption algorithm (either
        HMAC-SHA1 or HMAC-SHA256, depending on the length of the signature
        in the request) with the secretKey and the utf8-encoded
        StringToSign as inputs.
     c. Vault Base64 encodes the digest, which results in the
        reconstructed signature.
     d. Vault compares the reconstructed signature with the signature
        provided by the request to confirm authentication.

V4 Authentication—Authorization Header
--------------------------------------

V4 Authentication-Headers adheres to a strict step sequence in
performing authentication.

  #. Ensures the request timestamp matches the request date value of the
     Authorization header, returning an error in the event of a mismatch.
  #. Obtains the following values from the Authorization header:
     ``scopeDate``, ``LocationConstraint``, ``accessKey`` and
     ``credentialScope``.
  #. Checks that ``scopeDate`` falls within the previous seven days.
  #. Calculates the utf8-encoded ``stringToSign``.

     .. code::

        "AWS4-HMAC-SHA256" + "\n" +
        timeStampISO8601Format + "\n" +
        <Scope> + "\n" +
        Hex(SHA256Hash(<CanonicalRequest>))

     Where CanonicalRequest is:

     .. code::

        <HTTPMethod>\n
        <CanonicalURI>\n
        <CanonicalQueryString>\n
        <CanonicalHeaders>\n
        <SignedHeaders>\n
        <HashedPayload>

  #. Sends information to Vault:

     -  ``accessKey``
     -  ``signatureFromRequest``
     -  LocationConstraint
     -  ``scopeDate``
     -  ``stringToSign``

  #. Vault processes the information provided and in the event of
     authentication returns ``accessKey`` owner information (account
     canonicalID, account/user arn, associated email, etc.).

     a. Vault pulls the ``secretKey`` associated to the ``accessKey``
        value received from S3.

     b. Vault calculates the ``signingKey`` from the ``secretKey`` and the
        values received from S3:

        -  ``dateKey`` = HMAC-SHA256 ("AWS4" + "{{SecretAccessKey}}",
           "{{YYYYMMDD}}")

        -  ``dateRegionKey`` = HMAC-SHA256(dateKey, "{{aws-region}}")

        -  ``dateRegionServiceKey`` = HMAC-SHA256 (dateRegionKey,
           "{{awsservice}}")

        -  ``signingKey`` = HMAC-SHA256 (dateRegionServiceKey,
           "aws4_request")

     c. Vault computes its own version of the signature from
        ``stringToSign`` and ``signingKey`` as HMAC-SHA256
        (``signingKey``, ``stringToSign``)

     d. Vault compares the reconstructed signature with the signature
        provided by the request to confirm authentication.
