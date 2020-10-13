.. _GET Object Legal Hold:

GET Object Legal Hold
=====================

Get an object's current legal hold status.

Request Syntax
--------------

.. code::
   
   GET /<object-key>?legal-hold&versionId=<version-id> HTTP/1.1
   Host: <bucket-name>.s3.example.com
   Date: <Thu, 15 Nov 2016 00:17:21 GMT>
   Authorization: <authorization-string>

URI Request Parameters
^^^^^^^^^^^^^^^^^^^^^^

``versionId``

  The version ID for the object version whose legal hold status you want to retrieve.

Request Body
^^^^^^^^^^^^

The request does not have a request body.

Response Syntax
---------------

.. code::
   
   HTTP/1.1 200
   <?xml version="1.0" encoding="UTF-8"?>
   <LegalHold>
      <Status>string</Status>
   </LegalHold>

Response Elements
^^^^^^^^^^^^^^^^^

The service returns an HTTP ``200`` response on success.
