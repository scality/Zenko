.. _get-bucket-versioning:

get-bucket-versioning
=====================

Returns the versioning state of a bucket.

See also: :ref:`GET Bucket Versioning`.

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

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command retrieves the versioning configuration for a bucket named
"my-bucket"::

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
