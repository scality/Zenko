Get Map Format Version
======================

This operation gets the MapServer's format version.

Request Parameters
------------------

The request must be formatted as ``/_/mapFormat``.

Response Elements
-----------------

The response body is a number indicating the MapServer's format version.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/mapFormat HTTP/1.1
   Host: repd0.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd0
   Content-Length: 1

   2
