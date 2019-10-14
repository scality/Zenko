Specifying an ACL
=================

Using Zenko, an ACL can be set at the creation point of a bucket or object.
An ACL can also be applied to an existing bucket or object.

.. tabularcolumns:: X{0.25\textwidth}X{0.70\textwidth}
.. table::

   +--------------------------------+------------------------------------------+
   | Set ACL using request headers  | When sending a request to create a       |
   |                                | resource (bucket or object), set an ACL  |
   |                                | using the request headers. With these    |
   |                                | headers, it is possible to either        |
   |                                | specify a canned ACL or specify grants   |
   |                                | explicitly (identifying grantee and      |
   |                                | permissions explicitly).                 |
   +--------------------------------+------------------------------------------+
   | Set ACL using request body     | When you send a request to set an ACL on |
   |                                | an existing resource, you can set the    |
   |                                | ACL either in the request header or in   |
   |                                | the body.                                |
   +--------------------------------+------------------------------------------+

Sample ACL
----------

The ACL on a bucket identifies the resource owner and a set of grants.
The format is the XML representation of an ACL in the Zenko API. The bucket
owner has FULL_CONTROL of the resource. In addition, the ACL shows how
permissions are granted on a resource to two accounts, identified by
canonical user ID, and two of the predefined Amazon S3 groups.

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <AccessControlPolicy xmlns="http://example.com/doc/2006-03-01/">
     <Owner>
       <ID>Owner-canonical-user-ID</ID>
       <DisplayName>display-name</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>Owner-canonical-user-ID</ID>
           <DisplayName>display-name</DisplayName>
         </Grantee>
         <Permission>FULL_CONTROL</Permission>
       </Grant>

       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>user1-canonical-user-ID</ID>
           <DisplayName>display-name</DisplayName>
         </Grantee>
         <Permission>WRITE</Permission>
       </Grant>

       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
           <ID>user2-canonical-user-ID</ID>
           <DisplayName>display-name</DisplayName>
         </Grantee>
         <Permission>READ</Permission>
       </Grant>

       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Group">
           <URI>http://acs.example.com/groups/global/AllUsers</URI>
         </Grantee>
         <Permission>READ</Permission>
       </Grant>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Group">
           <URI>http://acs.example.com/groups/s3/LogDelivery</URI>
         </Grantee>
         <Permission>WRITE</Permission>
       </Grant>
     </AccessControlList>
   </AccessControlPolicy>
