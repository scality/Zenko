.. _get-object-legal-hold:

get-object-legal-hold
=====================

Gets an object's current legal hold status.

See also: :ref:`GET Object Legal Hold`

Synopsis
--------

::

  get-object-legal-hold
    --bucket <value>
    --key <value>
    [--version-id <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

  The bucket containing the object whose legal hold status you want to retrieve.

``--key`` (string)

  The key name for the object whose legal hold status you want to retrieve.

``--version-id`` (string)

  The version ID of the object whose legal hold status you want to retrieve.

  Possible values:
  
  *   ``requester``

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Output
------

LegalHold -> (structure)

  The current legal hold status for the specified object.

  Status -> (string)

    Indicates whether the specified object has a legal hold in place.
