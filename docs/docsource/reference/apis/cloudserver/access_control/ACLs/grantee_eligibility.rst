Grantee Eligibility
===================

A grantee can be an account or one of the predefined groups. Permission
is granted to an account by the email address or the canonical user ID.
However, if an email address is provided in the grant request, Zenko finds the
canonical user ID for that account and adds it to the ACL. The resulting
ACLs always contain the canonical user ID for the account, not the
account’s email address.

AWS Canonical User ID
---------------------

Canonical user IDs are associated with AWS accounts. When an AWS account is
granted permissions by a grant request, a grant entry is added to the ACL with
that account’s canonical user ID.

Predefined Amazon S3 Groups
---------------------------

Zenko offers the use of Amazon S3 predefined groups. When granting account
access to such a group, specify one of URIs instead of a canonical user
ID.

.. tabularcolumns:: X{0.20\textwidth}X{0.75\textwidth}
.. table::

   +---------------+-----------------------------------------------------------+
   | Authenticated | Represents all authenticated accounts. Access permission  |
   | Users         | to this group allows any system account to access the     |
   |               | resource. However, all requests must be signed            |
   |               | (authenticated).                                          | 
   |               |                                                           |
   |               | \http://acs.example.com/groups/global/AuthenticatedUsers  |
   +---------------+-----------------------------------------------------------+
   | Public        | Access permission to this group allows anyone to access   |
   |               | the resource. Requests can be signed (authenticated) or   |
   |               | unsigned (anonymous). Unsigned requests omit the          |
   |               | Authentication header in the request.                     |
   |               |                                                           |
   |               | \http://acs.example.com/groups/global/AllUsers            |
   +---------------+-----------------------------------------------------------+
   | Log Delivery  | WRITE permission on a bucket enables this group to write  |
   |               | server access logs to the bucket.                         |
   |               |                                                           |
   |               | \http://acs.example.com/groups/s3/LogDelivery             |
   +---------------+-----------------------------------------------------------+

.. note::

   When using ACLs, a grantee can be an AWS account or one of the
   predefined Amazon S3 groups. However, the grantee cannot be an Identity
   and Access Management (IAM) user. When granting AWS accounts access to
   resources, be aware that the AWS accounts can delegate their permissions
   to users under their accounts (a practice known as cross-account
   access).
