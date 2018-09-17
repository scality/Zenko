CRR Retry
=========

The CRR Retry feature lets users monitor and retry failed CRR
operations. Users can retrieve a list of failed operations and order
Zenko to retry specific CRR operations.

From Orbit
----------

In Orbit, CRR Retry appears as an error message in the Location Status
indicating that a file or a number of files failed to replicate. With
this message, Orbit also provides a Retry button. By clicking this
button, the user triggers a retry of the failed replication.

From the Command Line
---------------------

The CRR Retry feature comprises three API calls, described in detail in
the . These are:

-  Get All Failed Operations
-  Get Failed Operations by Object
-  Retry (POST)

These requests, sent to the Backbeat endpoints, return items marked with
``bb:crr:failed`` Redis keys. A Retry command changes these “failed”
statuses to “pending”, which queues them to be retried by the
replication processor.

`Go back`_

Next: `Object Lifecycle Management`_


.. _`Go back`: CRR_Pause_&_Resume.html

.. _`Object Lifecycle Management`: ../Lifecycle_Management/Object_Lifecycle_Management.html
