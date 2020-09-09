.. _GET Object Retention:

GET Object Retention
====================

Retrieves an object's retention settings.

Request Syntax
--------------

::

   GET /<object-key>?retention&versionId=<version-id> HTTP/1.1
   Host: <bucket-name>.s3.amazonaws.com
   Date: <Thu, 15 Nov 2016 00:17:21 GMT>
   Authorization: <authorization-string> (see Authenticating Requests (AWS Signature Version 4))

URI Request Parameters
^^^^^^^^^^^^^^^^^^^^^^

``versionId``

    The version ID for the object whose retention settings you want to retrieve.

Request Body
^^^^^^^^^^^^

There is no request body for this request.

Response Syntax
---------------

.. code::
   
   <Retention>
      <Mode><value></Mode>
      <RetainUntilDate><value></RetainUntilDate>
   </Retention>
   

Response Elements
^^^^^^^^^^^^^^^^^

On success, the service returns an HTTP 200 response.
