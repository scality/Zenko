.. _Out-of-Band Updates:

Out-of-Band Updates
===================

Zenko operates by establishing and managing a namespace of data. For select
object stores, Zenko does not have to create a namespace; rather, it can read an
existing namespace and use it as its own. This process of metadata ingestion
makes it easier to manage existing data stores, as Zenko can "go back in time"
and pick up the history of a namespace and assume management and replication
tasks retroactively.

Out-of-band updates can be performed on S3 Connector, AWS, and NFS servers.

.. toctree::
   :maxdepth: 1

   Set Up S3 Connector for Out-of-Band Updates<set_up_S3C_for_OOB>
   Set Up AWS for Out-of-Band Updates<set_up_AWS_for_OOB>
   Set Up NFS for Out-of-Band Updates<set_up_NFS_for_OOB>
