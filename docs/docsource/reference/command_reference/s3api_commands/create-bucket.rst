.. _create-bucket:

create-bucket
=============

Creates a new bucket.

See also: :ref:`PUT bucket`.

.. warning::

   Cross-region replication is not supported on buckets with object lock
   enabled.

Synopsis
--------

::

  create-bucket
    [--acl <value>]
    --bucket <value>
    [--create-bucket-configuration <value>]
    [--grant-full-control <value>]
    [--grant-read <value>]
    [--grant-read-acp <value>]
    [--grant-write <value>]
    [--grant-write-acp <value>]
    [--object-lock-enabled-for-bucket | --no-object-lock-enabled-for-bucket]
    [--cli-input-json <value>]

Options
-------

``--acl`` (string)

  The canned ACL to apply to the bucket.

  Possible values:
  
  *   ``private``
  *   ``public-read``
  *   ``public-read-write``
  *   ``authenticated-read``

``--bucket`` (string)

``--create-bucket-configuration`` (structure)

Shorthand Syntax::

    LocationConstraint=string

JSON Syntax::

  {
    "LocationConstraint": "EU"|"eu-west-1"|"us-west-1"|"us-west-2"|"ap-south-1"|"ap-southeast-1"|"ap-southeast-2"|"ap-northeast-1"|"sa-east-1"|"cn-north-1"|"eu-central-1"
  }

``--grant-full-control`` (string)

  Allows grantee the read, write, read ACP, and write ACP permissions on the bucket.

``--grant-read`` (string)

  Allows grantee to list the objects in the bucket.

``--grant-read-acp`` (string)

  Allows grantee to read the bucket ACL.

``--grant-write`` (string)

  Allows grantee to create, overwrite, and delete any object in the bucket.

``--grant-write-acp`` (string)

  Allows grantee to write the ACL for the applicable bucket.

``--object-lock-enabled-for-bucket`` | ``--no-object-lock-enabled-for-bucket`` (Boolean)

  Specifies whether to enable Amazon S3 object lock for the new bucket.

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command creates a bucket named "my-bucket"::

  $ aws s3api create-bucket --bucket my-bucket --region us-east-1

Output::

  {
      "Location": "/my-bucket"
  }

The following command creates a bucket named "my-bucket" in the
``eu-west-1`` region. Regions outside of ``us-east-1`` require the appropriate
``LocationConstraint`` to be specified in order to create the bucket in the
desired region::

    $ aws s3api create-bucket --bucket my-bucket --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1 

Output::

    {
        "Location": "http://my-bucket.s3.example.com/"
    }

Output
------

Location -> (string)
