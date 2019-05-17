.. _`Monitoring_NFS-SOFS_Ingestion`:

Monitoring NFS/SOFS Ingestion
=============================

Zenko 1.1 implements an NFS feature that ingests the NFS file
hierarchy that the RING's Scale-Out File System (SOFS) projects. For
this release, the only available metrics for NFS/SOFS ingestion
operations reside in log files. SOFS metadata ingestion runs on a cron
schedule, and users can make a query against Cosmos on the kubectl
location to discover how and when scheduled NFS activities have been
executed.

To find the relevant Cosmos pods, enter:

.. code::

   $ kubectl get pods  | grep "rclone"

   nfs-options-cosmos-rclone-1555329600-7fr27                    0/1     Completed   0          7h
   nfs-options-cosmos-rclone-1555333140-bb5vf                    1/1     Running     0          1h

Use this information to retrieve the logs with a command formatted as follows:

.. code::

   $ kubectl logs -f {{location}}-cosmos-rclone-{{hash}}

Hence:

.. code::

   $ kubectl logs -f my-location-name-cosmos-rclone-84988dc9d4-9dwjl

yields:

.. code::

   * myobjects273725
   * myobjects273726
   * myobjects273727

   2019/04/15 17:48:30 INFO  : S3 bucket nfs-rsize: Waiting for checks to finish
   2019/04/15 17:48:31 INFO  : S3 bucket nfs-rsize: Waiting for transfers to finish
   2019/04/15 17:48:31 INFO  : Waiting for deletions to finish
   2019/04/15 17:48:31 INFO  :
   Transferred:                0 / 0 Bytes, -, 0 Bytes/s, ETA -
   Errors:                 0
   Checks:            500000 / 500000, 100%
   Transferred:            0 / 0, -
   Elapsed time:  2h48m18.8s


.. tabularcolumns:: X{0.20\textwidth}X{0.75\textwidth}
.. table::

   +--------------+------------------------------------------------------------+
   | Response     | Description                                                |
   +==============+============================================================+
   | Transferred  | The byte count of metadata transferred, with data rate in  |
   | 		  | B/s and a completion time estimate. Transferred counts are |
   |		  | almost always 0/0.                                         |
   +--------------+------------------------------------------------------------+
   | Errors       | Aggregated error count for the requested job.              |
   +--------------+------------------------------------------------------------+
   | Checks       | Ingested information/total information to be ingested,     |
   | 		  | and a percentage expressing this ratio.                    |
   +--------------+------------------------------------------------------------+
   | Elapsed Time | Time spent on the current ingestion cycle.	               |
   +--------------+------------------------------------------------------------+