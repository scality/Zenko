Get Configuration Parameter
===========================

This operation returns the value of a parameter in the configuration
file. This route is only available for repd processes.

Request Parameters
------------------

The requested parameter name ``{name}`` must be given in the request's
URL: ``/_/configuration/{name}``.

Response Elements
-----------------

The response body is the value of the configuration parameter. If not a
string, it is stringified.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following request gets the logging level:

.. code::

   GET /_/configuration/logLevel HTTP/1.1
   Host: repd1.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd1
   Content-Length: 5

   debug
