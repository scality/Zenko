Grantable Permissions
=====================

The set of permissions Zenko supports in an ACL is detailed in the following
table.

.. tabularcolumns:: X{0.20\textwidth}X{0.35\textwidth}X{0.35\textwidth}
.. table::

   +--------------+---------------------------+--------------------------------+
   | Permission   | When Granted to a Bucket  | When Granted to an Object      |
   +==============+===========================+================================+
   | READ         | Grantee can list the      | Grantee can read the object    |
   |              | objects in the bucket.    | data and its metadata.         |
   +--------------+---------------------------+--------------------------------+
   | WRITE        | Grantee can create,       | Not applicable                 |
   |              | overwrite, and delete     |                                |
   |              | any object in the bucket. |                                |
   +--------------+---------------------------+--------------------------------+
   | READ_ACP     | Grantee can read the      | Grantee can read the object    |
   |              | bucket ACL.               | ACL.                           |
   +--------------+---------------------------+--------------------------------+
   | WRITE_ACP    | Grantee can write the ACL | Grantee can write the ACL for  |
   |              | for the applicable        | the applicable object.         |
   |              | bucket.                   |                                |
   +--------------+---------------------------+--------------------------------+
   | FULL_CONTROL | Allows grantee the READ,  | Allows grantee the READ,       |
   |              | WRITE, READ_ACP, and      | READ_ACP, and WRITE_ACP        |
   |              | READ_ACP, and WRITE_ACP   | WRITE_ACP permissions on the   |
   |              | WRITE_ACP permissions on  | object                         |
   |              | the bucket                |                                |
   +--------------+---------------------------+--------------------------------+

.. note::

  The set of ACL permissions is the same for object ACL and bucket ACL.
  However, depending on the context (bucket ACL or object ACL), these ACL
  permissions grant permissions for specific bucket or the object
  operations.
