.. _delete-bucket:

delete-bucket
=============

Deletes the bucket. All objects (including all object versions and Delete
Markers) in the bucket must be deleted before the bucket itself can be deleted.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/DeleteBucket>`_.

Synopsis
--------

::

  delete-bucket
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command deletes a bucket named "my-bucket"::

  $ aws s3api delete-bucket --bucket my-bucket --region us-east-1

Output
------

None
