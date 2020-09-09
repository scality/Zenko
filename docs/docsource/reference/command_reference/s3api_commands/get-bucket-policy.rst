.. _get-bucket-policy:

get-bucket-policy
=================

Returns the policy of a specified bucket.

See also: :ref:`GET Bucket Policy`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

    get-bucket-policy
  --bucket <value>
  [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command retrieves the bucket policy for a bucket named ``my-bucket``::

  aws s3api get-bucket-policy --bucket my-bucket

Output::

  {
      "Policy": "{\"Version\":\"2008-10-17\",\"Statement\":[{\"Sid\":\"\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::my-bucket/*\"},{\"Sid\":\"\",\"Effect\":\"Deny\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::my-bucket/secret/*\"}]}"
  }

Get and Put a Bucket Policy
^^^^^^^^^^^^^^^^^^^^^^^^^^^

The following example shows how you can download an S3 bucket policy, make
modifications to the file, and then use ``put-bucket-policy`` to apply the
modified bucket policy.  To download the bucket policy to a file, you can run::

  aws s3api get-bucket-policy --bucket mybucket --query Policy --output text > policy.json

You can then modify the ``policy.json`` file as needed.  Finally you can apply
this modified policy back to the S3 bucket by running::

  aws s3api put-bucket-policy --bucket mybucket --policy file://policy.json


Output
------

Policy -> (string)

  The bucket policy as a JSON document.
