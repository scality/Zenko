Specifying an ACL
=================

Using Zenko, an ACL can be set at the creation point of a bucket or object.
An ACL can also be applied to an existing bucket or object.

.. tabularcolumns:: X{0.32\textwidth}X{0.63\textwidth}
.. table::

   +--------------------------------+-----------------------------------+
   | Set ACL using request headers  | When sending a request to create  |
   |                                | a resource (bucket or object),    |
   |                                | set an ACL using the request      |
   |                                | headers. With these headers, it   |
   |                                | is possible to either specify a   |
   |                                | canned ACL or specify grants      |
   |                                | explicitly (identifying grantee   |
   |                                | and permissions explicitly).      |
   +--------------------------------+-----------------------------------+
   | Set ACL using request body     | When you send a request to set an |
   |                                | ACL on a existing resource, you   |
   |                                | can set the ACL either in the     |
   |                                | request header or in the body.    |
   +--------------------------------+-----------------------------------+
