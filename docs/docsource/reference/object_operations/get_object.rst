.. _GET Object:

GET Object
==========

To use GET Object, it is necessary to have READ access to the target
object. If READ access is granted to an anonymous user, the object can
be returned without using an authorization header.

By default, the GET Object operation returns the current version of an
object. To return a different version, use the versionId subresource.

.. tip::

  If the current version of the object is a delete marker, Zenko behaves
  as if the object was deleted and includes x-amz-delete-marker: true in
  the response.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /ObjectName HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}
   Range:bytes={{byteRange}}

Parameters
~~~~~~~~~~

Values for a set of response headers can be overridden in the GET Object
response using the query parameters listed in the following table. These
response header values are sent only on a successful request, one in
which a status code *200 OK* is returned. The set of headers that can be
overridden using these parameters is a subset of the headers that Zenko
accepts when an object is created, including ``Content-Type``,
``Content-Language``, ``Expires``, ``Cache-Control``,
``Content-Disposition``, and ``Content-Encoding``.

.. note::

  In using these parameters it is necessary to sign the request, either
  with an Authorization header or a pre-signed URL. They cannot be used
  with an unsigned (anonymous) request.

.. tabularcolumns:: X{0.35\textwidth}X{0.10\textwidth}X{0.50\textwidth}
.. table::

   +----------------------------------+--------+--------------------------------------+
   | Parameter                        | Type   | Description                          |
   +==================================+========+======================================+
   | ``response-content-type``        | string | Sets the ``Content-Type`` header of  |
   |                                  |        | the response                         |
   |                                  |        |                                      |
   |                                  |        | **Default:** None                    |
   +----------------------------------+--------+--------------------------------------+
   | ``response-content-language``    | string | Sets the ``Content-Language`` header |
   |                                  |        | of the response                      |
   |                                  |        |                                      |
   |                                  |        | **Default:** None                    |
   +----------------------------------+--------+--------------------------------------+
   | ``response-expires``             | string | Sets the ``Expires`` header of the   |
   |                                  |        | response                             |
   |                                  |        |                                      |
   |                                  |        | **Default:** None                    |
   +----------------------------------+--------+--------------------------------------+
   | ``response-cache-control``       | string | Sets the ``Cache-Control`` header of |
   |                                  |        | the response                         |
   |                                  |        |                                      |
   |                                  |        | **Default:** None                    |
   +----------------------------------+--------+--------------------------------------+
   | ``response-content-disposition`` | string | Sets the ``Content-Disposition``     |
   |                                  |        | header of the response               |
   |                                  |        |                                      |
   |                                  |        | **Default:** None                    |
   +----------------------------------+--------+--------------------------------------+
   | ``response-content-encoding``    | string | Sets the ``Content-Encoding`` header |
   |                                  |        | of the response                      |
   |                                  |        |                                      |
   |                                  |        | **Default:** None                    |
   +----------------------------------+--------+--------------------------------------+

Additional Parameters
~~~~~~~~~~~~~~~~~~~~~

Versioning
``````````

By default, the GET operation returns the current version of an object.
To return a different version, use the versionId subresource.

PartNumber
``````````

The PartNumber parameter requests the part number of the object being
read. This is a positive integer between 1 and 10,000, and effectively
performs a “ranged” GET request for the part specified. This is useful
for downloading just a part of an object that was originally put by
multipart upload.

Headers
~~~~~~~

The GET Object operation can use a number of optional request headers in
addition to those that are common to all operations (see :ref:`Common Request
Headers`).

