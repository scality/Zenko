.. _list-multipart-uploads:

list-multipart-uploads
======================

This operation lists multipart uploads in progress.

See also: :ref:`List Multipart Uploads`.

``list-multipart-uploads`` is a paginated operation. Multiple API calls may be
issued to retrieve the entire data set of results. You can disable pagination by
providing the ``--no-paginate`` argument.  When using ``--output text`` and the
``--query`` argument on a paginated response, the ``--query`` argument must
extract data from the results of the following query expressions: ``Uploads``,
``CommonPrefixes``

Synopsis
--------

::

  list-multipart-uploads
    --bucket <value>
    [--delimiter <value>]
    [--encoding-type <value>]
    [--prefix <value>]
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]
    [--max-items <value>]

Options
-------

``--bucket`` (string)

``--delimiter`` (string)

  Character (delimiter) you use to group keys.

``--encoding-type`` (string)

  Requests |product| to encode the object keys in the response and specifies the
  encoding method to use. An object key may contain any Unicode character;
  however, the XML 1.0 parser cannot parse some characters, such as characters
  with an ASCII value from 0 to 10. For characters not supported in XML 1.0, you
  can add this parameter to request that |product| encode the keys in the response.

  Possible values:
  
  *   ``url``

``--prefix`` (string)

  Lists in-progress uploads only for those keys that begin with the specified
  prefix.

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

``--starting-token`` (string)

  A token to specify where to start paginating. This is the ``NextToken`` from a
  previously truncated response.

  |aws_cli_guide|

``--page-size`` (integer)

  The size of each page to get in the AWS service call. This does not affect the
  number of items returned in the command's output. Setting a smaller page size
  results in more calls to the AWS service, retrieving fewer items in each
  call. This can help prevent the AWS service calls from timing out.

  |aws_cli_guide|

``--max-items`` (integer)

  The total number of items to return in the command's output. If the total
  number of items available is more than the value specified, a ``NextToken`` is
  provided in the command's output. To resume pagination, provide the
  ``NextToken`` value in the ``starting-token`` argument of a subsequent
  command. **Do not** use the ``NextToken`` response element directly outside of
  the AWS CLI.

  |aws_cli_guide|

Examples
--------

The following command lists all of the active multipart uploads for a bucket
named "my-bucket"::

  $ aws s3api list-multipart-uploads --bucket my-bucket

Output::

  {
      "Uploads": [
          {
              "Initiator": {
                  "DisplayName": "username",
                  "ID": "arn:aws:iam::0123456789012:user/username"
              },
              "Initiated": "2015-06-02T18:01:30.000Z",
              "UploadId": "dfRtDYU0WWCCcH43C3WFbkRONycyCpTJJvxu2i5GYkZljF.Yxwh6XG7WfS2vC4to6HiV6Yjlx.cph0gtNBtJ8P3URCSbB7rjxI5iEwVDmgaXZOGgkk5nVTW16HOQ5l0R",
              "StorageClass": "STANDARD",
              "Key": "multipart/01",
              "Owner": {
                  "DisplayName": "aws-account-name",
                  "ID": "100719349fc3b6dcd7c820a124bf7aecd408092c3d7b51b38494939801fc248b"
              }
          }
      ],
      "CommonPrefixes": []
  }

In-progress multipart uploads can incur storage costs in public cloud
services. Complete or abort an active multipart upload to remove its parts from
your account.

Output
------

Bucket -> (string)

  Name of the bucket to which the multipart upload was initiated.

KeyMarker -> (string)

  The key at or after which the listing began.

UploadIdMarker -> (string)

  Upload ID after which listing began.

NextKeyMarker -> (string)

  When a list is truncated, this element specifies the value that should be used
  for the key-marker request parameter in a subsequent request.

Prefix -> (string)

  When a prefix is provided in the request, this field contains the specified
  prefix. The result contains only keys starting with the specified prefix.

Delimiter -> (string)

NextUploadIdMarker -> (string)

  When a list is truncated, this element specifies the value that should be used
  for the upload-id-marker request parameter in a subsequent request.
  
MaxUploads -> (integer)

  Maximum number of multipart uploads that could have been included in the response.

IsTruncated -> (Boolean)

  Indicates whether the returned list of multipart uploads is truncated. A value
  of true indicates that the list was truncated. The list can be truncated if
  the number of multipart uploads exceeds the limit allowed or specified by max
  uploads.

Uploads -> (list)

  (structure)

    UploadId -> (string)
    
      Upload ID that identifies the multipart upload.

    Key -> (string)

      Key of the object for which the multipart upload was initiated.

    Initiated -> (timestamp)

      Date and time at which the multipart upload was initiated.

    StorageClass -> (string)

      The class of storage used to store the object.

    Owner -> (structure)

      DisplayName -> (string)

      ID -> (string)

    Initiator -> (structure)

      Identifies who initiated the multipart upload.

      ID -> (string)

        If the principal is an AWS account, it provides the Canonical
        User ID. If the principal is an IAM User, it provides a user ARN value.

      DisplayName -> (string)

        Name of the Principal.

CommonPrefixes -> (list)

  (structure)

    Prefix -> (string)

EncodingType -> (string)

  Encoding type used by |product| to encode object keys in the response.
