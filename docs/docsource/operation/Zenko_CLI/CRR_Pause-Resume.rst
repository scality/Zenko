.. _CRR Pause and Resume:

CRR Pause and Resume
====================

This feature enables pausing and resuming cross-region replication (CRR)
operations by storage location. Users can also resume CRR operations for
a given storage location by specifying a number of hours from the
present. This is particularly useful when the user knows a destination
location will be down and wants to schedule a time to resume CRR.

CRR pause and resume is accessible via the Backbeat API and documented
in the :version-ref:`Zenko Reference <https://documentation.scality.com/Zenko/{version}/reference/index.html>`.

API calls for this feature include:

-  :version-ref:`Get CRR Status <https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/get_crr_status.html>`
-  :version-ref:`Get CRR Status for a Location<https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/get_crr_status_per_location.html>`
-  :version-ref:`Pause CRR for a Location <https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/pause_crr_per_location.html>`
-  :version-ref:`Pause All CRR <https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/pause_all_crr.html>`
-  :version-ref:`Resume CRR for a Location <https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/resume_crr_per_location.html>`
-  :version-ref:`Resume All CRR <https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/resume_all_crr.html>`
-  :version-ref:`Get CRR Resume Time <https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/get_crr_resume_time.html>`
-  :version-ref:`Set CRR Resume Time <https://documentation.scality.com/Zenko/{version}/reference/backbeat/crr_pause_resume/set_crr_resume_time.html>`

This feature is implemented in the API and is accessible from the command
line or from Orbit. 

