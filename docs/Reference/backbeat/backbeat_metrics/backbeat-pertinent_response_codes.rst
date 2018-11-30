.. _Backbeat-pertinent Response Codes:

Backbeat-pertinent Response Codes
=================================

Backbeat exposes various metric routes that return a response with an
HTTP code.

+-----------------------------------+-----------------------------------+
| Response                          | Details                           |
+===================================+===================================+
| 200                               | **OK:** Success                   |
+-----------------------------------+-----------------------------------+
| 403                               | **AccessDenied:** Request IP      |
|                                   | address must be defined in        |
|                                   | conf/config.json in the           |
|                                   | server.healthChecks.allowFrom     |
|                                   | field.                            |
+-----------------------------------+-----------------------------------+
| 404                               | **RouteNotFound:** Route must be  |
|                                   | valid.                            |
+-----------------------------------+-----------------------------------+
| 405                               | **MethodNotAllowed:** The HTTP    |
|                                   | verb must be a GET.               |
+-----------------------------------+-----------------------------------+
| 500                               | **InternalError:** This could be  |
|                                   | caused by one of several          |
|                                   | components: the api server,       |
|                                   | Kafka, Zookeeper, Redis, or one   |
|                                   | of the Producers for a topic.     |
+-----------------------------------+-----------------------------------+
