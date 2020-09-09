Get a Database’s Size
=====================

This operation gets the estimated size of a database. With no
parameters, it returns estimated sizes for all databases.

Request Parameters
------------------

Optional parameters specify which database to be size-estimated.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +----------+--------+----------------------------------------+
   | Name     | Type   | Description                            |
   +==========+========+========================================+
   | ``name`` | string | Name of the database to size-estimate. |
   +----------+--------+----------------------------------------+

Response Elements
-----------------

The response body is a simple number describing the size of the database
or all databases.

.. tabularcolumns:: cl
.. table::
   :widths: auto

   +-------------+-------------------------------------------------+
   | HTTP Status | Meaning                                         |
   +=============+=================================================+
   | 200         | Success (Body with the size)                    |
   +-------------+-------------------------------------------------+
   | other       | Failure (Body may provide failure description.) |
   +-------------+-------------------------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following sample request retrieves the size of the database named
"size".

.. code::

   Get /_/db/size?name=size HTTP/1.1
   Host: repd1.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   42
