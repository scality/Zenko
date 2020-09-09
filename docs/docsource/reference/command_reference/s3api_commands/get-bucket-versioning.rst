.. _get-bucket-versioning:

get-bucket-versioning
=====================

Returns the versioning state of a bucket.

See also: :ref:`GET Bucket Versioning`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-bucket-versioning
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

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command retrieves the versioning configuration for a bucket named ``my-bucket``::

  aws s3api get-bucket-versioning --bucket my-bucket

Output::

  {
      "Status": "Enabled"
  }

Output
------

Status -> (string)

  The versioning state of the bucket.

MFADelete -> (string)

  Specifies whether MFA delete is enabled in the bucket versioning
  configuration. This element is only returned if the bucket has been configured
  with MFA delete. If the bucket has never been so configured, this element is
  not returned.
