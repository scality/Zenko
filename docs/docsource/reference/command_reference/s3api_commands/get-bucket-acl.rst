.. _get-bucket-acl:

get-bucket-acl
==============

Gets the access control policy for the bucket.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/GetBucketAcl>`_.

Synopsis
--------

::

  get-bucket-acl
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following command retrieves the access control list for a bucket named "my-bucket"::

  $ aws s3api get-bucket-acl --bucket my-bucket

**Output**

::

  {
      "Owner": {
          "DisplayName": "my-username",
          "ID": "7009a8971cd538e11f6b6606438875e7c86c5b672f46db45460ddcd087d36c32"
      },
      "Grants": [
          {
              "Grantee": {
                  "DisplayName": "my-username",
                  "ID": "7009a8971cd538e11f6b6606438875e7c86c5b672f46db45460ddcd087d36c32"
              },
              "Permission": "FULL_CONTROL"
          }
      ]
  }

Output
------

Owner -> (structure)

  DisplayName -> (string)

  ID -> (string)

Grants -> (list)

  A list of grants.

  (structure)

    Grantee -> (structure)

      DisplayName -> (string)

        Screen name of the grantee.

      EmailAddress -> (string)

        Email address of the grantee.

      ID -> (string)

        The canonical user ID of the grantee.

      Type -> (string)

        Type of grantee

      URI -> (string)

        URI of the grantee group.

    Permission -> (string)

      Specifies the permission given to the grantee.
