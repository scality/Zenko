.. _PUT Bucket ACL:

PUT Bucket ACL
==============

The PUT Bucket ACL operation uses the acl subresource to set the permissions on
an existing bucket using its access control list (ACL).

WRITE_ACP access is required to set a bucket's ACL.

Bucket permissions are set using one of the following two methods:

-  Specifying the ACL in the request body
-  Specifying permissions using request headers

.. Warning::

   Access permission cannot be specified using both the request body and the
   request headers.

Requests
--------

Syntax
~~~~~~

The request syntax that follows sends the ACL in the request body. If headers
are used to specify the bucket's permissions, the ACL cannot be sent in the
request body (see :ref:`Common Request Headers` for a list of available
headers).

.. code::

   PUT /?acl HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

   <AccessControlPolicy>
     <Owner>
       <ID>ID</ID>
       <DisplayName>EmailAddress</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>ID</ID>
           <DisplayName>EmailAddress</DisplayName>
         </Grantee>
         <Permission>Permission</Permission>
       </Grant>
       ...
     </AccessControlList>
   </AccessControlPolicy>

Parameters
~~~~~~~~~~

The PUT Bucket ACL operation does not use request parameters.

Headers
~~~~~~~

The PUT Bucket ACL operation can use a number of optional request
headers in addition to those that are common to all operations (refer to
:ref:`Common Request Headers`). These request headers are used
either to specify a predefined—or *canned*—ACL, or to explicitly specify
grantee permissions.

Specifying a Canned ACL
-----------------------

Zenko supports a set of canned ACLs, each of which has a predefined set of
grantees and permissions.

To grant access permissions by specifying canned ACLs, use the following
header and specify the canned ACL name as its value.

.. note::

  If the x-amz-acl header is in use, other access-control-specific headers
  in the request are ignored.

.. tabularcolumns:: X{0.15\textwidth}X{0.15\textwidth}X{0.65\textwidth}
.. table::

   +---------------+---------+-----------------------------------------------------+
   | Header        | Type    | Description                                         |
   +===============+=========+=====================================================+
   | ``x-amz-acl`` | string  | The canned ACL to apply to the bucket you are       |
   |               |         | creating                                            |
   |               |         |                                                     |
   |               |         | **Default:** ``private``                            |
   |               |         |                                                     |
   |               |         | **Valid Values:** ``private`` \| ``public-read`` \| |
   |               |         | ``public-read-write`` \| ``authenticated-read`` \|  |
   |               |         | ``bucket-owner-read`` \|                            |
   |               |         | ``bucket-owner-full-control``                       |
   |               |         |                                                     |
   |               |         | **Constraints:** None                               |
   +---------------+---------+-----------------------------------------------------+

Explicitly Specifying Grantee Access Permissions
------------------------------------------------

A set of x-amz-grant-permission headers is available for explicitly
granting individualized bucket access permissions to specific Zenko accounts
or groups. Each of these headers maps to specific permissions the Zenko
supports in an ACL.

.. note::

   If an x-amz-acl header is sent all ACL-specific headers are ignored in
   favor of the canned ACL.

.. tabularcolumns:: X{0.35\textwidth}X{0.10\textwidth}X{0.50\textwidth}
.. table::

   +------------------------------+--------+---------------------------------------+
   | Header                       | Type   | Description                           |
   +==============================+========+=======================================+
   | ``x-amz-grant-read``         | string | Allows grantee to list the objects in |
   |                              |        | the bucket                            |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+
   | ``x-amz-grant-write``        | string | Allows grantee to create, overwrite,  |
   |                              |        | and delete any object in the bucket   |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+
   | ``x-amz-grant-read-acp``     | string | Allows grantee to read the bucket ACL |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+
   | ``x-amz-grant-write-acp``    | string | Allows grantee to write the ACL for   |
   |                              |        | the applicable bucket                 |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+
   | ``x-amz-grant-full-control`` | string | Allows grantee the READ, WRITE,       |
   |                              |        | READ_ACP, and WRITE_ACP permissions   |
   |                              |        | on the ACL                            |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+

For each header, the value is a comma-separated list of one or more
grantees. Each grantee is specified as a ``type=value`` pair, where the
type can be one any one of the following:

-  ``emailAddress`` (if value specified is the email address of an
   account)
-  ``id`` (if value specified is the canonical user ID of an account)
-  ``uri`` (if granting permission to a predefined Amazon S3 group)

For example, the following x-amz-grant-write header grants create,
overwrite, and delete objects permission to a LogDelivery group
predefined by Zenko and two accounts identified by their email addresses.

.. code::

   x-amz-grant-write: uri="http://acs.example.com/groups/s3/LogDelivery", emailAddress="xyz@example.com", emailAddress="abc@example.com"

.. note::

  Though cited here for purposes of example, the LogDelivery group
  permission is not currently being used by Zenko.

Request Elements
~~~~~~~~~~~~~~~~

If the request body is used to specify an ACL, the following elements
must be used.

.. note::

  If the request body is requested, the request headers cannot be used to
  set an ACL.

