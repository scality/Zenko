.. _crr_pause-resume:

CRR Pause and Resume
====================

This feature enables pausing and resuming cross-region replication (CRR)
operations by storage location. Users can also resume CRR operations for
a given storage location by specifying a number of hours from the
present. This is particularly useful when the user knows a destination
location will be down and wants to schedule a time to resume CRR.

CRR pause and resume is accessible via the Backbeat API and documented
in the Zenko Reference Guide.

API calls for this feature include:

-  Get CRR Status
-  Get CRR Status for a Location
-  Resume CRR for a Location
-  Pause All CRR
-  Pause CRR for a Location
-  Resume All CRR
-  Resume CRR for a Location
-  Schedule Resume CRR for a Location

This feature is implemented in the API and is accessible from the command
line or from Orbit. 

.. _`CRR Retry`: CRR_Retry.html
