.. _get-object-lock-configuration:

get-object-lock-configuration
=============================

Gets the object lock configuration for a bucket. The rule specified in the
object lock configuration is applied by default to every new object placed
in the specified bucket.

See also: :ref:`GET Object Lock Configuration`

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

  .. include:: ../../../include/cli-input-json.txt

Output
------

ObjectLockConfiguration -> (structure)

  The specified bucket's object lock configuration.

  ObjectLockEnabled -> (string)

    Indicates whether this bucket has an object lock configuration enabled.

  Rule -> (structure)

    The object lock rule in place for the specified object.

    DefaultRetention -> (structure)

      The default retention period to apply to new objects placed in the
      specified bucket.

      Mode -> (string)

        The default object lock retention mode to apply to new objects placed in
        the specified bucket.

      Days -> (integer)

        Specifies the number of days for the default retention period.

      Years -> (integer)

        Specifies the number of years for the default retention period.
