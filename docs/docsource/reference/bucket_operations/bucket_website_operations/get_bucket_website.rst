.. _GET Bucket Website:

GET Bucket Website
==================

Use the GET Bucket Website operation to retrieve a bucket website
configuration. This GET operation requires the S3:GetBucketWebsite
permission.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /?website HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Content-Length: {{length}}
   Authorization: {{authenticationInformation}}

.. note::

  The Request Syntax illustrates only a portion of the request headers.

Parameters
~~~~~~~~~~

The GET Bucket Website operation does not use Request Parameters.

Headers
~~~~~~~

The GET Bucket Website operation uses only request headers that are
common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

This operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The GET Bucket Website operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

The PUT Bucket Website response XML includes same elements that were
uploaded when you configured the bucket as website. For more
information, refer to :ref:`PUT Bucket Website`.

Examples
--------

Request
~~~~~~~

.. code::

   GET / HTTP/1.1
   Host: example.com
   Date: Mon, 15 Feb 2016 15:30:07 GMT
   Authorization: {{authenticationInformation}}

Response
~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: YgIPIfBiKa2bj0KMgUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 3848CD259D811111
   Date: Thu, 27 Jan 2011 00:49:26 GMT
   Content-Length: 240
   Content-Type: application/xml
   Transfer-Encoding: chunked
   Server: AmazonS3

   .. code::


   <?xml version="1.0" encoding="UTF-8"?>
   <WebsiteConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">
     <IndexDocument>
       <Suffix>index.html</Suffix>
     </IndexDocument>
     <ErrorDocument>
       <Key>404.html</Key>
     </ErrorDocument>
   </WebsiteConfiguration>
