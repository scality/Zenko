.. _put-bucket-website:

put-bucket-website
==================

Set the website configuration for a bucket.

See also: :ref:`PUT Bucket Website`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

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

  Performs service operation based on the JSON string provided. 
  If other arguments
  are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The applies a static website configuration to a bucket named ``my-bucket``::

  aws s3api put-bucket-website --bucket my-bucket --website-configuration file://website.json

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
