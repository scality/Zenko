.. _get-object-tagging:

get-object-tagging
==================

Returns an object's tag set.

See also: :ref:`GET Object Tagging`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-object-tagging
    --bucket <value>
    --key <value>
    [--version-id <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--key`` (string)

``--version-id`` (string)

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Output
------

VersionId -> (string)

TagSet -> (list)

  (structure)

    Key -> (string)

      Name of the tag.

    Value -> (string)

      Value of the tag.
