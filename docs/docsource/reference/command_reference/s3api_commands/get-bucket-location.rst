.. _get-bucket-location:

get-bucket-location
===================

Returns the region the bucket resides in.

See also: :ref:`GET Bucket Location`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

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

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command retrieves the location constraint for a bucket named
``my-bucket``, if a constraint exists::

  aws s3api get-bucket-location --bucket my-bucket

Output::

  {
      "LocationConstraint": "us-west-2"
  }

Output
------

LocationConstraint -> (string)
