Location Management
===================

Users save data to files, which are stored in buckets. Buckets are
stored in locations, which correspond (quite roughly) to a service and a
region, such as AWS us-east-1, or GCP europe-west1. Before you can
establish a location in Orbit, you must have an established account with
at least one cloud storage service provider.

If you don’t have a cloud storage account already configured, here are
some useful links to get started. These are subject to change without
notice.

-  Amazon S3:

   https://aws.amazon.com/s3/

-  Google Cloud Storage

   https://cloud.google.com/storage/getting-started/

-  Microsoft Azure Blob

   https://docs.microsoft.com/en-us/azure/storage/common/storage-create-storage-account#create-a-storage-account

-  DigitalOcean Spaces

   https://www.digitalocean.com/docs/spaces/quickstart/

-  Wasabi Hot Cloud Storage

   https://wasabi.com/s3-compatible-cloud-storage/

It is important to maintain carefully all identifying account
information from your cloud service, such as user names, access keys,
and secret keys.

You can:

.. toctree::
   :maxdepth: 1
   
      Add a Storage Location <Adding_a_Storage_Location>
      Add a Transient Source Storage Location <../Advanced_Workflows/Adding_a_Transient_Source_Storage_Location>

`Go back`_

.. _`Go back`: ../Using_Orbit.html
