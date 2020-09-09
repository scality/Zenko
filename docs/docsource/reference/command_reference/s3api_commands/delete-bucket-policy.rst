.. _delete-bucket-policy:

delete-bucket-policy
====================

Deletes the policy from the bucket.

See also: :ref:`DELETE Bucket Policy`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

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

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command deletes a bucket policy from a bucket named ``my-bucket``::

  aws s3api delete-bucket-policy --bucket my-bucket

Output
------

None
