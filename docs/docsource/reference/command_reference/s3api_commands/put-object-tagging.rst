.. _put-object-tagging:

put-object-tagging
==================

Sets the supplied tag-set to an object that already exists in a bucket

See also: :ref:`PUT Object Tagging`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  put-object-tagging
    --bucket <value>
    --key <value>
    [--version-id <value>]
    [--content-md5 <value>]
    --tagging <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--key`` (string)

``--version-id`` (string)

``--content-md5`` (string)

``--tagging`` (structure)

Shorthand Syntax::

    TagSet=[{Key=string,Value=string},{Key=string,Value=string}]

JSON Syntax::

  {
    "TagSet": [
      {
        "Key": "string",
        "Value": "string"
      }
      ...
    ]
  }

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Output
------

VersionId -> (string)
