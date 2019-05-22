Sample ACL
==========

The ACL on a bucket identifies the resource owner and a set of grants.
The format is the XML representation of an ACL in the Zenko API. The bucket
owner has FULL_CONTROL of the resource. In addition, the ACL shows how
permissions are granted on a resource to two accounts, identified by
canonical user ID, and two of the predefined Amazon S3 groups.

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <AccessControlPolicy xmlns="http://s3.scality.com/doc/2006-03-01/">
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
           <URI>http://acs.amazonaws.com/groups/global/AllUsers</URI>
         </Grantee>
         <Permission>READ</Permission>
       </Grant>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Group">
           <URI>http://acs.amazonaws.com/groups/s3/LogDelivery</URI>
         </Grantee>
         <Permission>WRITE</Permission>
       </Grant>
     </AccessControlList>
   </AccessControlPolicy>
