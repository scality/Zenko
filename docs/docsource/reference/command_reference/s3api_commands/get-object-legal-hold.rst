.. _get-object-legal-hold:

get-object-legal-hold
=====================

Gets an object's current Legal Hold status.

See also: :ref:`GET Object Legal Hold`

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

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

  The bucket containing the object whose Legal Hold status you want to retrieve.

``--key`` (string)

  The key name for the object whose Legal Hold status you want to retrieve.

``--version-id`` (string)

  The version ID of the object whose Legal Hold status you want to retrieve.

  Possible values:
  
  *   ``requester``

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

LegalHold -> (structure)

  The current Legal Hold status for the specified object.

  Status -> (string)

    Indicates whether the specified object has a Legal Hold in place.
