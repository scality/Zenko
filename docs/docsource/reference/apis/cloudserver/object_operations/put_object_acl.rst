.. _PUT Object ACL:

PUT Object ACL
==============

The PUT Object ACL operation uses the acl subresource to set the access control
list (ACL) permissions for an object that exists in a storage system bucket. 
This operation requires WRITE_ACP permission for the object.

.. note::

   WRITE_ACP access is required to set the ACL of an object.

Object permissions are set using one of the following two methods:

-  Specifying the ACL in the request body
-  Specifying permissions using request headers

Depending on the needs of the application, the ACL may be set on an object using
either the request body or the headers.

.. warning::

   Access permission cannot be specified using both the request body and the
   request headers.

The ACL of an object is set at the object version level. By default, PUT sets
the ACL of the current version of an object. To set the ACL of a different
version, use the versionId subresource.

Requests
--------

Syntax
~~~~~~

The request syntax that follows is for sending the ACL in the request
body. If headers are used to specify the permissions for the object, the
ACL cannot be sent in the request body (refer to :ref:`Common Request Headers` for a list of available headers).

.. code::

   PUT /{{ObjectName}}?acl HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

.. code::

   <AccessControlPolicy>
     <Owner>
       <ID>{{iD}}</ID>
       <DisplayName>{{emailAddress}}</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>{{iD}}</ID>
           <DisplayName>{{emailAddress}}</DisplayName>
         </Grantee>
         <Permission>{{permission}}</Permission>
       </Grant>
       ...
     </AccessControlList>
   </AccessControlPolicy>

Parameters
~~~~~~~~~~

The PUT Object ACL operation does not use Request Parameters.

Headers
~~~~~~~

The PUT Object ACL operation can use a number of optional request
headers in addition to those that are common to all operations (refer to
:ref:`Common Request Headers`). These request headers are used
either to specify a predefined—or *canned*—ACL, or to explicitly specify
grantee permissions.

Specifying a Canned ACL
-----------------------

Zenko supports a set of canned ACLs, each of which has a predefined set of
grantees and permissions.

To grant access permissions by specifying canned ACLs, use the x-amz-acl
header and specify the canned ACL name as its value.

.. note::

  Other access control specific headers cannot be used when the x-amz-acl
  header is in use.

.. tabularcolumns:: X{0.15\textwidth}X{0.10\textwidth}X{0.70\textwidth}
.. table::

   +---------------+--------+------------------------------------------------------+
   | Header        | Type   | Description                                          |
   +===============+========+======================================================+
   | ``x-amz-acl`` | string | Sets the ACL of the object using the specified       |
   |               |        | canned ACL.                                          |
   |               |        |                                                      |
   |               |        | **Default:** ``private``                             |
   |               |        |                                                      |
   |               |        | **Valid Values:** ``private`` \| ``public-read`` \|  |
   |               |        | ``public-read-write`` \| ``authenticated-read`` \|   |
   |               |        | ``bucket-owner-read`` \| ``bucket-owner-full-        |
   |               |        | control``                                            |
   |               |        |                                                      |
   |               |        | **Constraints:** None                                |
   +---------------+--------+------------------------------------------------------+

Explicitly Specifying Grantee Access Permissions
------------------------------------------------

A set of x-amz-grant-permission headers is available for explicitly
granting individualized object access permissions to specific Zenko accounts
or groups.

.. note::

  Each of the x-amz-grant-permission headers maps to specific permissions
  the Zenko supports in an ACL. Please also note that the use of any of these
  ACL-specific headers negates the use of the x-amz-acl header to set a
  canned ACL.

.. tabularcolumns:: X{0.30\textwidth}X{0.10\textwidth}X{0.55\textwidth}
.. table::

   +------------------------------+--------+---------------------------------------+
   | Header                       | Type   | Description                           |
   +==============================+========+=======================================+
   | ``x-amz-grant-read``         | string | Allows grantee to read the object     |
   |                              |        | data and its metadata                 |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+
   | ``x-amz-grant-read-acp``     | string | Allows grantee to read the object ACL |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+
   | ``x-amz-grant-write-acp``    | string | Allows grantee to write the ACL for   |
   |                              |        | the applicable object                 |
   |                              |        |                                       |
   |                              |        | **Default:** None                     |
   |                              |        |                                       |
   |                              |        | **Constraints:** None                 |
   +------------------------------+--------+---------------------------------------+
   | ``x-amz-grant-full-control`` | string | Allows grantee the  READ, READ_ACP,   |
   |                              |        | and WRITE_ACP permissions on the      |
   |                              |        | object                                |
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
-  ``uri`` (if granting permission to a predefined group)

For example, the following x-amz-grant-read header grants list objects
permission to two accounts identified by their email addresses:

.. code::

   x-amz-grant-read:  emailAddress="xyz@example.com", emailAddress="abc@example.com"

Request Elements
~~~~~~~~~~~~~~~~

