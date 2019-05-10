.. _crr_retry:

CRR Retry
=========

The CRR Retry feature lets users monitor and retry failed CRR
operations. Users can retrieve a list of failed operations and order
Zenko to retry specific CRR operations.

From Orbit
----------

In Orbit, CRR Retry appears as a notice in the Location Status indicating that a
file or a number of files failed to replicate. The number of failed operations
is listed as a metric under the Replication Statistics for that location. By
clicking the failed objects metric, Orbit provides a listing of the failed
objects, each with a "Retry" button. By clicking this button, the user triggers
a retry of the failed replication operation. The entire listing can be retried
by clicking the "Retry All" button.

From the Command Line
---------------------

The CRR Retry feature comprises three API calls. These are:

-  List All Failed Operations by Location (GET)
-  List Failed Operations by Object (GET)
-  Retry Failed Operations (POST)

These requests, sent to the Backbeat endpoints, return members stored in
``bb:crr:failed:*`` Redis sorted sets. A Retry command removes the member and
changes the object's metadata “FAILED” status to “PENDING”, which queues them to
be retried by the replication processor.

.. _`Object Lifecycle Management`: ../Lifecycle_Management/Object_Lifecycle_Management.html
