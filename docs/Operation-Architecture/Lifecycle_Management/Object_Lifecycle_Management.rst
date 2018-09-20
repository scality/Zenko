Object Lifecycle Management
===========================

Cloud users can apply lifecycle rules (specified in Amazon’s `AWS S3
API <https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html>`__) to
buckets managed through Zenko. These rules are triggered after a defined
time has passed since the object’s creation. Zenko supports expiration
of versioned or non-versioned objects, when a defined number of days has
passed since those objects’ creation. This enables automatic deletion of
older versions of versioned objects to reclaim storage space.

The lifecycle management implementation in Zenko comprises several
components. Most rely on Kafka and ZooKeeper to pass state to each
other.

Installation
------------

Lifecycle management is part of Backbeat configuration and is installed
with Backbeat.

Lifecycle management is enabled by default. Lifecycle management can be
disabled in the Zenko deployment configuration files.

Operation
---------

Lifecycle management conforms partially to the S3 lifecycle management
syntax described at
https://docs.aws.amazon.com/AmazonS3/latest/dev/object-lifecycle-mgmt.html.
Zenko lifecycle actions are constrained to expiration actions, and not
transition actions. Files that exceed a preconfigured temporal threshold
(for example, 90 days) are “expired” and deleted from the bucket on
which they are stored.

Bucket lifecycle characteristics inhere to the bucket: Zenko’s lifecycle
management feature does not set lifecycle characteristics, but does
enforce them. When lifecycle management is enabled, the host cloud
enforces buckets’ lifecycle rules. If CRR operation is enabled, Zenko
replicates the expiration to all backup clouds.

To configure bucket lifecycle, follow the AWS S3 Lifecycle Configuration
Element syntax described in
`https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html. <https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html>`__

Zenko API Calls
---------------

The Zenko API provides three calls to manage lifecycle properties per
bucket:

-  PUT Bucket Lifecycle
-  GET Bucket Lifecycle
-  DELETE Bucket Lifecycle

   .. tip::

      See the `AWS S3
      API Reference <https://docs.aws.amazon.com/AmazonS3/latest/API/RESTBucketOps.html>`__
      for protocol-level formatting details.


These calls manage bucket attributes related to lifecycle behavior,
which are stored as part of bucket metadata.

Setting Up Using the AWS s3api CLI
----------------------------------

See `https://docs.aws.amazon.com/AmazonS3/latest/dev/life
cycle-configuration-examples.html <https://docs.aws.amazon.com/AmazonS3/latest/dev/lifecycle-configuration-examples.html>`__
for more examples and explanations on lifecycle rules.

#. Create a JSON file defining the bucket lifecycle rules (see
   https://docs.aws.amazon.com/AmazonS3/latest/dev/set-lifecycle-cli.htm\ l
   for examples).

  .. note::

     The “Rules” section is an array that can hold multiple
     rules.

#. Use the aws s3api to set the JSON lifecycle rule on a bucket,
   zenko-bucket.

   ::

       $ aws s3api put-bucket-lifecycle-configuration --bucket zenko-bucket --lifecycle-configuration file://expire.json

   You can confirm that the rule has been set with

   ::

       $ aws s3api get-bucket-lifecycle-configuration --bucket zenko-bucket

Once the lifecycle rules on the bucket are set, the rules apply to all
objects in the specified bucket.

`Go back to Advanced Workflows`_

`Go back to CRR Retry`_

.. _`Go back to Advanced Workflows`: ../Orbit_UI/Advanced_Workflows/Advanced_Workflows.html

.. _`Go back to CRR Retry`: ../Zenko_CLI/CRR_Retry.html
