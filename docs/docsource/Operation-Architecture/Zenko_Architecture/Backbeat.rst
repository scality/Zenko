Backbeat
========

A native-Node.js engine built around a messaging system, Backbeat is the
core engine for asynchronous replication, optimized for queuing metadata
updates and dispatching work to long-running background tasks.

Backbeat is:

-  **Containerized:** Backbeat lives in its own set of containers.
-  **Distributed:** Three to five instances per site are required for
   high availability. If one instance dies, the queue replica from
   another instance can be used to process the records.
-  **Extensible:** Backbeat allows extensions to the core engine to
   realize such features as replication, health check, and lifecycle
   management.
-  **Backend-agnostic:** All interactions go through CloudServer, which
   exposes separate “fast-path” routes, used only by Backbeat, on
   different ports controlled by an accessKey and secretKey.
-  **Backgroundable:** Backbeat includes a background process that runs
   on a crontab schedule. For example, the process can wake up at a set
   time and get a list of buckets, get attributes for a bucket, check
   lifecycle policy, check object metadata for tags (if tags are used in
   a policy), and then apply the lifecycle action to matched objects.

Zenko uses Backbeat extensions to enable cross-region replication,
health checks, and object lifecycle management. Further extensions are
under development.

Backbeat is an open-source project. You can learn more about it at its
home repository: \ https://github.com/scality/backbeat.


