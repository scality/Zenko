.. _GET Bucket Location:

GET Bucket Location
===================

The GET Bucket Location operation uses the locationsubresource to return
a bucket’s location. The bucket’s location is set up using the
LocationConstraint request parameter in a PUT Bucket request. Refer to :ref:`PUT Bucket`.

.. note::

  Location constraint options are configured in the ``env_s3`` setting during
  S3C configuration. See :ref:`Configuring the S3C Cluster` in :version-ref:`S3
  Connector
  Installation<https://documentation.scality.com/S3C/{version}/installation>`.

Requests
--------

Request Syntax
~~~~~~~~~~~~~~

.. code::

   GET /?location HTTP/1.1
   Host: {{BucketName}}.{{ConnectorName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

Request Parameters
~~~~~~~~~~~~~~~~~~

The GET Bucket Location operation does not use request parameters.

Request Headers
~~~~~~~~~~~~~~~

Implementation of the GET Bucket Location operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).

Request Elements
~~~~~~~~~~~~~~~~

The GET Bucket Location operation does not use request elements.

Responses
---------

Response Headers
~~~~~~~~~~~~~~~~

Implementation of the GET Bucket Location operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

Response Elements
~~~~~~~~~~~~~~~~~

The GET Bucket Location operation can return the following XML elements
in the response:

.. tabularcolumns:: llL
.. table::
   :widths: auto

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
   |                       |                       | S3 Connector          |
   |                       |                       | Installation.         |
   +-----------------------+-----------------------+-----------------------+

Examples
--------

*Request Sample*

.. code::

   GET /?location HTTP/1.1
   Host: myBucket.s3.example.com
   Date: Thu, 31 Mar 2016 15:11:47 GMT
   Authorization: AWS pat:6nYhPMw6boadLgjywjSIyhfwRIA=

*Response Sample*

.. code::

   <xml version="1.0" encoding="UTF-8"?>
   <LocationConstraint xmlns="http://s3.example.com/doc/2006-03-01/">EU</LocationConstraint>
