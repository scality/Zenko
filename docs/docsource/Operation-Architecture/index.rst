Operation and Architecture Guide
================================

Zenko is Scality’s multi-cloud storage controller. It provides a single
point of integration, using the Amazon S3 cloud storage API, and enables
backup, transfer, or data replication across private and public clouds.

Using Zenko, you can store to a Scality RING storage device, and
automatically back up to one or several public clouds. Alternatively,
you can use a public cloud such as Amazon S3 as a primary storage and
replicate data stored there—specific files, file types, or entire
buckets—to other supported clouds, such as Google Cloud Platform
(GCP) or Microsoft Azure.

.. toctree::
   :maxdepth: 2

   About Zenko<Introduction/About_Zenko>
   Architecture<Zenko_Architecture/Architecture>
   Services<Services/Services>
   Using Orbit<Orbit_UI/Using_Orbit>
   Cloud Management Services<Dashboards/Cloud_Management_Services>
   Zenko from the Command Line<Zenko_CLI/Zenko_from_the_Command_Line>