.. tabularcolumns:: X{0.25\textwidth}X{0.10\textwidth}X{0.60\textwidth}
.. table::

   +-------------------------+-----------+-----------------------------------------+
   | Element                 | Type      | Description                             |
   +=========================+===========+=========================================+
   | ``AccessControlList``   | container | Container for Grant, Grantee, and       |
   |                         |           | Permission                              |
   +-------------------------+-----------+-----------------------------------------+
   | ``AccessControlPolicy`` | string    | Contains the elements that set the ACL  |
   |                         |           | permissions for an object per grantee   |
   +-------------------------+-----------+-----------------------------------------+
   | ``DisplayName``         | string    | Screen name of the bucket owner         |
   +-------------------------+-----------+-----------------------------------------+
   | ``Grant``               | container | Container for the grantee and his or    |
   |                         |           | her permissions                         |
   +-------------------------+-----------+-----------------------------------------+
   | ``Grantee``             | string    | The subject whose permissions are being |
   |                         |           | set                                     |
   +-------------------------+-----------+-----------------------------------------+
   | ``ID``                  | string    | ID of the bucket owner, or the ID of    |
   |                         |           | the grantee                             |
   +-------------------------+-----------+-----------------------------------------+
   | ``Owner``               | container | Container for the bucket owner’s        |
   |                         |           | display name and ID                     |
   +-------------------------+-----------+-----------------------------------------+
   | ``Permission``          | string    | Specifies the permission given to the   |
   |                         |           | grantee.                                |
   +-------------------------+-----------+-----------------------------------------+

Grantee Values
~~~~~~~~~~~~~~

Specify the person (grantee) to whom access rights are being assigned
(using request elements):

-  **By ID**

   .. code::

      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser"><ID>{{ID}}</ID><DisplayName>GranteesEmail</DisplayName></Grantee>

   DisplayName is optional and is ignored in the request.

-  **By Email Address**

   .. code::

      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ScalityCustomerByEmail"><EmailAddress>{{Grantees@email.com}}</EmailAddress>lt;/Grantee>

   The grantee is resolved to the CanonicalUser and, in a response to a
   GET Object acl request, appears as the CanonicalUser.

-  **By URI**

   .. code::

      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Group"><URI>{{http://acs.example.com/groups/global/AuthenticatedUsers}}</URI></Grantee>

Responses
---------

Headers
~~~~~~~

The PUT Bucket ACL operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

The PUT Bucket ACL operation does not return response elements.

Examples
--------

Access Permissions Specified in the Body
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample grants access permission to the existing example-bucket
bucket, specifying the ACL in the body. In addition to granting full control to
the bucket owner, the XML specifies the following grants.

-  Grant AllUsers group READ permission on the bucket.
-  Grant the LogDelivery group WRITE permission on the bucket.
-  Grant an AWS account, identified by email address, WRITE_ACP permission.
-  Grant an AWS account, identified by canonical user ID, READ_ACP
   permission.

Request Sample
^^^^^^^^^^^^^^

.. code::

   PUT ?acl HTTP/1.1
   Host: example-bucket.example.com
   Content-Length: 1660
   x-amz-date: Thu, 12 Apr 2012 20:04:21 GMT
   Authorization: {{authorizationString}}

   <AccessControlPolicy xmlns="http://example.com/doc/2006-03-01/">
     <Owner>
       <ID>852b113e7a2f25102679df27bb0ae12b3f85be6BucketOwnerCanonicalUserID</ID>
       <DisplayName>OwnerDisplayName</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>852b113e7a2f25102679df27bb0ae12b3f85be6BucketOwnerCanonicalUserID</ID>
           <DisplayName>OwnerDisplayName</DisplayName>
         </Grantee>
         <Permission>FULL_CONTROL</Permission>
       </Grant>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Group">
           <URI xmlns="">http://acs.scality.com/groups/global/AllUsers</URI>
         </Grantee>
         <Permission xmlns="">READ</Permission>
       </Grant>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Group">
           <URI xmlns="">http://acs.scality.com/groups/s3/LogDelivery</URI>
         </Grantee>
         <Permission xmlns="">WRITE</Permission>
       </Grant>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="AmazonCustomerByEmail">
           <EmailAddress xmlns="">xyz@example.com</EmailAddress>
         </Grantee>
         <Permission xmlns="">WRITE_ACP</Permission>
       </Grant>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID xmlns="">f30716ab7115dcb44a5ef76e9d74b8e20567f63TestAccountCanonicalUserID</ID>
         </Grantee>
         <Permission xmlns="">READ_ACP</Permission>
       </Grant>
     </AccessControlList>
   </AccessControlPolicy>

Response Sample
^^^^^^^^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: NxqO3PNiMHXXGwjgv15LLgUoAmPVmG0xtZw2sxePXLhpIvcyouXDrcQUaWWXcOK0
   x-amz-request-id: C651BC9B4E1BD401
   Date: Thu, 12 Apr 2012 20:04:28 GMT
   Content-Length: 0
   Server: ScalityS3

Access Permissions Specified Using Headers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample uses ACL-specific request headers to grant the
following permissions:

-  Write permission to the Zenko LogDelivery group and an account identified
   by the email \xyz@example.com
-  Read permission to the Zenko AllUsers group

Request Sample
^^^^^^^^^^^^^^

.. code::

   PUT ?acl HTTP/1.1
   Host: example-bucket.example.com
   x-amz-date: Sun, 29 Apr 2012 22:00:57 GMT
   x-amz-grant-write: uri="http://acs.example.com/groups/s3/LogDelivery", emailAddress="xyz@example.com"
   x-amz-grant-read: uri="http://acs.example.com/groups/global/AllUsers"
   Accept: */*
   Authorization: {{authorizationString}}

Response Sample
^^^^^^^^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: 0w9iImt23VF9s6QofOTDzelF7mrryz7d04Mw23FQCi4O205Zw28Zn+d340/RytoQ
   x-amz-request-id: A6A8F01A38EC7138
   Date: Sun, 29 Apr 2012 22:01:10 GMT
   Content-Length: 0
   Server: ScalityS3
