.. _get-object-retention:

get-object-retention
====================

Retrieves an object's retention settings.

See also: :ref:`GET Object Retention`

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-object-retention
    --bucket <value>
    --key <value>
    [--version-id <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  The bucket containing the object whose retention settings you want to retrieve.

``--key`` (string)

  The key name for the object whose retention settings you want to retrieve.

``--version-id`` (string)

  The version ID for the object whose retention settings you want to retrieve.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. The JSON string
  follows the format provided by ``--generate-cli-skeleton``. If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Output
------

Retention -> (structure)

  The container element for an object's retention settings.

  Mode -> (string)

    Indicates the Retention mode for the specified object.

  RetainUntilDate -> (timestamp)

    The date on which this object lock retention expires.
