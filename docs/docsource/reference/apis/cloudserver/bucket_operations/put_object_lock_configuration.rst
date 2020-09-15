.. _PUT Object Lock Configuration:

PUT Object Lock Configuration
=============================

Places an object lock configuration on the specified bucket. The rule specified
in the object lock configuration is applied by default to every new object
placed thereafter in the specified bucket.

.. warning::

   Cross-region replication is not supported on buckets with object lock
   enabled.

Request Syntax
--------------

.. code::

   PUT /?object-lock HTTP/1.1
   Host: <bucket-name>.s3.example.com
   Date: <Thu, 15 Nov 2016 00:17:21 GMT>
   Authorization: <authorization-string> (see Authenticating Requests (AWS Signature Version 4))

   <ObjectLockConfiguration>
      <ObjectLockEnabled><value></ObjectLockEnabled>
      <Rule>
         <DefaultRetention>
            <Mode><value></Mode>
            <Days><value></Days>
            <Years><value></Years>
         </DefaultRetention>
      </Rule>
   </ObjectLockConfiguration>

.. note::

   DefaultRetention is expressed either in days or in years. These are mutually
   exclusive.
   
URI Request Parameters
~~~~~~~~~~~~~~~~~~~~~~

This request uses no URI parameters.

Request Body
~~~~~~~~~~~~

For more information about the request elements that this operation uses, see
`ObjectLockConfiguration
<https://docs.aws.amazon.com/AmazonS3/latest/API/archive-Type_API_ObjectLockConfiguration.html>`_.

**Example Request Body**

.. code::
   
   <ObjectLockConfiguration>
      <ObjectLockEnabled>Enabled</ObjectLockEnabled>
      <Rule>
         <DefaultRetention>
            <Mode>GOVERNANCE</Mode>
            <Days>30</Days>
         </DefaultRetention>
      </Rule>
   </ObjectLockConfiguration>      

Response Syntax
---------------

.. code::

   HTTP/1.1 200

Response Elements
~~~~~~~~~~~~~~~~~

On success, the service returns an HTTP 200 response.
