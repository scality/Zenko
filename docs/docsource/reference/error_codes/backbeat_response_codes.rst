.. _Backbeat Response Codes:

Backbeat Response Codes
=======================

Backbeat exposes various metric routes that return a response with an HTTP code.

.. tabularcolumns:: X{0.30\textwidth}X{0.65\textwidth}
.. table::
   :widths: auto

   +----------+-----------------------------------------------------------+
   | Response | Details                                                   |
   +==========+===========================================================+
   | 200      | **OK:** success                                           |
   +----------+-----------------------------------------------------------+
   | 403      | **AccessDenied:** Requested IP address must be defined in |
   |          | 'conf/config.json' in the 'server.healthChecks.allowFrom' |
   |          | field.                                                    |
   +----------+-----------------------------------------------------------+
   | 404      | **RouteNotFound:** Route must be valid.                   |
   +----------+-----------------------------------------------------------+
   | 405      | **MethodNotAllowed:** The HTTP verb must be GET.          |
   +----------+-----------------------------------------------------------+
   | 500      | **InternalError:** This may be caused by one of several   |
   |          | components: the API server, Kafka, ZooKeeper, or one of   |
   |          | the producers for a topic.                                |
   +----------+-----------------------------------------------------------+
