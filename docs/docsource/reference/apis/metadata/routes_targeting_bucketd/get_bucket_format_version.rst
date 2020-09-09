Get Bucket Format Version
=========================

Given a bucket name, this operation gets the bucket's format version,
targeting bucketd.

Request Parameters
------------------

Bucket name must be given. It is included in the request as below:

.. code::

  /_/buckets/{bucket-name}/version

Response Elements
-----------------

The response body is a number indicating the bucket format version.

.. tabularcolumns:: cl
.. table::
   :widths: auto

   +--------------------+--------------------------------+
   | **Format Version** | **Description**                |
   +====================+================================+
   | 0                  | Bucket is legacy.              |
   +--------------------+--------------------------------+
   | 1                  | Bucket is in a sharded format. |
   +--------------------+--------------------------------+

If the requested bucket does not exist, a ``DBNotFound`` error is
returned.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following request gets the format version of the "test" bucket.

.. code::

   GET /_/buckets/test/version HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

The following response indicates a bucket of the legacy format type.

.. code::

   HTTP/1.1 200 OK
   Server: bucketd
   Content-Length: 1

   0
