.. _GET Bucket Versioning:

GET Bucket Versioning
=====================

The GET Bucket Versioning operation uses the versioningsubresource to
return the versioning state of a bucket.

.. note::

  Only the bucket owner can retrieve the versioning state of a bucket.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +-----------------------------------+------------------------------------------------------------------------------+
   | Versioning State                  | Response                                                                     |
   +===================================+==============================================================================+
   | Versioning is enabled on a bucket | ``<VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">``  |
   |                                   | ``<Status>Enabled</Status>``                                                 |
   |                                   | ``</VersioningConfiguration>``                                               |
   +-----------------------------------+------------------------------------------------------------------------------+
   | Versioning is suspended on a      | ``<VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">``  |
   | bucket                            | ``<Status>Suspended</Status>``                                               |
   |                                   | ``</VersioningConfiguration>``                                               |
   +-----------------------------------+------------------------------------------------------------------------------+
   | Versioning has not been enabled   | ``<VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/"/>`` |
   | (or suspended) on a bucket        |                                                                              |
   +-----------------------------------+------------------------------------------------------------------------------+

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

.. tabularcolumns:: X{0.30\textwidth}X{0.20\textwidth}X{0.45\textwidth}
.. table::

   +-------------------------+-----------+-------------------------------------+
   | Element                 | Type      | Description                         |
   +=========================+===========+=====================================+
   | Status                  | enum      | The versioning state of the bucket. |
   |                         |           |                                     |
   |                         |           | Valid Values:  Disabled \| Enabled  |
   |                         |           |                                     |
   |                         |           | Ancestors: VersioningConfiguration  |
   +-------------------------+-----------+-------------------------------------+
   | VersioningConfiguration | Container | Container for the status response   |
   |                         |           | element.                            |
   +-------------------------+-----------+-------------------------------------+

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
