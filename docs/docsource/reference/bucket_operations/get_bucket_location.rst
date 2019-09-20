.. _GET Bucket Location:

GET Bucket Location
===================

The GET Bucket Location operation uses the location subresource to return
a bucket’s location. The bucket’s location is set up using the
LocationConstraint request parameter in a PUT Bucket request. Refer to 
:ref:`PUT Bucket`.

.. note::

  The possible options for a LocationConstraint are configured in the
  env_s3 setting of the S3 configuration.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /?location HTTP/1.1
   Host: {{BucketName}}.{{ConnectorName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

Parameters
~~~~~~~~~~

The GET Bucket Location operation does not use request parameters.

Headers
~~~~~~~

The GET Bucket Location operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).

Elements
~~~~~~~~

The GET Bucket Location operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The GET Bucket Location operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

The GET Bucket Location operation can return the following XML elements
in the response:

.. tabularcolumns:: X{0.20\textwidth}X{0.10\textwidth}X{0.65\textwidth}
.. table::
   
   +------------------------+-----------------------+-----------------------+
   | Element                | Type                  | Description           |
   +========================+=======================+=======================+
   | ``LocationConstraint`` | String                | Specifies the         |
   |                        |                       | location of the       |
   |                        |                       | bucket. The           |
   |                        |                       | LocationConstraint    |
   |                        |                       | parameter is          |
   |                        |                       | configured in the     |
   |                        |                       | env_s3 setting of the |
   |                        |                       | S3 configuration.     |
   +------------------------+-----------------------+-----------------------+

Examples
--------

Request
~~~~~~~

.. code::

   GET /?location HTTP/1.1
   Host: myBucket.s3.scality.com
   Date: Thu, 31 Mar 2016 15:11:47 GMT
   Authorization: AWS pat:6nYhPMw6boadLgjywjSIyhfwRIA=

Response
~~~~~~~~

.. code::

   <xml version="1.0" encoding="UTF-8"?>
   <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">EU</LocationConstraint>
