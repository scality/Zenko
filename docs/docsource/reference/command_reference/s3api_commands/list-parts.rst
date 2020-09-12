.. _list-parts:

list-parts
==========

Lists the parts that have been uploaded for a specific multipart upload.

See also: :ref:`List Parts`.

``list-parts`` is a paginated operation. Multiple API calls may be issued in
order to retrieve the entire data set of results. You can disable pagination by
providing the ``--no-paginate`` argument. When using ``--output text`` and the
``--query`` argument on a paginated response, the ``--query`` argument must
extract data from the results of the following query expressions: ``Parts``.

Synopsis
--------

::

  list-parts
    --bucket <value>
    --key <value>
    --upload-id <value>
    [--cli-input-json <value>]
    [--starting-token <value>]
    [--page-size <value>]
    [--max-items <value>]

Options
-------

``--bucket`` (string)

``--key`` (string)

``--upload-id`` (string)

  Upload ID identifying the multipart upload whose parts are being listed.

  Possible values:
  
  *   ``requester``

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

The following command lists all of the parts that have been uploaded for a
multipart upload with key ``multipart/01`` in the bucket ``my-bucket``::

  aws s3api list-parts --bucket my-bucket --key 'multipart/01' --upload-id dfRtDYU0WWCCcH43C3WFbkRONycyCpTJJvxu2i5GYkZljF.Yxwh6XG7WfS2vC4to6HiV6Yjlx.cph0gtNBtJ8P3URCSbB7rjxI5iEwVDmgaXZOGgkk5nVTW16HOQ5l0R

Output::

  {
      "Owner": {
          "DisplayName": "aws-account-name",
          "ID": "100719349fc3b6dcd7c820a124bf7aecd408092c3d7b51b38494939801fc248b"
      },
      "Initiator": {
          "DisplayName": "username",
          "ID": "arn:aws:iam::0123456789012:user/username"
      },
      "Parts": [
          {
              "LastModified": "2015-06-02T18:07:35.000Z",
              "PartNumber": 1,
              "ETag": "\"e868e0f4719e394144ef36531ee6824c\"",
              "Size": 5242880
          },
          {
              "LastModified": "2015-06-02T18:07:42.000Z",
              "PartNumber": 2,
              "ETag": "\"6bb2b12753d66fe86da4998aa33fffb0\"",
              "Size": 5242880
          },
          {
              "LastModified": "2015-06-02T18:07:47.000Z",
              "PartNumber": 3,
              "ETag": "\"d0a0112e841abec9c9ec83406f0159c8\"",
              "Size": 5242880
          }
      ],
      "StorageClass": "STANDARD"
  }

Output
------

AbortDate -> (timestamp)
  
  Date when multipart upload will become eligible for abort operation by lifecycle.
  
AbortRuleId -> (string)
  
  Id of the lifecycle rule that makes a multipart upload eligible for abort operation.
  
Bucket -> (string)
  
  Name of the bucket to which the multipart upload was initiated.
  
Key -> (string)
  
  Object key for which the multipart upload was initiated.
  
UploadId -> (string)
  
  Upload ID identifying the multipart upload whose parts are being listed.
  
PartNumberMarker -> (integer)
  
  Part number after which listing begins.
  
NextPartNumberMarker -> (integer)
  
  When a list is truncated, this element specifies the last part in the list, as well as the value to use for the part-number-marker request parameter in a subsequent request.
  
MaxParts -> (integer)
  
  Maximum number of parts that were allowed in the response.
  
IsTruncated -> (Boolean)
  
  Indicates whether the returned list of parts is truncated.
  
Parts -> (list)
  
  (structure)
    
    PartNumber -> (integer)
      
      Part number identifying the part. This is a positive integer between 1 and 10,000.
      
    LastModified -> (timestamp)
      
      Date and time at which the part was uploaded.
      
    ETag -> (string)
      
      Entity tag returned when the part was uploaded.
      
    Size -> (integer)
      
      Size in bytes of the uploaded part data.
  
Initiator -> (structure)
  
  Identifies who initiated the multipart upload.
  
  ID -> (string)
    
    If the principal is an AWS account, it provides the Canonical User ID. If the principal is an IAM User, it provides a user ARN value.
    
  DisplayName -> (string)
    
    Name of the Principal.
  
Owner -> (structure)
  
  DisplayName -> (string)
    
  ID -> (string)
  
StorageClass -> (string)
  
  The class of storage used to store the object.
