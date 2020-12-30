HTTP Conformity
---------------

|product| uses the HTTP 1.1 protocol as defined by RFC 2616. REST operations
consist of sending HTTP requests to |product|, which returns HTTP responses. These
HTTP requests contain a request method, a URI with an optional query string,
headers, and a body. The responses contain status codes, headers, and may
contain a response body.

S3 supports the REST API, accessed via requests that employ an XML-based
protocol. Input parameters are provided as an XML body (at the service level) or
as an XML array of entities (such as buckets, accounts, or users), plus a time
range (start and end times expressed as UTC epoch time stamps). Output is
delivered as an XML array, one element per entity. Bytes transferred and number
of operations metrics are accumulated between the provided start and end
times. For storage capacity, discrete values are returned in bytes for the start
and the end times (not as an average between start and end).

Because request headers and response headers can be specific to a particular
|product| API operation or set of operations, many such elements are common to all
operations.

Request headers typically found in |product| requests include Authorization,
Content-Length, Content-Type, Date, and Host.

.. tabularcolumns:: lL
.. table::
   :widths: 20 80

   +--------------------+------------------------------------------------------+
   | Header             | Description                                          |
   +====================+======================================================+
   | ``Authorization``  | Contains the information required for authentication.|
   +--------------------+------------------------------------------------------+
   | ``Content-Length`` | Message Length (without headers), as specified by    |
   |                    | RFC 2616; required for PUT and operations that load  |
   |                    | XML, such as logging and ACLs.                       |
   +--------------------+------------------------------------------------------+
   | ``Content-Type``   | Resource content type (e.g., text/plain) (For PUT    |
   |                    | operations, default is binary/octet-stream, and      |
   |                    | and valid values are MIME types.)                    |
   +--------------------+------------------------------------------------------+
   | ``Date``           | Date and time of the request (default format is      |
   |                    | ``Thu, 31 Mar 2016 13:00:00 GMT``, which conforms to |
   |                    | RFC 2616 Section 3.3.1).                             |
   +--------------------+------------------------------------------------------+
   | ``Host``           | Required for HTTP 1.1, the Host header points to the |
   |                    | standard storage service. If the host contains       |
   |                    | anything other than the standard storage server,     |
   |                    | this information is interpreted as the bucket for    |
   |                    | the request.                                         |
   |                    |                                                      |
   |                    | The Host header contains either the service host     |
   |                    | name or the virtual host (bucket.s3.bsedomain.com),  |
   |                    | in addition to the bucket.                           |
   +--------------------+------------------------------------------------------+

Important response headers that customarily comprise API operation responses
include ``HTTP/1.1``, ``x-amzn-request-id``, ``Content-Length``,
``Content-Type``, and ``Date``.

.. tabularcolumns:: llL
.. table::
   :widths: 20 10 70

   +-----------------------+--------+----------------------------------------------+
   | Header                | Type   | Description                                  |
   +=======================+========+==============================================+
   | ``HTTP/1.1``          | string | Header followed by a status code, with       |
   |                       |        | status code ``200`` indicating a successful  |
   |                       |        | operation. For error code information, see   |
   |                       |        | :ref:`API Error Codes (Client and Server     |
   |                       |        | Errors)`                                     |
   +-----------------------+--------+----------------------------------------------+
   | ``x-amzn-request-id`` | string | A |product|\-generated value that uniquely   |
   |                       |        | identifies a request. Values can be used to  |
   |                       |        | troubleshoot problems.                       |
   +-----------------------+--------+----------------------------------------------+
   | ``Content-Length``    | string | Length of response body in bytes.            |
   +-----------------------+--------+----------------------------------------------+
   | ``Content-Type``      | string | Message’s content type (typically            |
   |                       |        | ``application/hal+json``)                    |
   +-----------------------+--------+----------------------------------------------+
   | ``Date``              | string | Date and time of the response.               |
   +-----------------------+--------+----------------------------------------------+

.. note::

   For detail on common request headers refer to :ref:`Common Request Headers`,
   and for detail on common response headers refer to :ref:`Common Response
   Headers`.
