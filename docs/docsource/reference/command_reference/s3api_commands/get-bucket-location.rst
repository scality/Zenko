.. _get-bucket-location:

get-bucket-location
===================

Returns the region the bucket resides in.

See also: :ref:`GET Bucket Location`.

Synopsis
--------

::

  get-bucket-location
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command retrieves the location constraint for a bucket named
"my-bucket", if a constraint exists::

  $ aws s3api get-bucket-location --bucket my-bucket

Output::

  {
      "LocationConstraint": "us-west-2"
  }

Output
------

LocationConstraint -> (string)
