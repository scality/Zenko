.. _PUT Object Legal Hold:

PUT Object Legal Hold
=====================

Configures the specified object with a legal hold.

Request Syntax
--------------

.. code::
   
   PUT /<object-key>?legal-hold&versionId=<version-id> HTTP/1.1
   Host: <bucket-name>.s3.example.com
   Date: <Thu, 15 Nov 2016 00:17:21 GMT>
   Authorization: <authorization-string>

URI Request Parameters
~~~~~~~~~~~~~~~~~~~~~~

``versionId``

    The version ID of the object version on which you will put a legal hold.

Request Body
~~~~~~~~~~~~

For more information about the request elements that this operation uses, see
`ObjectLockLegalHold
<https://docs.aws.amazon.com/AmazonS3/latest/API/archive-Type_API_ObjectLockLegalHold.html>`_.

Example Request Body
~~~~~~~~~~~~~~~~~~~~

.. code::
   
   <LegalHold>
      <Status>ON</Status>
   </LegalHold>      

Response Syntax
---------------

::

   HTTP/1.1 200

Response Elements
~~~~~~~~~~~~~~~~~

On success, the service returns an HTTP 200 response. 
