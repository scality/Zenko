.. _head-bucket:

head-bucket
===========

This operation is useful for determining if a bucket exists and you have
permission to access it.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/HeadBucket>`_.

Synopsis
--------

::

  head-bucket
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command verifies access to a bucket named "my-bucket"::

  aws s3api head-bucket --bucket my-bucket

If the bucket exists and you have access to it, no output is returned.
Otherwise, an error message is shown. For example::

  A client error (404) occurred when calling the HeadBucket operation: Not Found

Output
------

None
