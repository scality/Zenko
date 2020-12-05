Lifecycle Management Service
============================

Lifecycle management enables you to set policies in |product| that control the
lifecycle of objects in a bucket conforming to AWS S3 lifecycle rules. Lifecycle
management gives users the ability to specify a time threshold beyond which
certain files are to be moved (lifecycle transition) or expunged (lifecycle
expiration) to free up storage space or reduce storage costs.  You can control
lifecycle policies using the :ref:`Orbit user interface<object_lifecycle_mgmt>`,
or with API calls.

Using this Backbeat extension, |product| follows the S3 API to provide three calls
to manage lifecycle properties per bucket:

-  PUT Bucket Lifecycle
-  GET Bucket Lifecycle
-  DELETE Bucket Lifecycle

These calls manage bucket attributes related to lifecycle behavior, which are
stored as bucket metadata.

.. note::

   This feature is not yet implemented for Azure Blob frontends.

Lifecycle Policies
------------------

Cloud users can apply lifecycle expiration or transition rules (specified in
Amazon’s `AWS S3 API <https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html>`__)
to buckets managed through |product|. These rules are triggered after a defined
time has passed since the object’s last modification.

|product| supports expiration or transition of versioned or non-versioned objects,
when a defined number of days has passed since those objects’ creation. This
enables automatic deletion of older versions of versioned objects to reclaim
storage space. |product| also supports triggering expiration or transition of
the latest version on a date. This is currently feasible from the S3 API, but not
using Orbit. Using |product| from the command line or from Orbit, you can expire
the current version of an object with a separate rule. For versioned buckets,
lifecycle adds a delete marker automatically when a rule expiring a current
version is triggered, such as when a user deletes an object without first
specifying a version ID.

Bucket lifecycle characteristics inhere to each bucket. |product|’s lifecycle
management feature enforces, but does not set these characteristics. When
lifecycle management is enabled, the host cloud enforces buckets’ lifecycle
rules.

To configure bucket lifecycle, follow the AWS S3 Lifecycle Configuration
Element syntax described in
`https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html
<https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html>`__.

.. note::

   Lifecycle management rules conform to the S3 lifecycle management
   syntax for expiration and transition policies described at
   https://docs.aws.amazon.com/AmazonS3/latest/dev/object-lifecycle-mgmt.html.
   Files that exceed a preconfigured temporal threshold (for example, 90 days)
   can be transitioned (moved) or expired (deleted) from the bucket on which
   they are stored.

   |product| does not support lifecycle transitions to Amazon's STANDARD\_IA or
   GLACIER storage classes; only to other storage locations.
