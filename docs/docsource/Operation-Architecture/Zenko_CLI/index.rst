.. _`Zenko from the Command Line`:

Zenko from the Command Line
===========================

Zenko supports command-line interactions for a limited set of Amazon
S3 API calls and to access its own Backbeat server.

Enabling command-line interactions enables programmatic access to
the following features:

  *  :ref:`crr_metrics-health`
  *  :ref:`crr_retry`
  *  :ref:`crr_pause-resume`
  *  :ref:`object_lifecycle`
  *  :ref:`Monitoring_NFS-SOFS_Ingestion`

To access Zenko from the command line, you must first set up access to 
`the S3 API <setting_up_api_access.html#setting_up_s3_api_access>`_, 
`the Backbeat API <setting_up_api_access.html#setting-up-backbeat-api-access>`_,
or both. 

.. toctree::
   :maxdepth: 2
   :titlesonly:
   :hidden:

   setting_up_api_access
   CRR_Metrics_and_Health
   CRR_Retry
   CRR_Pause_&_Resume
   Object_Lifecycle_Management
   Monitoring_NFS-SOFS_Ingestion

