.. _put-bucket-versioning:

put-bucket-versioning
=====================

Sets the versioning state of an existing bucket. To set the versioning state,
you must be the bucket owner.

See also: :ref:`PUT Bucket Versioning`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  put-bucket-versioning
    --bucket <value>
    [--content-md5 <value>]
    [--mfa <value>]
    --versioning-configuration <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--content-md5`` (string)

``--mfa`` (string)

  The concatenation of the authentication device's serial number, a space, and
  the value that is displayed on your authentication device.

``--versioning-configuration`` (structure)

Shorthand Syntax::

    MFADelete=string,Status=string

JSON Syntax::

  {
    "MFADelete": "Enabled"|"Disabled",
    "Status": "Enabled"|"Suspended"
  }

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

The following command enables versioning on a bucket named ``my-bucket``::

  aws s3api put-bucket-versioning --bucket my-bucket --versioning-configuration Status=Enabled

The following command enables versioning, and uses an mfa code ::

  aws s3api put-bucket-versioning --bucket my-bucket --versioning-configuration Status=Enabled --mfa "SERIAL 123456"

Output
------

None
