Set Log Level
=============

This operation modifies the level of logging (``logLevel`` or
``logDumpLevel``). This route is only available for repd processes.
Available levels are: ``trace``, ``debug``, ``info``, ``warn``,
``error``, and ``fatal``.

.. note::

  The level of ``logDumpLevel`` must be greater than or equal to
  the level of ``logLevel`` (severity increases from ``trace`` to
  ``fatal``).

Request Parameters
------------------

The ``PUT`` requested parameter name ``{name}`` must be given in the
request's URL: ``/_/configuration/{name}``.

This request takes a string as a BODY parameter.

Both ``logLevel`` and ``logDumpLevel`` can be modified using
``{name} = log``. The new levels are given in a two-attribute object as
shown:

.. code::

   {
       logLevel: log-level,
       logDumpLevel: log-dump-level,
   }

The object is stringified as a string sent along with the BODY request.

Response Elements
-----------------

This route does not return any value, but the HTTP status code carries
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

Request Sample
~~~~~~~~~~~~~~

The following sample request sets a repd's log level to ``trace``:

.. code::

   PUT /_/configuration/logLevel HTTP/1.1
   Host: repd1.scality.com
   Content-Length: 5

   trace

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 204 No Content
   Server: repd1
