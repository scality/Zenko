.. _list-object-versions:

list-object-versions
====================

Returns metadata about all of the versions of objects in a bucket.

See also: `AWS API Documentation
<https://docs.aws.amazon.com/goto/WebAPI/s3-2006-03-01/ListObjectVersions>`_.

``list-object-versions`` is a paginated operation. Multiple API calls may be
issued in order to retrieve the entire data set of results. You can disable
pagination by providing the ``--no-paginate`` argument. When using ``--output
text`` and the ``--query`` argument on a paginated response, the ``--query``
argument must extract data from the results of the following query expressions:
``Versions``, ``DeleteMarkers``, ``CommonPrefixes``.

Synopsis
--------

::

  list-object-versions
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

  A delimiter is a character you use to group keys.

``--encoding-type`` (string)

  Requests Zenko to encode the object keys in the response and specifies the
  encoding method to use. An object key may contain any Unicode character;
  however, XML 1.0 parser cannot parse some characters, such as characters with
  an ASCII value from 0 to 10. For characters that are not supported in XML 1.0,
  you can add this parameter to request that Zenko encode the keys in the
  response.

  Possible values:
  
  *   ``url``

``--prefix`` (string)

  Limits the response to keys that begin with the specified prefix.

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

The following command retrieves version information for an object in a bucket
named "my-bucket"::

  $ aws s3api list-object-versions --bucket my-bucket --prefix index.html

Output::

  {
      "DeleteMarkers": [
          {
              "Owner": {
                  "DisplayName": "my-username",
                  "ID": "7009a8971cd660687538875e7c86c5b672fe116bd438f46db45460ddcd036c32"
              },
              "IsLatest": true,
              "VersionId": "B2VsEK5saUNNHKcOAJj7hIE86RozToyq",
              "Key": "index.html",
              "LastModified": "2015-11-10T00:57:03.000Z"
          },
          {
              "Owner": {
                  "DisplayName": "my-username",
                  "ID": "7009a8971cd660687538875e7c86c5b672fe116bd438f46db45460ddcd036c32"
              },
              "IsLatest": false,
              "VersionId": ".FLQEZscLIcfxSq.jsFJ.szUkmng2Yw6",
              "Key": "index.html",
              "LastModified": "2015-11-09T23:32:20.000Z"
          }
      ],
      "Versions": [
          {
              "LastModified": "2015-11-10T00:20:11.000Z",
              "VersionId": "Rb_l2T8UHDkFEwCgJjhlgPOZC0qJ.vpD",
              "ETag": "\"0622528de826c0df5db1258a23b80be5\"",
              "StorageClass": "STANDARD",
              "Key": "index.html",
              "Owner": {
                  "DisplayName": "my-username",
                  "ID": "7009a8971cd660687538875e7c86c5b672fe116bd438f46db45460ddcd036c32"
              },
              "IsLatest": false,
              "Size": 38
          },
          {
              "LastModified": "2015-11-09T23:26:41.000Z",
              "VersionId": "rasWWGpgk9E4s0LyTJgusGeRQKLVIAFf",
              "ETag": "\"06225825b8028de826c0df5db1a23be5\"",
              "StorageClass": "STANDARD",
              "Key": "index.html",
              "Owner": {
                  "DisplayName": "my-username",
                  "ID": "7009a8971cd660687538875e7c86c5b672fe116bd438f46db45460ddcd036c32"
              },
              "IsLatest": false,
              "Size": 38
          },
          {
              "LastModified": "2015-11-09T22:50:50.000Z",
              "VersionId": "null",
              "ETag": "\"d1f45267a863c8392e07d24dd592f1b9\"",
              "StorageClass": "STANDARD",
              "Key": "index.html",
              "Owner": {
                  "DisplayName": "my-username",
                  "ID": "7009a8971cd660687538875e7c86c5b672fe116bd438f46db45460ddcd036c32"
              },
              "IsLatest": false,
              "Size": 533823
          }
      ]
  }

Output
------

IsTruncated -> (Boolean)

  A flag that indicates whether or not Zenko returned all of the results
  that satisfied the search criteria. If your results were truncated, you can
  make a follow-up paginated request using the NextKeyMarker and
  NextVersionIdMarker response parameters as a starting place in another request
  to return the rest of the results.

KeyMarker -> (string)

  Marks the last Key returned in a truncated response.

VersionIdMarker -> (string)

NextKeyMarker -> (string)

  Use this value for the key marker request parameter in a subsequent request.

NextVersionIdMarker -> (string)

  Use this value for the next version id marker parameter in a subsequent request.

Versions -> (list)

  (structure)

    ETag -> (string)

    Size -> (integer)

      Size in bytes of the object.

    StorageClass -> (string)

      The class of storage used to store the object.

    Key -> (string)

      The object key.

    VersionId -> (string)

      Version ID of an object.

    IsLatest -> (Boolean)

      Specifies whether the object is (true) or is not (false) the latest version of an object.

    LastModified -> (timestamp)

      Date and time the object was last modified.

    Owner -> (structure)

      DisplayName -> (string)
      
      ID -> (string)
      
DeleteMarkers -> (list)

  (structure)

    Owner -> (structure)

      DisplayName -> (string)

      ID -> (string)

    Key -> (string)

      The object key.

    VersionId -> (string)

      Version ID of an object.

    IsLatest -> (Boolean)

      Specifies whether the object is (true) or is not (false) the latest version of an object.

    LastModified -> (timestamp)

      Date and time the object was last modified.
      
Name -> (string)

Prefix -> (string)

Delimiter -> (string)

MaxKeys -> (integer)

CommonPrefixes -> (list)

  (structure)

    Prefix -> (string)

EncodingType -> (string)

  Encoding type used by Zenko to encode object keys in the response.
