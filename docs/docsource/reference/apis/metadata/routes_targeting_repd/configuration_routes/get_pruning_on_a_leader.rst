.. _get_pruning_on_a_leader:

Get Pruning on a Leader
=======================

This operation returns the setting state of the Activate Pruning on a Leader
setting. 

Request Parameters
------------------

``GET /_/configuration/prune_on_leader``

Response Elements
-----------------

This request returns a stringified JSON Boolean as a BODY parameter.

.. tabularcolumns:: lll
.. table::
   
   +--------+---------+------------------------------------------------------+
   | Value  | Type    | Meaning                                              |
   +========+=========+======================================================+
   | true   | Boolean | Pruning on this repd is allowed if it is a leader.   |
   +--------+---------+------------------------------------------------------+
   | false  | Boolean | Pruning on this repd is disallowed if it is a leader.|
   +--------+---------+------------------------------------------------------+

The HTTP status code indicates the request’s success or failure.

.. tabularcolumns:: ll
.. table::
   
   +-------------+--------------------------------------------------+
   | HTTP Status | Meaning                                          |
   +=============+==================================================+
   | 200         | Success (Body (value) returned.)                 |
   +-------------+--------------------------------------------------+
   | other       | Failure (Body may provide failure description.)  |
   +-------------+--------------------------------------------------+

Examples
~~~~~~~~

Sample Requests
~~~~~~~~~~~~~~~
               

The following sample request returns the pruning status on a specific repd:

::

   GET /_/configuration/prune_on_leader HTTP/1.1
   Host: repd1.scality.com
   
Sample Response
~~~~~~~~~~~~~~~

::

   HTTP/1.1 200 OK
   Server: repd1
  
   true
