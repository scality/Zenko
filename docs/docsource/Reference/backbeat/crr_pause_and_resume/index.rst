CRR Pause and Resume
====================

CRR Pause and Resume offers a way for users to manually pause and resume
cross-region replication (CRR) operations by storage locations.

Users may also choose to resume CRR operations for a given storage
location by a specified number of hours from the current time. This is
particularly useful when the user knows a destination location will be
down for a certain time and wants to schedule a time to resume CRR.

.. toctree::
   :maxdepth: 2

   design
   crr_pause_and_resume_api_definition
