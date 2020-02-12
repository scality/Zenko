Out-of-Band Updates from an AWS Bucket
======================================

Zenko allows ingestion and out-of-band (OOB) updates from existing AWS
buckets. This feature does not copy the files themselves; rather, the bucket's
attributes are copied to Zenko as metadata for management. Using this
information, Zenko acts on AWS as it would any other Zenko bucket, thus enabling
metadata search, cloud replication, and lifecycle transition or expiration.

.. important::

   Out-of-band updates for AWS is offered with limited availability. Successful
   deployment will require assistance from Scality. 

Minimum Requirements
--------------------

Setting up Zenko for out-of-band updates from AWS buckets requires:

* A working Zenko instance, v. 1.2.0 or later

* An AWS bucket, with all necessary permissions

  .. note::

     MetalK8s installs all required packages by default.

* An AWS bucket, with all necessary permissions

.. _Set Up Out-of-Band Updates for AWS:

Set Up Out-of-Band Updates for AWS
----------------------------------

#. Create the AWS location in Orbit.

   .. image:: ../../../Graphics/Add_AWS_location_for_OOB.png

#. Create your bucket in the mirror-mode version of the location just
   created.

   .. image:: ../../../Graphics/Add_AWS_bucket_for_OOB.png

   With the bucket created, Zenko deploys and configures new pods in Kubernetes
   to access and ingest file metadata. Naming is based on the location name and
   you can see these pods by running ``kubectl get pods``.  Pods typically
   deploy within a few minutes of bucket creation, along with the initial
   ingestion.

   .. image:: ../../../Graphics/cosmos_initial_ingest.png

Advanced Usage
--------------

Create Buckets from the Command Line
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can create mirror-mode buckets from the command line using the aws-cli
client. For example, the following command creates a mirror-mode bucket for an
AWS location named "my-aws".

::

   $ aws s3 mb s3://aws-bucket-name --region 'my-aws:ingest' --endpoint https://zenko.local

Cron Job Defaults
~~~~~~~~~~~~~~~~~

Zenko's AWS ingestion cron job is triggered every 12 hours (12 pm and 12 am) by
default, but this is configurable. The cron specification supports both the
traditional (``* *0 * * * *``) format as well as the non-standard (``@hourly``)
format. Adding and `upgrading Zenko
<https://github.com/scality/Zenko/blob/development/1.1/docs/docsource/installation/upgrade/upgrade_zenko.rst#upgrading>`_
with the following YAML added as custom values sets a default cron schedule for
all future created AWS locations.

::

   cosmos:
     scheduler:
       # Run hourly
       schedule: "@hourly"

.. note::

   This does not change the cron schedule on existing AWS locations.

Modify Cron on Existing AWS Locations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Cron schedules can be customized to create cron schedules for various AWS
locations. The quickest way to customize cron is to edit the resource
directly::

   $ kubectl edit cosmos <my-aws-location-name>

   spec:
   ...
     rclone:
        # Run every day at 8am
        schedule: '0 8 * * *'

List Installed AWS Locations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Because each location is treated as a unique resource, you can list all
installed locations with the command::

   $ kubectl get cosmos

Managed Resources
~~~~~~~~~~~~~~~~~

Due to the Kubernetes operator-managed nature of the AWS locations, resources
like cron jobs or deployments related to each location are "enforced state."
This means that if a cron job for a location is deleted, it is automatically
recreated, which can be useful for testing and debugging. This also means,
however, that you *cannot* directly edit a managed cronjob or deployment
resource, because your changes are immediately changed to match the state
defined in the "cosmos" resource. Desired changes must be made by editing the
AWS resources themselves using kubectl.

::

   $ kubectl edit cosmos <my-aws-location-name>
