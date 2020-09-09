.. _delete-objects:

delete-objects
==============

This operation enables you to delete multiple objects from a bucket using a
single HTTP request. You may specify up to 1,000 keys.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/DeleteObjects>`_.

Synopsis
--------

::

  delete-objects
    --bucket <value>
    --delete <value>
    [--mfa <value>]
    [--bypass-governance-retention | --no-bypass-governance-retention]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--delete`` (structure)

Shorthand Syntax::

    Objects=[{Key=string,VersionId=string},{Key=string,VersionId=string}],Quiet=boolean

JSON Syntax::

  {
    "Objects": [
      {
        "Key": "string",
        "VersionId": "string"
      }
      ...
    ],
    "Quiet": true|false
  }

``--mfa`` (string)

  The concatenation of the authentication device's serial number, a space, and
  the value that is displayed on your authentication device.

``--bypass-governance-retention`` | ``--no-bypass-governance-retention`` (boolean)

  Specifies whether you want to delete this object even if it has a
  Governance-type object lock in place. You must have sufficient permissions to
  perform this operation.

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

Examples
--------

The following command deletes an object from a bucket named ``my-bucket``::

  aws s3api delete-objects --bucket my-bucket --delete file://delete.json

``delete.json`` is a JSON document in the current directory that specifies the
object to delete::

  {
    "Objects": [
      {
        "Key": "test1.txt"
      }
    ],
    "Quiet": false
  }

Output::

  {
      "Deleted": [
          {
              "DeleteMarkerVersionId": "mYAT5Mc6F7aeUL8SS7FAAqUPO1koHwzU",
              "Key": "test1.txt",
              "DeleteMarker": true
          }
      ]
  }

Output
------

Deleted -> (list)

  (structure)

    Key -> (string)

    VersionId -> (string)

    DeleteMarker -> (boolean)

    DeleteMarkerVersionId -> (string)

Errors -> (list)

  (structure)

    Key -> (string)

    VersionId -> (string)

    Code -> (string)

    Message -> (string)
    
