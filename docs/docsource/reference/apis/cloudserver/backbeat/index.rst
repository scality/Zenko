.. _backbeat:

Backbeat
========

Backbeat is the core engine for asynchronous replication, optimized for queuing
metadata updates and dispatching work to long-running background tasks, like
retries for failed cross-region replication (CRR) attempts. Backbeat maintains
job queues for CloudServer. It mediates between the core CloudServer logic and
the transient Kafka lists and MongoDB databases where task information is
queued. It is also instrumental in garbage collection.

Backbeat provides a REST API with endpoints for healthcheck, cross-region
replication (CRR), and metrics.

The Backbeat API provides REST endpoints for these features.

Common Request Headers
----------------------

All Backbeat API endpoints are addressed through the /_/backbeat/api/ route with
endpoints entered as described in the sections linked above.

Accessing the Backbeat API paths is detailed in
:version-ref:`Setting Up Backbeat Access<https://documentation.scality.com/Zenko/{version}/operation/Zenko_CLI/index.html#setting-up-backbeat-api-access>`
in :version-ref:`Zenko Operation<https://documentation.scality.com/Zenko/{version}/operation/index.html>`.

The internal routes presented in the following table are required for testing
the overall health of Backbeat and to measure the progress of an ongoing
replication.

Replication Status
------------------

A special status, PROCESSING, supports cross-region replication with a
multiple-backend topology. Objects in CRR buckets transition from PENDING to
PROCESSING, then to COMPLETED or FAILED.

-  PENDING: CRR to all backends is pending.
-  PROCESSING: At least one backend has completed and is waiting for
   other backend(s) to finish.
-  COMPLETED: All backends report a completed status.
-  FAILED: At least one backend failed.

Each backend’s replication status is reported as user metadata.

For example, if the site names configured in the replication endpoints are
aws-backend-1, aws-backend-2, azure-backend-1, and azure-backend-2, user
metadata on the head object may appear as:

::

    aws-backend-1-replication-status: COMPLETED
    aws-backend-2-replication-status: PENDING
    azure-backend-1-replication-status: COMPLETED
    azure-backend-2-replication-status: PENDING

This user metadata is in addition to the object’s replication status,
which follows the logic laid out in the bucket config file.

.. toctree::
   :maxdepth: 2

   healthcheck/index
   crr_retry/index
   crr_pause_resume/index
   metrics/index
