Backbeat
========

Backbeat is the core engine for asynchronous replication, optimized for queuing
metadata updates and dispatching work to long-running background tasks.

Backbeat exposes metrics, healthcheck information, and enables cross-region 
replication that can retry on failures. Access these features through the 
Backbeat API. 

.. toctree::
   :maxdepth: 2

   backbeat_healthcheck/index
   backbeat-metrics/index
   crr_retry
