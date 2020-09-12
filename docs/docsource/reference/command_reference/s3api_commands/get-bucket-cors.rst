.. _get-bucket-cors:

get-bucket-cors
===============

Returns the CORS configuration for the bucket.

See also: :ref:`GET Bucket CORS`.

Synopsis
--------

::

  get-bucket-cors
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command retrieves the Cross-Origin Resource Sharing configuration
for a bucket named "my-bucket"::

  aws s3api get-bucket-cors --bucket my-bucket

Output::

  {
     "CORSRules": [
        {
           "AllowedHeaders": [
              "*"
           ],
           "ExposeHeaders": [
              "x-amz-server-side-encryption"
           ],
           "AllowedMethods": [
              "PUT",
              "POST",
              "DELETE"
           ],
           "MaxAgeSeconds": 3000,
           "AllowedOrigins": [
              "http://www.example.com"
           ]
        },
        {
           "AllowedHeaders": [
              "Authorization"
           ],
           "MaxAgeSeconds": 3000,
           "AllowedMethods": [
              "GET"
           ],
           "AllowedOrigins": [
              "*"
           ]
        }
     ]
  }

Output
------

CORSRules -> (list)

  (structure)

    Specifies a cross-origin access rule for an S3 bucket.

    AllowedHeaders -> (list)

      Headers that are specified in the ``Access-Control-Request-Headers``
      header. These headers are allowed in a preflight OPTIONS request. In
      response to any preflight OPTIONS request, Zenko returns any requested
      headers that are allowed.

      (string)

    AllowedMethods -> (list)
    
      An HTTP method that you allow the origin to execute. Valid values are
      ``GET``, ``PUT``, ``HEAD``, ``POST``, and ``DELETE``.

      (string)

    AllowedOrigins -> (list)

      One or more origins you want customers to be able to access the bucket
      from.

      (string)

    ExposeHeaders -> (list)

      One or more headers in the response that you want customers to be able to
      access from their applications (for example, from a JavaScript
      ``XMLHttpRequest`` object).

      (string)

    MaxAgeSeconds -> (integer)

      The time in seconds that your browser is to cache the preflight response
      for the specified resource.
