.. _put-object-legal-hold:

put-object-legal-hold
=====================

Applies a legal hold configuration to the specified object.

See also: :ref:`PUT Object Legal Hold`

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  put-object-legal-hold
    --bucket <value>
    --key <value>
    [--legal-hold <value>]
    [--version-id <value>]
    [--content-md5 <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  The bucket containing the object on which you want to put a legal hold.

``--key`` (string)

  The key name for the object on which you want to put a legal hold.

``--legal-hold`` (structure)

  Container element for the legal hold configuration to apply to the specified
  object.

Shorthand Syntax::

    Status=string

JSON Syntax::

  {
    "Status": "ON"|"OFF"
  }

``--version-id`` (string)

  The version ID of the object to put a legal hold on.

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
