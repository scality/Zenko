.. _put-object-retention:

put-object-retention
====================

Places an Object Retention configuration on an object.

See also: :ref:`PUT Object Retention`

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  put-object-retention
    --bucket <value>
    --key <value>
    [--retention <value>]
    [--version-id <value>]
    [--bypass-governance-retention | --no-bypass-governance-retention]
    [--content-md5 <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  The bucket that contains the object to which this object retention configuration shall be applied.

``--key`` (string)

  The key name for the object to which you will apply this object retention configuration.

``--retention`` (structure)

  The container element for the object retention configuration.

Shorthand Syntax::

    Mode=string,RetainUntilDate=timestamp

JSON Syntax::

  {
    "Mode": "GOVERNANCE"|"COMPLIANCE",
    "RetainUntilDate": timestamp
  }

``--version-id`` (string)

  The version ID for the object to which this object retention configuration
  shall be applied.

``--bypass-governance-retention`` | ``--no-bypass-governance-retention`` (Boolean)

  Indicates whether this operation must bypass governance-mode restrictions.

``--content-md5`` (string)

  The MD5 hash for the request body.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Output
------

None
