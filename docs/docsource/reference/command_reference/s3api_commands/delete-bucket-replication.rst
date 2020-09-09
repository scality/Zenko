.. _delete-bucket-replication:

delete-bucket-replication
=========================

Deletes the replication configuration from the bucket. For information about
replication configuration, see `Cross-Region Replication (CRR)
<https://docs.aws.amazon.com/AmazonS3/latest/dev/crr.html>`__ in the *Amazon S3
Developer Guide*.

See also: :ref:`DELETE Bucket Replication`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

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
    to all S3 Connector systems.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command deletes a replication configuration from a bucket named
``my-bucket``::

  aws s3api delete-bucket-replication --bucket my-bucket

Output
------

None
