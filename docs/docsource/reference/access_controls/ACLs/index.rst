.. _ACL (Access Control List):

ACL (Access Control List)
=========================

Access Control Lists (ACLs) enable the management of access to buckets
and objects.

Each bucket and object has an ACL attached to it as a subresource,
defining which accounts or groups are granted access and the type of
access. When a request is received against a resource, Zenko checks the
corresponding ACL to verify the requester has the necessary access
permissions.

When a bucket or object is created, Zenko creates a default ACL that grants
the resource owner full control over the resource as shown in the
following sample bucket ACL (the default object ACL has the same
structure).

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <AccessControlPolicy xmlns="http://example.com/doc/2006-03-01/">
     <Owner>
       <ID>*** Owner-Canonical-User-ID ***</ID>
       <DisplayName>owner-display-name</DisplayName>
     </Owner>
     <AccessControlList>
       <Grant>
         <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:type="Canonical User">
           <ID>*** Owner-Canonical-User-ID ***</ID>
           <DisplayName>display-name</DisplayName>
         </Grantee>
         <Permission>FULL_CONTROL</Permission>
       </Grant>
     </AccessControlList>
   </AccessControlPolicy>

The sample ACL includes an Owner element identifying the owner via the
account’s canonical user ID. The Grantelement identifies the grantee
(either a specific account or a predefined group), and the permission
granted. This default ACL has one Grantelement for the owner. You grant
permissions by adding Grantelements, each grant identifying the grantee
and the permission.


.. toctree::
   :maxdepth: 2

   grantee_eligibility
   grantable_permissions
   specifying_an_acl
