.. _delete-bucket-website:

delete-bucket-website
=====================

This operation removes the website configuration from the bucket.

See also: :ref:`DELETE Bucket Website`.

Synopsis
--------

::

  delete-bucket-website
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command deletes a website configuration from a bucket named
"my-bucket"::

  aws s3api delete-bucket-website --bucket my-bucket

Output
------

None
