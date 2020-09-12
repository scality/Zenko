.. _put-object-tagging:

put-object-tagging
==================

Sets the supplied tag-set to an object that already exists in a bucket

See also: :ref:`PUT Object Tagging`.

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

  .. include:: ../../../include/cli-input-json.txt

Output
------

VersionId -> (string)
