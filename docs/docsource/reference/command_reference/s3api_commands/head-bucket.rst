.. _head-bucket:

head-bucket
===========

This operation is useful to determine if a bucket exists and you have permission
to access it.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/HeadBucket>`_.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

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

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Examples
--------

The following command verifies access to a bucket named ``my-bucket``::

  aws s3api head-bucket --bucket my-bucket

If the bucket exists and you have access to it, no output is
returned. Otherwise, an error message will be shown. For example::

  A client error (404) occurred when calling the HeadBucket operation: Not Found

Output
------

None
