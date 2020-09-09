CRR Retry
=========

The CRR Retry feature lets users monitor and retry failed CRR
operations. Users can retrieve a list of failed operations and 
request CloudServer to retry specific CRR operations.

Using CRR Retry
---------------

The CRR Retry feature consists of three API calls. These are:

-  List All Failed Operations by Location (GET)
-  List Failed Operations by Object (GET)
-  Retry Failed Operations (POST)

These requests, sent to the Backbeat endpoints, return members stored in
``bb:crr:failed:*`` Redis sorted sets. A Retry command removes the member and
changes the object's metadata “FAILED” status to “PENDING”, which queues them to
be retried by the replication processor.

