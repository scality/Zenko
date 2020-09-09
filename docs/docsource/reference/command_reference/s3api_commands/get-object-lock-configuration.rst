.. _get-object-lock-configuration:

get-object-lock-configuration
=============================

Gets the object lock configuration for a bucket. The rule specified in the
object lock configuration will be applied by default to every new object placed
in the specified bucket.

See also: :ref:`GET Object Lock Configuration`

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_ for descriptions of global parameters.

Synopsis
--------

::

  get-object-lock-configuration
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  The bucket whose object lock configuration you want to retrieve.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Output
------

ObjectLockConfiguration -> (structure)

  The specified bucket's object lock configuration.

  ObjectLockEnabled -> (string)

    Indicates whether this bucket has an object lock configuration enabled.

  Rule -> (structure)

    The object lock rule in place for the specified object.

    DefaultRetention -> (structure)

      The default retention period that you want to apply to new objects placed in the specified bucket.

      Mode -> (string)

        The default object lock retention mode you want to apply to new objects placed in the specified bucket.

      Days -> (integer)

        The number of days that you want to specify for the default retention period.

      Years -> (integer)

        The number of years that you want to specify for the default retention period.
