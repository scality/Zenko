.. _Common Response Headers:

Common Response Headers
=======================

All Zenko response headers are listed on separate lines.

.. tabularcolumns:: X{0.25\textwidth}X{0.10\textwidth}X{0.60\textwidth}
.. table::

   +--------------------------+---------+--------------------------------------+
   | Header                   | Type    | Description                          |
   +==========================+=========+======================================+
   | ``Content-Length``       | string  | Length of the response body, in      |
   |                          |         | bytes                                |
   |                          |         |                                      |
   |                          |         | **Default:** None                    |
   +--------------------------+---------+--------------------------------------+
   | ``Content-Type``         | string  | The MIME type of the content (e.g.,  |
   |                          |         | Content-Type: text/html; charset=\   |
   |                          |         | utf-8)                               |
   |                          |         |                                      |
   |                          |         | **Default:** None                    |
   +--------------------------+---------+--------------------------------------+
   | ``Connection``           | Enum    | Indicates whether the connection to  |
   |                          |         | the server is open or closed.        |
   |                          |         |                                      |
   |                          |         | **Valid Values:** ``open``\|         |
   |                          |         | ``close``                            |
   |                          |         |                                      |
   |                          |         | **Default:** None                    |
   +--------------------------+---------+--------------------------------------+
   | ``Date``                 | string  | Date and time of the response (e.g., |
   |                          |         | ``Wed, 01 Mar 2006 12:00:00 GMT``)   |
   |                          |         |                                      |
   |                          |         | **Default:** None                    |
   +--------------------------+---------+--------------------------------------+
   | ``ETag``                 | string  | The entity tag (Etag) is a hash of   |
   |                          |         | the object that reflects changes     |
   |                          |         | only to the object's contents; not   |
   |                          |         | to its metadata. It may or may not   |
   |                          |         | be an MD5 digest of the object data, |
   |                          |         | depending on how the object was      |
   |                          |         | created and how it is encrypted:     |
   |                          |         |                                      |
   |                          |         | -  Objects created by the PUT Object |
   |                          |         |    and encrypted by SSE-S3 or        |
   |                          |         |    plaintext have ETags that are an  |
   |                          |         |    MD5 digest of their object data.  |
   |                          |         | -  Objects created by the PUT Object |
   |                          |         |    and which are encrypted by SSE-C  |
   |                          |         |    or SSE-KMS have ETags that are    |
   |                          |         |    not an MD5 digest of their object |
   |                          |         |    data.                             |
   |                          |         | -  If an object is created by the    |
   |                          |         |    Multipart Upload the ETag is not  |
   |                          |         |    an MD5 digest, regardless of the  |
   |                          |         |    method of encryption.             |
   +--------------------------+---------+--------------------------------------+
   | ``Server``               | string  | Name of server that created the      |
   |                          |         | response.                            |
   +--------------------------+---------+--------------------------------------+
   | ``x-amz-request-id``     | string  | A created value that uniquely        |
   |                          |         | identifies the request; can be used  |
   |                          |         | to troubleshoot the problem.         |
   |                          |         |                                      |
   |                          |         | **Default:** None                    |
   +--------------------------+---------+--------------------------------------+
   | ``x-amz-delete-marker``  | Boolean | Specifies whether the object         |
   |                          |         | returned was or was not a delete     |
   |                          |         | marker.                              |
   |                          |         |                                      |
   |                          |         | **Valid Values:**                    |
   |                          |         |  ``true`` | ``false``                |
   |                          |         |                                      |
   |                          |         | **Default:** false                   |
   +--------------------------+---------+--------------------------------------+
   | ``x-amz-version-id``     | string  | The version of the object. When      |
   |                          |         | versioning is enabled, generates a   |
   |                          |         | URL-ready hex string Zenko uses      |
   |                          |         | to identify objects added to a       |
   |                          |         | bucket. For example: 39393939393939\ |
   |                          |         | 39393939393939393939393939756e6437.  |
   |                          |         |                                      |
   |                          |         | When an object is PUT in a bucket    |
   |                          |         | where versioning has been suspended, |
   |                          |         | the version ID is always null.       |
   +--------------------------+---------+--------------------------------------+
