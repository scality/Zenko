Set Activation Status Flag for Backups
======================================

This operation allows setting the activation status of a repd's
automatic backup feature. This route is only available for repd
processes.

Request Parameters
------------------

This request takes a stringified JSON Boolean as a BODY parameter:

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-----------+----------+------------------------------------+
   | **Value** | **Type** | **Meaning**                        |
   +===========+==========+====================================+
   | true      | boolean  | Backups on this repd are enabled.  |
   +-----------+----------+------------------------------------+
   | false     | boolean  | Backups on this repd are disabled. |
   +-----------+----------+------------------------------------+

Response Elements
-----------------

This route does not return any value, but the HTTP status code serves as
notice of the request's success or failure.

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +-----------------+-------------------------------------------------------+
   | **HTTP Status** | **Meaning**                                           |
   +=================+=======================================================+
   | 204             | Success (No body is returned.)                        |
   +-----------------+-------------------------------------------------------+
   | other           | Failure (The body may provide a failure description.) |
   +-----------------+-------------------------------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following sample request deactivates the backups on a specific repd:

.. code::

   PUT /_/configuration/backup HTTP/1.1
   Host: repd1.scality.com
   Content-Length: 5

   false

The following sample request activates the backups on a specific repd:

.. code::

   PUT /_/configuration/backup HTTP/1.1
   Host: repd1.scality.com
   Content-Length: 4

   true

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 204 OK
   Server: repd1
