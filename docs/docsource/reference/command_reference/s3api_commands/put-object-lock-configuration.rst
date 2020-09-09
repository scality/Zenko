.. _put-object-lock-configuration:

put-object-lock-configuration
=============================

Places an object lock configuration on the specified bucket. The rule specified
in the object lock configuration will be applied by default to every new object
placed in the specified bucket.

See also: :ref:`PUT Object Lock Configuration`

.. warning::

   Cross-region replication is not supported on buckets with object lock
   enabled.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  put-object-lock-configuration
    --bucket <value>
    [--object-lock-configuration <value>]
    [--token <value>]
    [--content-md5 <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  The bucket whose object lock configuration you want to create or replace.

``--object-lock-configuration`` (structure)

  The object lock configuration to apply to the specified bucket.

Shorthand Syntax::

    ObjectLockEnabled=string,Rule={DefaultRetention={Mode=string,Days=integer,Years=integer}}

JSON Syntax::

  {
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "GOVERNANCE"|"COMPLIANCE",
        "Days": integer,
        "Years": integer
      }
    }
  }

``--token`` (string)

  A token to enabling object lock for an existing S3 bucket.

``--content-md5`` (string)

  The MD5 hash for the request body.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Output
------

None
