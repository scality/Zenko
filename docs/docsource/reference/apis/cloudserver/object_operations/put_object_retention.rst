.. _PUT Object Retention:

PUT Object Retention
====================

Configures the retention parameter on an object.

Request Syntax
--------------

.. code::

   PUT /<object-key>?retention&versionId=<version-id> HTTP/1.1
   Host: <bucket-name>.s3.example.com
   Date: <Thu, 15 Nov 2016 00:17:21 GMT>
   Authorization: <authorization-string>

URI Request Parameters
^^^^^^^^^^^^^^^^^^^^^^

``versionId``

    The version ID of the object to which you want to apply a retention period.

Request Body
^^^^^^^^^^^^

For more information about the request elements that this operation uses, see
`ObjectLockRetention
<https://docs.aws.amazon.com/AmazonS3/latest/API/archive-Type_API_ObjectLockRetention.html>`_.

**Example Request Body**

.. code::
   
   <Retention>
      <Mode>GOVERNANCE</Mode>
      <RetainUntilDate>2020-01-05T00:00:00.000Z</RetainUntilDate>
   </Retention>      

Response Syntax
---------------

  ``HTTP/1.1 200``

Response Elements
^^^^^^^^^^^^^^^^^

On success, the service returns an HTTP ``200`` response.
