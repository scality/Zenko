.. _GET Object ACL:

GET Object ACL
==============

The GET Object ACL operation returns an object's access control list
(ACL) permissions. This operation requires ``READ_ACP`` access to the
object.

By default, GET returns ACL information about the current version of an
object. To return ACL information about a different version, use the
versionId subresource.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /ObjectName?acl HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}
   Range:bytes={{byte_range}}

Parameters
~~~~~~~~~~

The GET Object ACL operation does not use Request Parameters.

Headers
~~~~~~~

The GET Object ACL operation uses only request headers
that are common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

The GET Object ACL operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The GET Object ACL operation can include the following
response headers in addition to the response headers common to all
responses (refer to :ref:`Common Response Headers`).

.. tabularcolumns:: X{0.22\textwidth}X{0.13\textwidth}X{0.60\textwidth}
.. table::

   +-----------------------+-----------------------+-----------------------+
   | Element               | Type                  | Description           |
   +=======================+=======================+=======================+
   | ``x-amz-version-id``  | string                | Returns the version   |
   |                       |                       | ID of the retrieved   |
   |                       |                       | object if it has a    |
   |                       |                       | unique version ID     |
   |                       |                       |                       |
   |                       |                       | **Default:** None     |
   +-----------------------+-----------------------+-----------------------+

Elements
~~~~~~~~

The GET Object ACL operation can return the following XML elements of
the response (includes XML containers):

.. tabularcolumns:: X{0.25\textwidth}X{0.10\textwidth}X{0.60\textwidth}
.. table::   

   +-------------------------+-----------------------+-----------------------+
   | Element                 | Type                  | Description           |
   +=========================+=======================+=======================+
   | ``AccessControlList``   | container             | Container for Grant,  |
   |                         |                       | Grantee, Permission   |
   +-------------------------+-----------------------+-----------------------+
   | ``AccessControlPolicy`` | container             | Contains the elements |
   |                         |                       | that set the ACL      |
   |                         |                       | permissions for an    |
   |                         |                       | object per Grantee    |
   +-------------------------+-----------------------+-----------------------+
   | ``DisplayName``         | string                | Screen name of the    |
   |                         |                       | bucket owner          |
   +-------------------------+-----------------------+-----------------------+
   | ``Grant``               | container             | Container for the     |
   |                         |                       | grantee and his or    |
   |                         |                       | her permissions       |
   +-------------------------+-----------------------+-----------------------+
   | ``Grantee``             | string                | The subject whose     |
   |                         |                       | permissions are being |
   |                         |                       | set                   |
   +-------------------------+-----------------------+-----------------------+
   | ``ID``                  | string                | ID of the bucket      |
   |                         |                       | owner, or the ID of   |
   |                         |                       | the grantee           |
   +-------------------------+-----------------------+-----------------------+
   | ``Owner``               | container             | Container for the     |
   |                         |                       | bucket owner’s        |
   |                         |                       | display name and ID   |
   +-------------------------+-----------------------+-----------------------+
   | ``Permission``          | string                | Specifies the         |
   |                         |                       | permission            |
   |                         |                       | (``FULL_CONTROL``,    |
   |                         |                       | ``WRITE``,            |
   |                         |                       | ``READ_ACP``) given   |
   |                         |                       | to the grantee        |
   +-------------------------+-----------------------+-----------------------+

Examples
--------

Returning Object Information, Including ACL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The sample illustrated retrieves the access control permissions for the
specified file object, greatshot_d.raw:

Request
^^^^^^^

.. code::

   GET /greatshot_d.raw?acl HTTP/1.1
   Host: bucket.example.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}

Response
^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   x-amz-version-id: 4HL4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nrjfkd
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   Content-Length: 124
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3

.. code::

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

Getting and Showing the ACL of a Specific Object Version
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
^^^^^^^

.. code::

   GET /my-image.jpg?versionId=3/L4kqtJlcpXroDVBH40Nr8X8gdRQBpUMLUo&amp;acl HTTP/1.1
   Host: {{bucketName}}.example.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}

Response
^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   x-amz-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   Content-Length: 124
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3

.. code::

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
