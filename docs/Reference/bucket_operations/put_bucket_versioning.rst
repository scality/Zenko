.. _PUT Bucket Versioning:

PUT Bucket Versioning
=====================

The PUT Bucket Versioning operation uses the versioning subresource to
set the versioning state of an existing bucket. To set the versioning
state, you must be the bucket owner.

You can set the versioning state with one of the following values:

-  **Enabled** — Enables versioning for the objects in the bucket. All
   objects added to the bucket receive a unique version ID.
-  **Suspended** — Disables versioning for the objects in the bucket.
   All objects added to the bucket receive the version ID null.

If the versioning state has never been set on a bucket, it has no
versioning state; a GET versioning request does not return a versioning
state value.

Requests
--------

**Request Syntax**

.. code::

   PUT / HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Content-Length: {{length}}
   Date: {{date}}
   Authorization: {{authenticationInformation}}

   <VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">
   <Status>{{VersioningState}}>/Status>
   </VersioningConfiguration>

The Request Syntax illustrates only a portion of the request headers.

**Request Parameters**

The PUT Bucket Versioning operation does not use Request Parameters.

**Request Headers**

Implementation of the PUT Bucket Versioning operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).

**Request Elements**

The PUT Bucket operation can request the following items:

.. tabularcolumns:: X{0.25\textwidth}X{0.15\textwidth}X{0.55\textwidth}
.. table::

   +---------------+-----------+---------------------------------------------+
   | Element       | Type      | Description                                 |
   +===============+===========+=============================================+
   | Status        | enum      | Sets the versioning state of the bucket.    |
   |               |           |                                             |
   |               |           | Valid Values: Suspended \| Enabled          |
   |               |           |                                             |
   |               |           | Ancestor: VersioningConfiguration           |
   +---------------+-----------+---------------------------------------------+
   | Versioning\   | container | Container for setting the versioning state. |
   | Configuration |           |                                             | 
   |               |           | Children: Status                            |
   |               |           |                                             |
   |               |           | Ancestor: none                              |
   +---------------+-----------+---------------------------------------------+

Responses
---------

**Response Headers**

Implementation of the PUT Bucket Versioning operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

**Response Elements**

The PUT Bucket Versioning operation does not return response elements.

Examples
--------

**Enabling Versioning for a Specified Bucket**

*Request Sample*

.. code::

   PUT /?versioning HTTP/1.1
   Host: bucket.s3.scality.com
   Date: Wed, 01 Mar  2006 12:00:00 GMT
   Authorization: {{authorization string}}
   Content-Type: text/plain
   Content-Length: 124
   
   <VersioningConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">
   <Status>Enabled</Status>
   </VersioningConfiguration>

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: YgIPIfBiKa2bj0KMg95r/0zo3emzU4dzsD4rcKCHQUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 236A8905248E5A01
   Date: Wed, 01 Mar  2006 12:00:00 GMT

**Suspending Versioning for a Specified Bucket**

*Request Sample*

.. code::

   PUT /?versioning HTTP/1.1
   Host: bucket.s3.scality.com
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Authorization: {{authorization string}}
   Content-Type: text/plain
   Content-Length: 124
  
   <VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
   <Status>Suspended</Status>
   </VersioningConfiguration>

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: YgIPIfBiKa2bj0KMg95r/0zo3emzU4dzsD4rcKCHQUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 236A8905248E5A01
   Date: Wed, 01 Mar  2006 12:00:00 GMT
