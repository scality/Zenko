.. _Bucket CORS Specification:

Bucket CORS Specification
=========================

Zenko implements the `AWS S3 Bucket CORS APIs <http://docs.aws.amazon.com/AmazonS3/latest/dev/cors.html>`__.

Preflight CORS Requests
-----------------------

A preflight request with the HTTP OPTIONS method can be made against Zenko to
determine whether CORS requests are permitted on a bucket before sending
the actual request. (For detailed information on the preflight request
and response, refer to `OPTIONS
object <http://docs.aws.amazon.com/AmazonS3/latest/API/RESTOPTIONSobject.html>`__.)

.. warning::

  If a number of rules are specified, the first one matching the preflight
  request Origin, Access-Control-Request-Method header and
  Access-Control-Request-Headers header is the rule used to determine
  response headers that are relevant to CORS (the same behavior as AWS).

CORS Headers in Non-Options Requests and AWS Compatibility
----------------------------------------------------------

With the exception Access-Control-Allow-Headers, CORS-relevant response
headers are sent in response to regular API calls if those requests
possess the Origin header and are permitted by a CORS Configuration on
the bucket.

.. note::

  As responding with CORS headers requires making a call to metadata to
  retrieve the bucket’s CORS configuration, the CORS headers are not
  returned if the request encounters an error before the API method
  retrieves the bucket from metadata (if, for example, a request is not
  properly authenticated). Such behavior deviates slightly from AWS, in
  favor of performance, anticipating that the preflight OPTIONS route will
  serve most client needs regarding CORS. In the event that a number of
  rules are specified, the first one matching the request Origin and HTTP
  method is the rule used to determine response headers that are relevant
  to CORS (the same behavior as AWS).
