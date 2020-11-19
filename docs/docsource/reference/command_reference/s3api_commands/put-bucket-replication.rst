.. _put-bucket-replication:

put-bucket-replication
======================

Creates a replication configuration or replaces an existing one. For more
information, see `Cross-Region Replication (CRR)
<https://docs.aws.amazon.com/AmazonS3/latest/dev/crr.html>`__ in the *Amazon S3
Developer Guide*.

See also: :ref:`PUT Bucket Replication`.

.. warning::

   Cross-region replication is not supported on buckets with object lock
   enabled.

Synopsis
--------

::

  put-bucket-replication
    --bucket <value>
    [--content-md5 <value>]
    --replication-configuration <value>
    [--token <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--content-md5`` (string)

  The base64-encoded 128-bit MD5 digest of the data. You must use this header as
  a message integrity check to verify that the request body was not corrupted in
  transit.

``--replication-configuration`` (structure)

JSON Syntax::

  {
    "Role": "string",
    "Rules": [
      {
        "ID": "string",
        "Priority": integer,
        "Prefix": "string",
        "Filter": {
          "Prefix": "string",
          "Tag": {
            "Key": "string",
            "Value": "string"
          },
          "And": {
            "Prefix": "string",
            "Tags": [
              {
                "Key": "string",
                "Value": "string"
              }
              ...
            ]
          }
        },
        "Status": "Enabled"|"Disabled",
        "SourceSelectionCriteria": {
          "SseKmsEncryptedObjects": {
            "Status": "Enabled"|"Disabled"
          }
        },
        "Destination": {
          "Bucket": "string",
          "Account": "string",
          "StorageClass": "STANDARD"
          "AccessControlTranslation": {
            "Owner": "Destination"
          },
          "EncryptionConfiguration": {
            "ReplicaKmsKeyID": "string"
          }
        },
        "DeleteMarkerReplication": {
          "Status": "Enabled"|"Disabled"
        }
      }
      ...
    ]
  }

``--token`` (string)

  A token that allows Amazon S3 object lock to be enabled for an existing
  bucket.

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

**To configure replication for an S3 bucket**

The following ``put-bucket-replication`` example applies a replication configuration to the specified S3 bucket. ::

    $ aws s3api put-bucket-replication \
        --bucket my-bucket \
        --replication-configuration file://replication.json

Contents of ``replication.json``::

    {
        "Role": "arn:aws:iam::123456789012:role/s3-replication-role",
        "Rules": [
            {
                "Status": "Enabled",
                "Priority": 1,
                "DeleteMarkerReplication": { "Status": "Disabled" },
                "Filter" : { "Prefix": ""},
                "Destination": {
                    "Bucket": "arn:aws:s3:::my-bucket-backup"
                }
            }
        ]
    }

The destination bucket must be in a different region and have versioning
enabled. The specified role must have permission to write to the destination
bucket and have a trust relationship that allows XDM   to assume the role.

Example role permission policy::

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "s3:*",
                "Resource": "*"
            }
        ]
    }

Example trust relationship policy::

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "s3.example.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }

Output
------

None