.. tabularcolumns:: X{0.25\textwidth}X{0.10\textwidth}X{0.60\textwidth}
.. table::

   +-------------------------+--------+----------------------------------------+
   | Header                  | Type   | Description                            |
   +=========================+========+========================================+
   | ``If-Modified-Since``   | string | Return the object only if it has been  |
   |                         |        | modified since the specified time,     |
   |                         |        | otherwise return a ``304`` (not        |
   |                         |        | modified).                             |
   |                         |        |                                        |
   |                         |        | **Default:** None                      |
   |                         |        |                                        |
   |                         |        | **Constraints:** None                  |
   +-------------------------+--------+----------------------------------------+
   | ``If-Unmodified-Since`` | string | Return the object only if it has not   |
   |                         |        | been modified since the specified      |
   |                         |        | time, otherwise return a ``412``       |
   |                         |        | (precondition failed).                 |
   |                         |        |                                        |
   |                         |        | **Default:** None                      |
   |                         |        |                                        |
   |                         |        | **Constraints:** None                  |
   +-------------------------+--------+----------------------------------------+
   | ``If-Match``            | string | Return the object only if its entity   |
   |                         |        | tag (ETag) is the same as the one      |
   |                         |        | specified; otherwise, return a ``412`` |
   |                         |        | (precondition failed).                 |
   |                         |        |                                        |
   |                         |        | **Default:** None                      |
   |                         |        |                                        |
   |                         |        | **Constraints:** None                  |
   +-------------------------+--------+----------------------------------------+
   | ``If-None-Match``       | string | Return the object only if its entity   |
   |                         |        | tag (ETag) is different from the one   |
   |                         |        | specified; otherwise, return a ``304`` |
   |                         |        | (not modified)                         |
   |                         |        |                                        |
   |                         |        | **Default:** None                      |
   |                         |        |                                        |
   |                         |        | **Constraints:** None                  |
   +-------------------------+--------+----------------------------------------+

Elements
~~~~~~~~

The GET Object operation does not use request elements.

Responses
---------

Headers
~~~~~~~

.. tabularcolumns:: X{0.40\textwidth}X{0.10\textwidth}X{0.45\textwidth}
.. table::

   +-------------------------------------+---------+---------------------------+
   | Header                              | Type    | Description               |
   +=====================================+=========+===========================+
   | ``x-amz-delete-marker``             | Boolean | Specifies whether the     |
   |                                     |         | object retrieved was      |
   |                                     |         | (true) or was not (false) |
   |                                     |         | a delete marker. If       |
   |                                     |         | false, the response       |
   |                                     |         | header does not appear in |
   |                                     |         | the response.             |
   |                                     |         |                           |
   |                                     |         | **Valid Values:**         |
   |                                     |         | ``true`` \| ``false``     |
   |                                     |         |                           |
   |                                     |         | **Default:** ``false``    |
   +-------------------------------------+---------+---------------------------+
   | ``x-amz-meta-\*``                   | string  | Headers starting with     |
   |                                     |         | this prefix are user-\    |
   |                                     |         | defined metadata, each of |
   |                                     |         | which is stored and       |
   |                                     |         | returned as a set of      |
   |                                     |         | key-value pairs. Zenko    |
   |                                     |         | does not validate or      |
   |                                     |         | interpret user-defined    |
   |                                     |         | metadata.                 |
   +-------------------------------------+---------+---------------------------+
   | ``x-amz-version-id``                | string  | Returns the version ID of |
   |                                     |         | the retrieved object if   |
   |                                     |         | it has a unique version   |
   |                                     |         | ID.                       |
   |                                     |         |                           |
   |                                     |         | **Default:** None         |
   +-------------------------------------+---------+---------------------------+
   | ``x-amz-website-redirect-location`` | string  | When a bucket is          |
   |                                     |         | configured as a website,  |
   |                                     |         | this metadata can be set  |
   |                                     |         | on the object so the      |
   |                                     |         | website endpoint will     |
   |                                     |         | evaluate the request for  |
   |                                     |         | the object as a 301       |
   |                                     |         | redirect to another       |
   |                                     |         | object in the same bucket |
   |                                     |         | or an external URL.       |
   |                                     |         |                           |
   |                                     |         | **Default:** None         |
   +-------------------------------------+---------+---------------------------+

Elements
~~~~~~~~

The GET Object operation does not return response elements.

Examples
--------

