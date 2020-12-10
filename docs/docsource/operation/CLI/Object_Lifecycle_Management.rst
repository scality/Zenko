.. _object_lifecycle:

Object Lifecycle Management
===========================

Cloud users can apply lifecycle rules (specified in Amazon’s `AWS S3 API
<https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html>`__) to buckets
managed through |product|. These rules are triggered after a defined time has passed
since the object’s last modification. |product| supports expiration and transition
of objects when a defined number of days has passed since those objects’
creation. This enables automated deletion or movement of older objects.

.. note::

   Lifecycle management features are not supported for Azure Blob Storage points
   of origin (Azure Blob frontend servers) in |product| version |version|.

Installation
------------

Lifecycle management is part of Backbeat configuration and is installed
with Backbeat. It is enabled by default, and can be disabled in the |product|
deployment configuration files.

Operation
---------

Lifecycle management conforms partially to the S3 lifecycle management syntax
described at
https://docs.aws.amazon.com/AmazonS3/latest/dev/object-lifecycle-mgmt.html.
|product| lifecycle management supports expiration and transition actions. Files
that exceed a preconfigured temporal threshold (for example, 90 days) are
expired and deleted from the bucket in which they are stored or transitioned and
moved.

Bucket lifecycle characteristics inhere to the bucket: |product|’s lifecycle
management feature does not set lifecycle characteristics, but does
enforce them. When lifecycle management is enabled, the host cloud
enforces buckets’ lifecycle rules. If CRR operation is enabled, |product|
replicates the lifecycle event to all backup clouds.

To configure bucket lifecycle, follow the AWS S3 Lifecycle Configuration
Element syntax described in
`https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html
<https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html>`__.

.. note:: To implement the S3 API effectively in a cross-cloud context, |product|
   interprets S3's ``<StorageClass>`` field differently from how AWS defines
   it. Where Amazon uses StorageClass to indicate various proprietary Amazon
   storage locations that can be described by their quality of service, |product|
   uses this parameter to identify cloud service locations by a user-defined
   name. So, instead of using ``<StorageClass>GLACIER<\StorageClass>`` for
   inexpensive, high-latency storage, the |product| user must define a cloud
   location with satisfactory storage and pricing requirements and use that
   cloud location as the target cloud storage location. |product| reads and writes
   to this location based on the StorageClass tag definition.

|product| provides three API calls to manage lifecycle properties per bucket:

-  PUT Bucket Lifecycle
-  GET Bucket Lifecycle
-  DELETE Bucket Lifecycle

   .. tip::
   
      See the `AWS S3 API Reference <https://docs.aws.amazon.com/AmazonS3/latest/API/RESTBucketOps.html>`__
      for protocol-level formatting details.

These calls manage bucket attributes related to lifecycle behavior, which are
stored as part of bucket metadata.

Managing Lifecycle Rules from the S3 API 
----------------------------------------

See `https://docs.aws.amazon.com/AmazonS3/latest/dev/lifecycle-configuration-examples.html 
<https://docs.aws.amazon.com/AmazonS3/latest/dev/lifecycle-configuration-examples.html>`__
for more examples and explanations on lifecycle rules.

#. Create a JSON file defining the bucket lifecycle rules (see
   https://docs.aws.amazon.com/AmazonS3/latest/dev/set-lifecycle-cli.html
   for examples).

   .. note::

      The “Rules” section is an array that can hold multiple
      rules.

#. Use the aws s3api to set the JSON lifecycle rule on a bucket,
   zenko-bucket.

   ::

       $ aws s3api put-bucket-lifecycle-configuration --bucket zenko-bucket --lifecycle-configuration file://lifecycle_config.json

   You can confirm that the rule has been set with:

   ::

       $ aws s3api get-bucket-lifecycle-configuration --bucket zenko-bucket

Once the lifecycle rules on the bucket are set, the rules apply to all
objects in the specified bucket.

.. _Lifecycle Queries:

Querying Lifecycle Events
-------------------------

You can access the storage location of transitioned object data by
viewing the object's metadata, for example by making a HEAD request.

Querying the CloudServer requires an active kubectl session with the
|product| controller and S3 API functionality configured as described in
:ref:`S3 API config`. Once this is configured, use the head-object command
as described in
https://docs.aws.amazon.com/cli/latest/reference/s3api/head-object.html.

For example:

.. code::
   
   $ aws s3api head-object --bucket <bucket-name> --key <key-name> --endpoint <endpoint-url>

returns:

.. code::

   {
      "AcceptRanges": "bytes",
      "ContentType": "application/octet-stream",
      "LastModified": "Tue, 16 Apr 2019 22:12:33 GMT",
      "ContentLength": 1,
      "ETag": "\"e358efa489f58062f10dd7316b65649e\"",
      "StorageClass": "aws-storage-location",
      "Metadata": {}
   }

The returned information describes the <key-name> object in the <bucket-name>
bucket. The StorageClass information indicates the object has transitioned to
a storage location named "aws-storage-location", as defined by the |product| user.

After an expiration event, the object is deleted, and no metadata can be
queried. The object metadata is not found. 
