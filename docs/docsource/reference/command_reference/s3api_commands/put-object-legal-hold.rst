.. _put-object-legal-hold:

put-object-legal-hold
=====================

Applies a legal hold configuration to the specified object.

See also: :ref:`PUT Object Legal Hold`

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

  .. include:: ../../../include/cli-input-json.txt

Output
------

None
