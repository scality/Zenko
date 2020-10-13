.. _delete-bucket-replication:

delete-bucket-replication
=========================

Deletes the replication configuration from the bucket. For information about
replication configuration, see `Cross-Region Replication (CRR)
<https://docs.aws.amazon.com/AmazonS3/latest/dev/crr.html>`__ in the *Amazon S3
Developer Guide*.

See also: :ref:`DELETE Bucket Replication`.

Synopsis
--------

::

  delete-bucket-replication
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  The bucket name. 

  .. note::

    It can take a while to propagate the deletion of a replication configuration
    to all Zenko systems.

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command deletes a replication configuration from a bucket named
"my-bucket"::

  $ aws s3api delete-bucket-replication --bucket my-bucket

Output
------

None
