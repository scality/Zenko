.. _GET Bucket Location:

GET Bucket Location
===================

The GET Bucket Location operation uses the locationsubresource to return
a bucket’s location. The bucket’s location is set up using the
LocationConstraint request parameter in a PUT Bucket request. Refer to :ref:`PUT Bucket`.

.. note::

  The possible options for a LocationConstraint are configured in the
  env_s3 setting of the S3 Configuration. For more information, refer to
  “Modifying the Group Variables (all) File” in Zenko Enterprise Installation.

Requests
--------

**Request Syntax**

.. code::

   GET /?location HTTP/1.1
   Host: {{BucketName}}.{{ConnectorName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

**Request Parameters**

The GET Bucket Location operation does not use Request Parameters.

**Request Headers**

Implementation of the GET Bucket Location operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).

**Request Elements**

The GET Bucket Location operation does not use request elements.

Responses
---------

**Response Headers**

Implementation of the GET Bucket Location operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

**Response Elements**

The GET Bucket Location operation can return the following XML elements
in the response:

+-----------------------+-----------------------+-----------------------+
| Element               | Type                  | Description           |
+=======================+=======================+=======================+
| LocationConstraint    | String                | Specifies the         |
|                       |                       | location of the       |
|                       |                       | bucket. The           |
|                       |                       | LocationConstraint    |
|                       |                       | parameter is          |
|                       |                       | configured in the     |
|                       |                       | env_s3 setting of the |
|                       |                       | S3 Configuration. For |
|                       |                       | more information,     |
|                       |                       | refer to “Modifying   |
|                       |                       | the Group Variables   |
|                       |                       | (all) File” in        |
|                       |                       | Zenko Enterprise      |
|                       |                       | Installation.         |
+-----------------------+-----------------------+-----------------------+

Examples
--------

*Request Sample*

.. code::

   GET /?location HTTP/1.1
   Host: myBucket.s3.scality.com
   Date: Thu, 31 Mar 2016 15:11:47 GMT
   Authorization: AWS pat:6nYhPMw6boadLgjywjSIyhfwRIA=

*Response Sample*

.. code::

   <xml version="1.0" encoding="UTF-8"?>
   <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">EU</LocationConstraint>
