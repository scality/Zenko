.. _S3 API Errors:

S3 API Errors
=============

Two types of API error can occur when requests are sent to and responses are
received from the S3 API: client errors and server errors.

.. tabularcolumns:: lL
.. table::
   :widths: auto

   +---------------+-----------------------------------------------------------+
   | client errors | Indicated by a 4xx HTTP response code, client errors      |
   |               | indicate that |product| has uncovered a problem with the  |
   |               | client request (e.g., an authentication failure, missing  |
   |               | required parameters). Fix the issue in the client         |
   |               | application before resubmitting the request.              |
   +---------------+-----------------------------------------------------------+
   | server errors | Indicated by a 5xx HTTP response code, server errors must |
   |               | be resolved by Scality. Resubmit/retry the request until  |
   |               | it succeeds.                                              |
   +---------------+-----------------------------------------------------------+

Each API error returns the following values:

-  A status code (for example, ``400``)

-  An error code (for example, ``ValidationException``)

-  An error message (for example, ``Supplied AttributeValue is empty, must contain exactly one of the supported datatypes``)

.. _API Error Codes (Client and Server Errors):

API Error Codes (Client and Server Errors)
------------------------------------------

HTTP status codes indicate whether an operation is successful or not.

A response code of 2xx indicates that an operation was successful. Other
error codes indicate either a client error (4xx) or a server error
(5xx).

A number of S3 API errors can be resolved by retrying the request. Those that
cannot, however, must be fixed on the client side before submitting new
requests.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +------------+--------------------------------------+-------+
   | Error Code | Code Description                     | Retry |
   +============+======================================+=======+
   | 400        | Bad Request Exception                | No    |
   +------------+--------------------------------------+-------+
   | 400        | Limit Exceeded Exception             | No    |
   +------------+--------------------------------------+-------+
   | 401        | Unauthorized Exception               | No    |
   +------------+--------------------------------------+-------+
   | 404        | Not Found Exception                  | No    |
   +------------+--------------------------------------+-------+
   | 409        | Conflict Exception                   | No    |
   +------------+--------------------------------------+-------+
   | 429        | Too Many Requests Exception          | Yes   |
   +------------+--------------------------------------+-------+
   | 503        | Service Unavailable Exception        | Yes   |
   +------------+--------------------------------------+-------+
   | 504        | Endpoint Request Timed-out Exception | Yes   |
   +------------+--------------------------------------+-------+

Sample Error Response
~~~~~~~~~~~~~~~~~~~~~

The following HTTP response example indicates that the value for
inputBucket was ``null``, which is not a valid value.

.. code::

   HTTP/1.1 400 Bad Request
   x-amzn-RequestId: b0e91dc8-3807-11e2-83c6-5912bf8ad066
   x-amzn-ErrorType: ValidationException
   Content-Type: application/json
   Content-Length: 124
   Date: Mon, 26 Nov 2012 20:27:25 GMT
   {"message":"1 validation error detected: Value null at 'InstallS3Bucket' failed to satisfy constraint: Member must not be null"}

Error Retries and Exponential Backoff
-------------------------------------

Many network components (such as DNS servers, switches, load balancers)
can generate errors within the breadth of a given request.

Error Retries
~~~~~~~~~~~~~

The usual technique for dealing with error responses in a
networked environment is to implement retries in the client application,
a technique that increases the reliability of the application and
reduces operational costs for the developer.

Original requests that receive server errors (5xx) should be retried.
However, client errors (4xx, other than a ``TooManyRequestsException``)
indicate that a request must be revised before it is retried.

Exponential Backoff
~~~~~~~~~~~~~~~~~~~

In addition to simple retries, Scaility recommends using an exponential
backoff algorithm for better flow control, thus implementing
progressively longer waits between retries for consecutive error
responses. For example, allow one second to elapse prior to the first
retry, four seconds prior to the second retry, 16 seconds prior to the
third retry, and so forth.

Requests that fail after a minute can indicate a hard limit issue (the
maximum number of allowed pipelines may have been reached, for example),
and thus the maximum number of retries should be set for sixty seconds.
