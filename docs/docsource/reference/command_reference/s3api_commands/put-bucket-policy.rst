.. _put-bucket-policy:

put-bucket-policy
=================

Applies an S3 bucket policy to an S3 bucket.

See also: :ref:`PUT Bucket Policy`.

Synopsis
--------

::

  put-bucket-policy
    --bucket <value>
    [--content-md5 <value>]
    [--confirm-remove-self-bucket-access | --no-confirm-remove-self-bucket-access]
    --policy <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--content-md5`` (string)

``--confirm-remove-self-bucket-access`` |
``--no-confirm-remove-self-bucket-access`` (Boolean)

  Set this parameter to true to confirm that you want to remove your permissions
  to change this bucket policy in the future.

``--policy`` (string)

  The bucket policy as a JSON document.

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

This example allows all users to retrieve any object in *MyBucket* except those in the *MySecretFolder*. It also
grants ``put`` and ``delete`` permission to the root user of the AWS account ``1234-5678-9012``::

   aws s3api put-bucket-policy --bucket MyBucket --policy file://policy.json

   policy.json:
   {
      "Statement": [
         {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::MyBucket/*"
         },
         {
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::MyBucket/MySecretFolder/*"
         },
         {
            "Effect": "Allow",
            "Principal": {
               "AWS": "arn:aws:iam::123456789012:root"
            },
            "Action": [
               "s3:DeleteObject",
               "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::MyBucket/*"
         }
      ]
   }

Output
------

None
