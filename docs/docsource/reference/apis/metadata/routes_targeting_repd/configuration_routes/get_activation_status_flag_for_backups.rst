Get Activation Status Flag for Backups
======================================

This operation returns an activation status for a repd's automatic
backup feature. This route is only available for repd processes.

Request Parameters
------------------

None

Response Elements
-----------------

The response body is a simple JSON Boolean providing the feature's
activation status:

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-----------+----------+------------------------------------+
   | **Value** | **Type** | **Meaning**                        |
   +===========+==========+====================================+
   | true      | Boolean  | Backups on this repd are enabled.  |
   +-----------+----------+------------------------------------+
   | false     | Boolean  | Backups on this repd are disabled. |
   +-----------+----------+------------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/configuration/backup HTTP/1.1
   Host: repd1.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd1
   Content-Length: 4

   true
