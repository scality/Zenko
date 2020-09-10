.. _Common Request Headers:

Common Request Headers
======================

All request headers are passed as strings, but are not enclosed in
quotation marks. They must be listed on separate lines, and each header
included in the request signature must be followed by a newline marker
(\n) in the signature string.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +--------------------------+-----------------------------------------------------+
   | Header                   | Description                                         |
   +==========================+=====================================================+
   | ``Authorization``        | information required for request authentication.    |
   +--------------------------+-----------------------------------------------------+
   | ``Content-Length``       | Length of the message (without the headers);        |
   |                          | required for PUTs and operations that load XML,     |
   |                          | such as logging and ACLs.                           |
   +--------------------------+-----------------------------------------------------+
   | ``Content-Type``         | The content type of the resource in case the        |
   |                          | request content in the body (e.g., text/plain).     |
   +--------------------------+-----------------------------------------------------+
   | ``Content-MD5``          | The base64 encoded 128-bit MD5 digest of the        |
   |                          | message (without the headers; can be used as a      |
   |                          | message integrity check to verify that the data is  |
   |                          | the same data that was originally sent.             |
   +--------------------------+-----------------------------------------------------+
   | ``Date``                 | Current date and time according to the requester    |
   |                          | (e.g., ``Tues, 14 Jun 2011 08:30:00 GMT``); either  |
   |                          | the x-amz-date or the Date header must be specified |
   |                          | in the Authorization header                         |
   +--------------------------+-----------------------------------------------------+
   | ``Expect``               | When an application uses ``100-continue``, it does  |
   |                          | not send the request body until it receives an      |
   |                          | acknowledgment. If the message is rejected based on |
   |                          | the headers, the body of the message is not sent;   |
   |                          | can be used only if a body is being sent            |
   |                          |                                                     |
   |                          | **Valid Values:** ``100-continue``                  |
   +--------------------------+-----------------------------------------------------+
   | ``Host``                 | Host URI (e.g., s3.{{StorageService}}.com or        |
   |                          | {{BucketName}}.s3.{{StorageService}}.com); required |
   |                          | for HTTP 1.1, optional for HTTP/1.0 requests        |
   +--------------------------+-----------------------------------------------------+
   | ``x-amz-date``           | The current date and time according to the          |
   |                          | requester (e.g., ``Wed, 01 Mar 2006 12:00:00 GMT``);|
   |                          | either the x-amz-date or the Date header must be    |
   |                          | specified in the Authorization header (If both      |
   |                          | specified, the value specified for the x-amz-date   |
   |                          | header takes precedence).                           |
   +--------------------------+-----------------------------------------------------+
   | ``x-amz-security-token`` | Provide security token when using temporary         |
   |                          | security credential. When making requests using     |
   |                          | temporary security credentials obtained from IAM, a |
   |                          | security token must be provided using this header.  |
   +--------------------------+-----------------------------------------------------+

Using the Date Header as an “Expires” Field
-------------------------------------------

Query string authentication can be used for giving HTTP or browser
access to resources that require authentication. When using query string
authentication, an ``Expires`` field must be included in the header
request.

Properly speaking, ``Expires`` is not a common request header but a
sub-resource of the URL passed to a client. Use it in place of the
``Date header`` field when distributing a request with the query string
authentication mode. The ``Expires`` field indicates the number of
seconds from Unix Epoch time that a request signature remains valid.
