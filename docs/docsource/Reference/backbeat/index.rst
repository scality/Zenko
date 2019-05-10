Backbeat
========

Backbeat maintains job queues for CloudServer. It mediates between the core 
CloudServer logic and the transient Kafka lists and MongoDB databases where
task information is queued.

Backbeat provides a REST API with endpoints for healthcheck, cross-region
replication (CRR), and metrics. It is also instrumental in garbage collection.

.. toctree::
   :maxdepth: 1

   healthcheck
   crr_retry
   pause-resume
   metrics

The Backbeat API provides REST endpoints for these features.

Routes
------

All Backbeat API endpoints are addressed through the /_/backbeat/api/...
route with endpoints entered as described in the sections linked above.

Accessing the Backbeat API paths is detailed in *Zenko Operations* in the 
"Backbeat API" section. 

The internal routes presented in the following table are required for
testing the overall health of Backbeat and to measure the progress of an
ongoing replication.


.. _Backbeat Response Codes:

Response Codes
--------------

Backbeat exposes various metric routes that return a response with an
HTTP code.

.. tabularcolumns:: X{0.10\textwidth}X{0.85\textwidth}
.. table::

   +----------+----------------------------------------------------------------+
   | Response | Details                                                        |
   +==========+================================================================+
   | 200      | **OK:** Success                                                |
   +----------+----------------------------------------------------------------+
   | 403      | **AccessDenied:** Request IP address must be defined in        |
   |          | conf/config.json in the server.healthChecks.allowFrom field.   |
   +----------+----------------------------------------------------------------+
   | 404      | **RouteNotFound:** Route must be valid.                        |
   +----------+----------------------------------------------------------------+
   | 405      | **MethodNotAllowed:** The HTTP verb must be a GET.             |
   +----------+----------------------------------------------------------------+
   | 500      | **InternalError:** This could be caused by one of several      |
   |          | components: the api server, Kafka, Zookeeper, Redis, or one    |
   |          | of the Producers for a topic.                                  |
   +----------+----------------------------------------------------------------+

Replication Status
------------------

A special status, PROCESSING, supports cross-region replication with a
multiple-backend topology. Objects in CRR buckets transition from PENDING to
PROCESSING to COMPLETED or FAILED.

**ReplicationStatus**

-  PENDING: CRR to all backends is pending.
-  PROCESSING: At least one backend has completed and is waiting for
   other backend(s) to finish.
-  COMPLETED: All backends report a completed status.
-  FAILED: At least one backend failed.

Each backend’s replication status is reported as user metadata.

For example, if the site names configured in the replication endpoints
are aws-backend-1, aws-backend-2, azure-backend-1, and azure-backend-2,
user metadata on the head object may appear as:

::

    aws-backend-1-replication-status: COMPLETED
    aws-backend-2-replication-status: PENDING
    azure-backend-1-replication-status: COMPLETED
    azure-backend-2-replication-status: PENDING

This user metadata is in addition to the object’s replication status,
which follows the logic laid out in the bucket config file.
