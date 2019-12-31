Set Up Out-of-Band Updates from an NFS Mount
============================================

Zenko 1.1 allows ingestion and out-of-band (OOB) updates from existing NFS mount
points. This new feature does not copy the files themselves; rather, the
system's attributes are copied to Zenko for data management. Using this
information, Zenko can act on NFS mounts as it would any other type of bucket,
thus enabling metadata search, cloud replication, and lifecycle transition or
expiration. Writes from Zenko users to buckets at NFS locations are not
permitted.

Minimum Requirements
--------------------

Setting up Zenko for out-of-band updates from NFS mount points requires:

* Zenko 1.1.0
* A Linux-compatible NFS mount
* Kubernetes nodes with the NFS packages (nfs-utils for CentOS,
  nfs-common for Debian) installed. 

  .. note:: 

     MetalK8s 1.1.0 installs all required packages by default.

To add an NFS location in Orbit, you must have an NFS server endpoint and know
the export path. You may also apply specific NFS mount options based on your
environment's requirements. For example, for read-only access to the NFS mount,
specify the ``ro`` NFS option.

#. Create the location in Orbit. Your export path can include specific
   folders. For example, if your root export is /data but you only need Zenko
   to work with the accounting/2019 subfolder, specify
   ``/data/accounting/2019`` as the export path. In this way you can assign
   different folders to their own buckets in Zenko.

   .. image:: ../Graphics/add_nfs_location.png
      :scale: 75%
      :align: center

#. Create your bucket in the mirror-mode version of the location just
   created. As of Zenko 1.1.0, only the "Mirror Mode" option is supported, and
   the standard location option does not allow writes to the location.

   .. image:: ../Graphics/create_nfs_bucket.png

   With the bucket created, Zenko deploys and configures new pods in Kubernetes
   to access and ingest file metadata. Naming is based on the location name and
   you can see these pods by running ``kubectl get pods``.  Pods typically
   deploy within a few minutes of bucket creation, along with the initial
   ingestion.

   .. image:: ../Graphics/cosmos_initial_ingest.png

Advanced Usage
--------------

Create Buckets from the Command Line
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can create mirror-mode buckets from the command line using the aws-cli
client. For example, the following command creates a mirror-mode bucket for an
NFS location named "my-nfs".

::

   $ aws s3 mb s3://nfs-bucket-name --region 'my-nfs:ingest' --endpoint https://zenko.local

Cron Job Defaults
~~~~~~~~~~~~~~~~~

Zenko's NFS ingestion cron job is triggered every 12 hours (12 pm and 12 am) by
default, but this is configurable. The cron specification supports both the
traditional (``* *0 * * * *``) format as well as the non-standard (``@hourly``)
format. Adding and `upgrading Zenko
<https://github.com/scality/Zenko/blob/development/1.1/docs/docsource/installation/upgrade/upgrade_zenko.rst#upgrading>`_
with the following YAML added as custom values sets a default cron schedule for
all future created NFS locations. 

::

   cosmos:
     scheduler:
       # Run hourly
       schedule: "@hourly"

.. note::

   This does not change the cron schedule on existing NFS locations.


Modify Cron on Existing NFS Locations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Cron schedules can be customized to create cron schedules in various NFS
locations. The quickest way to customize cron is to edit the resource
directly::

   $ kubectl edit cosmos <my-nfs-location-name>

   spec:
   ...
     rclone:
        # Run every day at 8am
        schedule: '0 8 * * *'

List Installed NFS Locations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Because each location is treated as a unique resource, you can list all
installed locations with the command::


   $ kubectl get cosmos


Managed Resources
~~~~~~~~~~~~~~~~~

Due to the Kubernetes operator-managed nature of the NFS locations, resources
like cron jobs or deployments related to each location are "enforced state."
This means that if a cron job for a location is deleted, it is automatically
recreated, which can be useful for testing and debugging. This also means,
however, that you *cannot* directly edit a managed cronjob or deployment
resource, because your changes are immediately changed to match the state
defined in the "cosmos" resource. Desired changes must be made by editing the
nfs resources themselves using kubectl.

::

   $ kubectl edit cosmos <my-nfs-location-name>

