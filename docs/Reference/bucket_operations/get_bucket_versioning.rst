.. _GET Bucket Versioning:

GET Bucket Versioning
=====================

The GET Bucket Versioning operation uses the versioningsubresource to
return the versioning state of a bucket.

.. note::

  Only the bucket owner can retrieve the versioning state of a bucket.

+-----------------------------------+-------------------------------------------------------------------------------+
| Versioning State                  | Response                                                                      |
+===================================+===============================================================================+
| versioning is enabled on a bucket | | ``<VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">`` |
|                                   | |  ``<Status>Enabled</Status>``                                               |
|                                   | | ``</VersioningConfiguration>``                                              |
+-----------------------------------+-------------------------------------------------------------------------------+
| versioning is suspended on a      | | ``<VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">`` |
| bucket                            | |  ``<Status>Suspended</Status>``                                             |
|                                   | | ``</VersioningConfiguration>``                                              |
+-----------------------------------+-------------------------------------------------------------------------------+
| versioning has not been enabled   | ``<VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/"/>``  |
| (or suspended) on a bucket        |                                                                               |
+-----------------------------------+-------------------------------------------------------------------------------+

Requests
--------

**Request Syntax**

.. code::

   GET /?versioning HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Current-Length: {{length}}
   Authorization: {{authenticationInformation}}

**Request Parameters**

The GET Bucket Versioning operation does not use Request Parameters.

**Request Headers**

The GET Bucket Versioning operation uses only request headers that are
common to all operations (refer to :ref:`Common Request Headers`).

**Request Elements**

Implementation of the GET Bucket Versioning operation does not use
request elements.

Responses
---------

**Response Headers**

Implementation of the GET Bucket Versioning operation returns the
following response elements.

**Response Elements**

+-----------------------+-----------------------+-----------------------+
| Element               | Type                  | Description           |
+=======================+=======================+=======================+
| Status                | enum                  | The versioning state  |
|                       |                       | of the bucket.        |
|                       |                       |                       |
|                       |                       | Valid Values:         |
|                       |                       | Disabled \| Enabled   |
|                       |                       |                       |
|                       |                       | Ancestors:            |
|                       |                       | VersioningConfigurati |
|                       |                       | on                    |
+-----------------------+-----------------------+-----------------------+
| VersioningConfigurati | Container             | Container for the     |
| on                    |                       | status response       |
|                       |                       | element.              |
+-----------------------+-----------------------+-----------------------+

Examples
--------

The example offered returns the versioning state of myBucket.

*Request Sample*

.. code::

   GET /?versioning HTTP/1.1
   Host: myBucket.s3.scality.com
   Date: Tue, 13 Dec 2011 19:14:42 GMT
   Authorization: {{authenticationInformation}}
   Content-Type: text/plain

*Request Sample*

.. code::

   <VersioningConfiguration xmlns="http://s3.scality.com/">
     <Status>Enabled</Status>
   </VersioningConfiguration>
