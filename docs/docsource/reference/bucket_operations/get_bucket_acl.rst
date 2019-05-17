.. _GET Bucket ACL:

GET Bucket ACL
==============

The GET Bucket ACL operation returns the access control list (ACL)
settings of a bucket.

Requests
--------

**Request Syntax**

.. code::

   GET /?acl HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

**Request Parameters**

The GET Bucket ACL operation does not use Request Parameters.

**Request Headers**

Implementation of the GET Bucket ACL operation uses only request headers
that are common to all operations (refer to :ref:`Common Request Headers`).

**Request Elements**

The GET Bucket ACL operation does not use request elements.

Responses
---------

**Response Headers**

Implementation of the GET Bucket ACL operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

**Response Elements**

The GET Bucket ACL operation can return the following XML elements of
the response (includes XML containers):

.. tabularcolumns:: X{0.20\textwidth}X{0.15\textwidth}X{0.60\textwidth}
.. table::

   +-----------------------+-----------------------+-----------------------+
   | Element               | Type                  | Description           |
   +=======================+=======================+=======================+
   | AccessControlList     | container             | Container for ACL     |
   |                       |                       | information           |
   +-----------------------+-----------------------+-----------------------+
   | AccessControlPolicy   | container             | Container for the     |
   |                       |                       | response              |
   +-----------------------+-----------------------+-----------------------+
   | DisplayName           | string                | Bucket owner’s        |
   |                       |                       | display name;         |
   |                       |                       | returned only if the  |
   |                       |                       | owner’s e-mail        |
   |                       |                       | address (or the forum |
   |                       |                       | name, if configured)  |
   |                       |                       | can be determined     |
   |                       |                       | from the ID           |
   +-----------------------+-----------------------+-----------------------+
   | Grant                 | container             | Container for Grantee |
   |                       |                       | and Permission        |
   +-----------------------+-----------------------+-----------------------+
   | Grantee               | container             | Container for         |
   |                       |                       | DisplayName and ID of |
   |                       |                       | the person being      |
   |                       |                       | granted permissions   |
   +-----------------------+-----------------------+-----------------------+
   | ID                    | string                | Bucket owner’s user   |
   |                       |                       | ID                    |
   +-----------------------+-----------------------+-----------------------+
   | Owner                 | container             | Container for bucket  |
   |                       |                       | owner information     |
   +-----------------------+-----------------------+-----------------------+
   | Permission            | string                | Permission given to   |
   |                       |                       | the Grantee for       |
   |                       |                       | bucket                |
   |                       |                       |                       |
   |                       |                       | Valid Values:         |
   |                       |                       | ``FULL_CONTROL`` \|   |
   |                       |                       | ``WRITE`` \|          |
   |                       |                       | ``WRITE_ACP`` \|      |
   |                       |                       | ``READ`` \|           |
   |                       |                       | ``READ_ACP``          |
   +-----------------------+-----------------------+-----------------------+

Examples
--------

**Getting the ACL of the Specified Bucket**

*Request Sample*

.. code::

   GET ?acl HTTP/1.1
   Host: {{bucketName}}.{{storageService}}.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC148832E5
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   Content-Length: 124
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3

   <AccessControlPolicy> xmlns="http://s3.scality.com/doc/2006-03-01/">
     <Owner>
       <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
       <DisplayName>mtd@amazon.com</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a</ID>
           <DisplayName>mtd@amazon.com</DisplayName>
         </Grantee>
         <Permission>FULL_CONTROL</Permission>
       </Grant>
     </AccessControlList>
   </AccessControlPolicy>
