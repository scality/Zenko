Grantable Permissions
=====================

The set of permissions S3 Connector supports in an ACL are detailed in the following
table.

.. tabularcolumns:: lLL
.. table::
   :widths: auto

   +-----------------------+-----------------------+-----------------------+
   | Permission            | When Granted to a     | When Granted to an    |
   |                       | Bucket                | Object                |
   +=======================+=======================+=======================+
   | READ                  | Grantee can list the  | Grantee can read the  |
   |                       | objects in the bucket | object data and its   |
   |                       |                       | metadata              |
   +-----------------------+-----------------------+-----------------------+
   | WRITE                 | Grantee can create,   | Not applicable        |
   |                       | overwrite, and delete |                       |
   |                       | any object in the     |                       |
   |                       | bucket                |                       |
   +-----------------------+-----------------------+-----------------------+
   | READ_ACP              | Grantee can read the  | Grantee can read the  |
   |                       | bucket ACL            | object ACL            |
   +-----------------------+-----------------------+-----------------------+
   | WRITE_ACP             | Grantee can write the | Grantee can write the |
   |                       | ACL for the           | ACL for the           |
   |                       | applicable bucket     | applicable object     |
   +-----------------------+-----------------------+-----------------------+
   | FULL_CONTROL          | Allows grantee the    | Allows grantee the    |
   |                       | READ, WRITE,          | READ, READ_ACP, and   |
   |                       | READ_ACP, and         | WRITE_ACP permissions |
   |                       | WRITE_ACP permissions | on the object         |
   |                       | on the bucket         |                       |
   +-----------------------+-----------------------+-----------------------+

.. note::

  The set of ACL permissions is the same for object ACL and bucket ACL.
  However, depending on the context (bucket ACL or object ACL), these ACL
  permissions grant permissions for specific bucket or the object
  operations.
