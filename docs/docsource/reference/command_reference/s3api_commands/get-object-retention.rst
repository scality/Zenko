.. _get-object-retention:

get-object-retention
====================

Retrieves an object's retention settings.

See also: :ref:`GET Object Retention`

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

  .. include:: ../../../include/cli-input-json.txt
  
Output
------

Retention -> (structure)

  The container element for an object's retention settings.

  Mode -> (string)

    Indicates the retention mode for the specified object; for example,
    ``GOVERNANCE`` or ``COMPLIANCE``.

  RetainUntilDate -> (timestamp)

    The date this object lock retention expires.
