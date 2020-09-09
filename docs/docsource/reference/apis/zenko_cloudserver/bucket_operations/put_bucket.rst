.. _PUT Bucket:

PUT Bucket
==========

The PUT Bucket operation creates a bucket and sets the account issuing
the request as the bucket owner. Buckets cannot be created by anonymous
requests (no authentication information is sent).

Requests
--------

Syntax
~~~~~~

.. code::

   PUT / HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Content-Length: {{length}}
   Date: {{date}}
   Authorization: {{authenticationInformation}}

   <CreateBucketConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">
   <LocationConstraint>scality-us-west-1</LocationConstraint>
   </CreateBucketConfiguration>

If the Host header of a PUT Bucket request does not match any of the
REST endpoints in your configuration, and a region is not specified in
the request, it will be automatically assigned us-east-1.

This syntax illustrates only a portion of the request headers.

Parameters
~~~~~~~~~~

The PUT Bucket operation does not use request parameters.

Headers
~~~~~~~

The PUT Bucket operation can use a number of optional request headers in
addition to those that are common to all operations (refer to :ref:`Common
Request Headers`). These request headers are used either to specify a
predefined—-or *canned*—-ACL, or to explicitly specify access permissions.

Specifying a Canned ACL
```````````````````````

Zenko supports a set of canned ACLs, each with a predefined set of grantees
and permissions.

.. tabularcolumns:: X{0.15\textwidth}X{0.15\textwidth}X{0.65\textwidth}
.. table::

   +---------------+--------+------------------------------------------------------+
   | Header        | Type   | Description                                          |
   +===============+========+======================================================+
   | ``x-amz-acl`` | string | The canned ACL to apply to the bucket being created  |
   |               |        |                                                      |
   |               |        | **Default:** ``private``                             |
   |               |        |                                                      |
   |               |        | **Valid Values:** ``private`` \|  ``public-read`` \| |
   |               |        | ``public-read-write`` \| ``authenticated-read`` \|   |
   |               |        | ``bucket-owner-read`` \|                             |
   |               |        | ``bucket-owner-full-control``                        | 
   |               |        |                                                      |
   |               |        | **Constraints:** None                                |
   +---------------+--------+------------------------------------------------------+

Explicitly Specifying Access Permissions
````````````````````````````````````````

A set of headers is available for explicitly granting access permissions
to specific Zenko accounts or groups, each of which maps to specific
permissions Zenko supports in an ACL.

In the header value, specify a list of grantees who get the specific
permission.

.. tabularcolumns:: X{0.40\textwidth}X{0.10\textwidth}X{0.45\textwidth}
.. table::

   +----------------------------------------+--------+-----------------------+
   | Header                                 | Type   | Description           |
   +========================================+========+=======================+
   | ``x-amz-grant-read``                   | string | Allows grantee to     |
   |                                        |        | list the objects in   |
   |                                        |        | the bucket            |
   |                                        |        |                       |
   |                                        |        | **Default:** None     |
   |                                        |        |                       |
   |                                        |        | **Constraints:** None |
   +----------------------------------------+--------+-----------------------+
   | ``x-amz-grant-write``                  | string | Allows grantee to     |
   |                                        |        | create, overwrite,    |
   |                                        |        | and delete any object |
   |                                        |        | in the bucket         |
   |                                        |        |                       |
   |                                        |        | **Default:** None     |
   |                                        |        |                       |
   |                                        |        | **Constraints:** None |
   +----------------------------------------+--------+-----------------------+
   | ``x-amz-grant-read-acp``               | string | Allows grantee to     |
   |                                        |        | read the bucket ACL   |
   |                                        |        |                       |
   |                                        |        | **Default:** None     |
   |                                        |        |                       |
   |                                        |        | **Constraints:** None |
   +----------------------------------------+--------+-----------------------+
   | ``x-amz-grant-write-acp``              | string | Allows grantee to     |
   |                                        |        | write the ACL for the |
   |                                        |        | applicable bucket     |
   |                                        |        |                       |
   |                                        |        | **Default:** None     |
   |                                        |        |                       |
   |                                        |        | **Constraints:** None |
   +----------------------------------------+--------+-----------------------+
   | ``x-amz-grant-full-control``           | string | Allows grantee READ,  |
   |                                        |        | WRITE, READ_ACP,      |
   |                                        |        | and WRITE_ACP         |
   |                                        |        | permissions on the ACL|
   |                                        |        |                       |
   |                                        |        | **Default:** None     |
   |                                        |        |                       |
   |                                        |        | **Constraints:** None |
   +----------------------------------------+--------+-----------------------+
   | ``x-amz-scal-server-side-encryption``  | string | Special optional      |
   |                                        |        | header, specifies     |
   |                                        |        | that the source       |
   |                                        |        | object is to be       |
   |                                        |        | encrypted.            |
   |                                        |        |                       |
   |                                        |        | **Default:** AES256   |
   |                                        |        |                       |
   |                                        |        | **Constraints:** Must |
   |                                        |        | be AES256.            |
   +----------------------------------------+--------+-----------------------+

Each grantee is specified as a ``type=value`` pair, where the type can
be one any one of the following:

-  ``emailAddress`` (if value specified is the email address of an
   account)
-  ``id`` (if value specified is the canonical user ID of an account)
-  ``uri`` (if granting permission to a predefined group)

For example, the following x-amz-grant-read header grants list objects
permission to the accounts identified by their email addresses:

.. code::

   x-amz-grant-read: emailAddress="xyz@scality.com", emailAddress="abc@scality.com"

Elements
~~~~~~~~

The PUT Bucket operation can request the following items:

.. tabularcolumns:: X{0.30\textwidth}X{0.15\textwidth}X{0.50\textwidth}
.. table::

   +-------------------------------+-----------+-----------------------------------+
   | Element                       | Type      | Description                       |
   +===============================+===========+===================================+
   | ``CreateBucketConfiguration`` | container | Container for bucket              |
   |                               |           | configuration settings            |
   +-------------------------------+-----------+-----------------------------------+
   | ``LocationConstraint``        | enum      | Specifies where the bucket will   |
   |                               |           | be created                        |
   +-------------------------------+-----------+-----------------------------------+

Responses
---------

Headers
~~~~~~~

The PUT Bucket operation uses only response headers that are
common to all operations (see :ref:`Common Response Headers`).

Elements
~~~~~~~~

The PUT Bucket operation does not return response elements.

Examples
--------

Create a Bucket Named "Documentation"
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   PUT / HTTP/1.1
   Host: documentation.demo.s3.scality.com
   Content-Length: 0
   Date: Mon, 15 Feb 2016 15:30:07 GMT
   Authorization: AWS pat:fxA/7CeKyl3QJewhIguziTMp8Cc=

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: YgIPIfBiKa2bj0KMg95r/0zo3emzU4dzsD4rcKCHQUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 236A8905248E5A01
   Date: Mon, 15 Feb 2016 15:30:07 GMT

   Location: /documentation
   Content-Length: 0
   Connection: close
   Server: ScalityS3

Setting a Bucket's Location Constraint
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

A PUT Bucket operation example request that sets the location constraint
of the bucket to EU.

.. code::

   PUT / HTTP/1.1
   Host: {{bucketName}}.s3.{{storageService}}.com
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Authorization: {{authorizationString}}
   Content-Type: text/plain
   Content-Length: 124

   <CreateBucketConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">
   <LocationConstraint>EU</LocationConstraint>
   </CreateBucketConfiguration >

Creating a Bucket and Configuring Access Permission Using a Canned ACL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

A PUT Bucket operation example request that creates a bucket named
“documentation” and sets the ACL to private.

.. code::

   PUT / HTTP/1.1
   Host: documentation.s3.scality.com
   Content-Length: 0
   x-amz-acl: private
   Date: Wed, 01 Mar  2006 12:00:00 GMT
   Authorization: {{authorizationString}}

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: YgIPIfBiKa2bj0KMg95r/0zo3emzU4dzsD4rcKCHQUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 236A8905248E5A01
   Date: Wed, 01 Mar  2006 12:00:00 GMT

   Location: /documentation
   Content-Length: 0
   Connection: close
   Server: ScalityS3

Creating a Bucket and Explicitly Configuring Access Permissions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

A PUT Bucket operation example request that creates a bucket named
“documentation” and grants WRITE permission to the account identified by an
email address.

.. code::

   PUT HTTP/1.1
   Host: documentation.s3.{{storageService}}.com
   x-amz-date: Sat, 07 Apr 2012 00:54:40 GMT
   Authorization: {{authorizationString}}
   x-amz-grant-write: emailAddress="xyz@scality.com", emailAddress="abc@scality.com"

Response
````````

.. code::

   HTTP/1.1 200 OK
