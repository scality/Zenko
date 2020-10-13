.. _list-buckets:

list-buckets
============

Returns a list of all buckets owned by the authenticated sender of the request.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/ListBuckets>`_.

Synopsis
--------

::

  list-buckets
    [--cli-input-json <value>]

Options
-------

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command uses the ``list-buckets`` command to display the names of
all your S3 buckets (across all regions)::

  $ aws s3api list-buckets --query "Buckets[].Name"

The query option filters the output of ``list-buckets`` down to only the bucket
names.

For more information about buckets, see `Working with Amazon S3 Buckets`_ in the
*Amazon S3 Developer Guide*.

.. _`Working with Amazon S3 Buckets`: http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html

Output
------

Buckets -> (list)

  (structure)

    Name -> (string)

      The name of the bucket.

    CreationDate -> (timestamp)

      Date the bucket was created.

Owner -> (structure)

  DisplayName -> (string)

  ID -> (string)