Returning the Object "my-document.pdf"
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   GET /my-document.pdf HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Wed, 12 Oct 2009 17:50:00 GMT
   ETag: "fba9dede5f27731c9771645a39863328"
   Content-Length: 434234
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3
   [434234 bytes of object data]

*If the Latest Object is a Delete Marker:*

.. code::

   HTTP/1.1 404 Not Found
   x-amz-request-id: 318BC8BC148832E5
   x-amz-id-2: eftixk72aD6Ap51Tnqzj7UDNEHGran
   x-amz-version-id: 3GL4kqtJlcpXroDTDm3vjVBH40Nr8X8g
   x-amz-delete-marker:  true
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3

The delete marker returns a 404 Not Found error.

Getting a Specified Version of an Object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   GET /myObject?versionId=3/L4kqtJlcpXroDTDmpUMLUo HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap54OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   x-amz-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3QBpUMLUo
   ETag: "fba9dede5f27731c9771645a39863328"
   Content-Length: 434234
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3
   [434234 bytes of object data]

Specifying All Query String Parameters, Overriding Response Header Values
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   GET /Junk3.txt?response-cache-control=No-cache&amp;response-content-disposition=attachment%3B%20filename%3Dtesting.txt&amp;response-content-encoding=x-gzip&amp;response-content-language=mi%2C%20en&amp;response-expires=Thu%2C%2001%20Dec%201994%2016:00:00%20GMT HTTP/1.1
   x-amz-date: Sun, 19 Dec 2010 01:53:44 GMT
   Accept: */*
   Authorization: AWS AKIAIOSFODNN7EXAMPLE:aaStE6nKnw8ihhiIdReoXYlMamW=

Response
````````

In the sample, the header values are set to the values specified in the true
request.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: SIidWAK3hK+Il3/Qqiu1ZKEuegzLAAspwsgwnwygb9GgFseeFHL5CII8NXSrfWW2
   x-amz-request-id: 881B1CBD9DF17WA1
   Date: Sun, 19 Dec 2010 01:54:01 GMT
   x-amz-meta-param1: value 1
   x-amz-meta-param2: value 2
   Cache-Control: No-cache
   Content-Language: mi, en
   Expires: Thu, 01 Dec 1994 16:00:00 GMT
   Content-Disposition: attachment; filename=testing.txt
   Content-Encoding: x-gzip
   Last-Modified: Fri, 17 Dec 2010 18:10:41 GMT
   ETag: "0332bee1a7bf845f176c5c0d1ae7cf07"
   Accept-Ranges: bytes
   Content-Type: text/plain
   Content-Length: 22
   Server: ScalityS3
   [object data not shown]

Request with a Range Header
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

The request specifies the HTTP Range header to retrieve the first 10
bytes of an object.

.. code::

   GET /example-object HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   x-amz-date: Fri, 28 Jan 2011 21:32:02 GMT
   Range: bytes=0-9
   Authorization: AWS AKIAIOSFODNN7EXAMPLE:Yxg83MZaEgh3OZ3l0rLo5RTX11o=
   Sample Response with Specified Range of the Object Bytes

  .. note::

    Zenko does not support retrieving multiple ranges of data per GET request.

Response
````````

In the sample, the header values are set to the values specified in the
true request.

.. code::

   HTTP/1.1 206 Partial Content
   x-amz-id-2: MzRISOwyjmnupCzjI1WC06l5TTAzm7/JypPGXLh0OVFGcJaaO3KW/hRAqKOpIEEp
   x-amz-request-id: 47622117804B3E11
   Date: Fri, 28 Jan 2011 21:32:09 GMT
   x-amz-meta-title: the title
   Last-Modified: Fri, 28 Jan 2011 20:10:32 GMT
   ETag: "b2419b1e3fd45d596ee22bdf62aaaa2f"
   Accept-Ranges: bytes
   Content-Range: bytes 0-9/443
   Content-Type: text/plain
   Content-Length: 10
   Server: ScalityS3
   [10 bytes of object data]
