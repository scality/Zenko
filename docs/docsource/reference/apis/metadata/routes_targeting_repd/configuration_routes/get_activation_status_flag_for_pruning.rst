Get Activation Status Flag for Pruning
======================================

This operation returns the activation status of the pruning feature for
a repd's automatic Raft log. This route is only available for repd
processes.

Request Parameters
------------------

None

Response Elements
-----------------

The response body is a simple JSON Boolean that provides the feature's
activation status:

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-----------+----------+-----------------------------------+
   | **Value** | **Type** | **Meaning**                       |
   +===========+==========+===================================+
   | true      | Boolean  | Pruning on this repd is enabled.  |
   +-----------+----------+-----------------------------------+
   | false     | Boolean  | Pruning on this repd is disabled. |
   +-----------+----------+-----------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/configuration/prune HTTP/1.1
   Host: repd1.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: rep1
   Content-Length: 4

   true
