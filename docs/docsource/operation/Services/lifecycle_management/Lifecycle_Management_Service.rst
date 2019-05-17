Lifecycle Management Service
============================

This Backbeat extension gives Zenko conformity to AWS S3 lifecycle
rules. Specifically, lifecycle management gives users the ability to
specify a time threshold beyond which certain files are to be expunged
to free up storage space. Other lifecycle actions may be supported in
the future.

Zenko follows the S3 API to provide three calls to manage lifecycle
properties per bucket:

-  PUT Bucket Lifecycle
-  GET Bucket Lifecycle
-  DELETE Bucket Lifecycle

These calls manage bucket attributes related to lifecycle behavior,
which are stored as bucket metadata.

.. toctree::
   :maxdepth: 1

   Lifecycle Expiration Policies<lifecycle_expiration_policies>