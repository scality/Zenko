Zenko Operation
===============

Zenko is Scality’s multi-cloud storage controller. It provides a single point of
integration using the Amazon S3 and Azure Blob Storage cloud storage APIs, and
enables data backup, transfer, and replication across private and public clouds.

Using Zenko, you can store to a Scality RING storage device and automatically
back up to one or several public clouds. Alternatively, you can use a public
cloud such as Amazon S3 as primary storage and replicate data stored
there—-specific files, file types, or entire buckets—-to other supported clouds,
such as Google Cloud Platform (GCP) or Microsoft Azure.

.. toctree::
   :maxdepth: 2

   About Zenko<Introduction/index>
   Architecture<Architecture/index>
   Services<Services/index>
   Using Orbit<Orbit_UI/index>
   The XDM UI<XDM_GUI/index>
   Cloud Management Services<Dashboards/Cloud_Management_Services>
   Zenko from the Command Line<Zenko_CLI/index>
