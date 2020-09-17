.. _get-object-tagging:

get-object-tagging
==================

Returns an object's tag set.

See also: :ref:`GET Object Tagging`.

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

  .. include:: ../../../include/cli-input-json.txt

Output
------

VersionId -> (string)

TagSet -> (list)

  (structure)

    Key -> (string)

      Name of the tag.

    Value -> (string)

      Value of the tag.
