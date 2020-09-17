.. _delete-bucket-policy:

delete-bucket-policy
====================

Deletes the policy from the bucket.

See also: :ref:`DELETE Bucket Policy`.

Synopsis
--------

::

  delete-bucket-policy
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command deletes a bucket policy from a bucket named
"my-bucket"::

  $ aws s3api delete-bucket-policy --bucket my-bucket

Output
------

None
