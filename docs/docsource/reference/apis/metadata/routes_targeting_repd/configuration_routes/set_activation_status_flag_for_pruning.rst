Set Activation Status Flag for Pruning
======================================

This operation allows setting the activation status of the automatic
Raft log pruning feature of a repd. This route is only available on the
repd processes.

Request Parameters
------------------

This request takes a stringified JSON Boolean as a BODY parameter:

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

Response Elements
-----------------

This route does not return any value, but the HTTP status code indicates
the request's success or failure.

.. tabularcolumns:: cl
.. table::
   :widths: auto

   +-----------------+-------------------------------------------------+
   | **HTTP Status** | **Meaning**                                     |
   +=================+=================================================+
   | 204             | Success (No body returned.)                     |
   +-----------------+-------------------------------------------------+
   | other           | Failure (Body may provide failure description.) |
   +-----------------+-------------------------------------------------+

Examples
--------

Request Samples
~~~~~~~~~~~~~~~

The following sample request deactivates pruning on a specific repd:

.. code::

   PUT /_/configuration/prune HTTP/1.1
   Host: repd1.scality.com
   Content-Length: 5

   false

The following sample request activates pruning on a specific repd:

.. code::

   PUT /_/configuration/prune HTTP/1.1
   Host: repd1.scality.com
   Content-Length: 4

   true

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 204 OK
   Server: repd1
