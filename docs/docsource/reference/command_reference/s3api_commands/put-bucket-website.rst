.. _put-bucket-website:

put-bucket-website
==================

Set the website configuration for a bucket.

See also: :ref:`PUT Bucket Website`.

Synopsis
--------

::

  put-bucket-website
    --bucket <value>
    [--content-md5 <value>]
    --website-configuration <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--content-md5`` (string)

``--website-configuration`` (structure)

JSON Syntax::

  {
    "ErrorDocument": {
      "Key": "string"
    },
    "IndexDocument": {
      "Suffix": "string"
    },
    "RedirectAllRequestsTo": {
      "HostName": "string",
      "Protocol": "http"|"https"
    },
    "RoutingRules": [
      {
        "Condition": {
          "HttpErrorCodeReturnedEquals": "string",
          "KeyPrefixEquals": "string"
        },
        "Redirect": {
          "HostName": "string",
          "HttpRedirectCode": "string",
          "Protocol": "http"|"https",
          "ReplaceKeyPrefixWith": "string",
          "ReplaceKeyWith": "string"
        }
      }
      ...
    ]
  }

``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The applies a static website configuration to a bucket named "my-bucket"::

  $ aws s3api put-bucket-website --bucket my-bucket --website-configuration file://website.json

The file ``website.json`` is a JSON document in the current folder that
specifies index and error pages for the website::

  {
      "IndexDocument": {
          "Suffix": "index.html"
      },
      "ErrorDocument": {
          "Key": "error.html"
      }
  }

Output
------

None