If the request body is used to specify an ACL, the following elements
must be used.

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
   |                         |           | the grantee                             |
   +-------------------------+-----------+-----------------------------------------+

.. note::

  If the request body is requested, the request headers cannot be used to
  set an ACL.

Grantee Values
--------------

Specify the person (grantee) to whom access rights are being assigned
(using request elements):

-  By ID

   .. code::

      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
      <ID>{{ID}}</ID><DisplayName>GranteesEmail</DisplayName></Grantee>

   DisplayName is optional and is ignored in the request.

-  By Email Address

   .. code::

      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ScalityCustomerByEmail"><EmailAddress>{{Grantees@email.com}}</EmailAddress>lt;/Grantee>

   The grantee is resolved to the CanonicalUser and, in a response to a
   GET Object acl request, appears as the CanonicalUser.

-  By URI

   .. code::

      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Group"><URI>{{http://acs.example.com/groups/global/AuthenticatedUsers}}</URI></Grantee>

Responses
---------

Headers
~~~~~~~

The PUT Object ACL operation can include the following
response header in addition to the response headers common to all
responses (refer to :ref:`Common Response Headers`).

.. tabularcolumns:: X{0.20\textwidth}X{0.10\textwidth}X{0.65\textwidth}
.. table::

   +----------------------+--------+-----------------------------------------------+
   | Header               | Type   | Description                                   |
   +======================+========+===============================================+
   | ``x-amz-version-id`` | string | Returns the version  ID of the retrieved      |
   |                      |        | object if it has a unique version ID.         |
   |                      |        |                                               |
   |                      |        | **Default:** None                             |
   +----------------------+--------+-----------------------------------------------+

Elements
~~~~~~~~

The PUT Object ACL operation does not return response elements.

Examples
--------

Grant Access Permission to an Existing Object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample grants access permission to an existing object,
specifying the ACL in the body. In addition to granting full control to
the object owner, the XML specifies full control to an account
identified by its canonical user ID.

Request Sample
^^^^^^^^^^^^^^

.. code::

   PUT /my-document.pdf?acl HTTP/1.1
   Host: {{bucketName}}.example.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}
   Content-Length: 124

   <AccessControlPolicy>
     <Owner>
       <ID>8b27d4b0fc460740425b9deef56fa1af6245fbcccdda813b691a8fda9be8ff0c</ID>
       <DisplayName>{{customersName}}@scality.com</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>8b27d4b0fc460740425b9deef56fa1af6245fbcExampleCanonicalUserID</ID>
           <DisplayName>{{customersName}}@scality.com</DisplayName>
         </Grantee>
         <Permission>FULL_CONTROL</Permission>
       </Grant>
     </AccessControlList>
   </AccessControlPolicy>

Response Sample
^^^^^^^^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51T9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-version-id: 3/L4kqtJlcpXrof3vjVBH40Nr8X8gdRQBpUMLUo
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   Content-Length: 0
   Connection: close
   Server: ScalityS3
   Setting the AC

Setting the ACL of a Specified Object Version
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample sets the ACL on the specified version of the object.

Request Sample
^^^^^^^^^^^^^^

.. code::

   PUT /my-document.pdf?acl&amp;versionId=3HL4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nrjfkd HTTP/1.1
   Host: {{bucketName}}.example.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}
   Content-Length: 124

   <AccessControlPolicy>
     <Owner>
       <ID>8b27d4b0fc460740425b9deef56fa1af6245fbcccdda813b691a8fda9be8ff0c</ID>
       <DisplayName>user@example.com</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>8b27d4b0fc460740425b9deef56fa1af6245fbcccdda813b691a8fda9be8ff0c</ID>
           <DisplayName>user@example.com</DisplayName>
         </Grantee>
         <Permission>FULL_CONTROL</Permission>
       </Grant>
     </AccessControlList>
   </AccessControlPolicy>

Response Sample
^^^^^^^^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51u8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-version-id: 3/L4kqtJlcpXro3vjVBH40Nr8X8gdRQBpUMLUo
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   Content-Length: 0
   Connection: close
   Server: ScalityS3

Access Permissions Specified Using Headers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The request sample uses ACL-specific request header x-amz-acl, and
specifies a canned ACL (``public_read``) to grant object read access to
everyone.

Request Sample
^^^^^^^^^^^^^^

.. code::

   PUT ExampleObject.txt?acl HTTP/1.1
   Host: {{bucketName}}.example.com
   x-amz-acl: public-read
   Accept: */*
   Authorization: {{authorizationString}}
   Host: example.com
   Connection: Keep-Alive

Response Sample
^^^^^^^^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: w5YegkbG6ZDsje4WK56RWPxNQHIQ0CjrjyRVFZhEJI9E3kbabXnBO9w5G7Dmxsgk
   x-amz-request-id: C13B2827BD8455B1
   Date: Sun, 29 Apr 2012 23:24:12 GMT
   Content-Length: 0
   Server: ScalityS3
