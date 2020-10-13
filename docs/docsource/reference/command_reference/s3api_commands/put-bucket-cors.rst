.. _put-bucket-cors:

put-bucket-cors
===============

Sets the CORS configuration for a bucket.

See also: :ref:`PUT Bucket CORS`.

Synopsis
--------

::

  put-bucket-cors
    --bucket <value>
    --cors-configuration <value>
    [--content-md5 <value>]
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cors-configuration`` (structure)

  JSON Syntax::
    
    {
      "CORSRules": [
        {
          "AllowedHeaders": ["string", ...],
          "AllowedMethods": ["string", ...],
          "AllowedOrigins": ["string", ...],
          "ExposeHeaders": ["string", ...],
          "MaxAgeSeconds": integer
        }
        ...
      ]
    }

``--content-md5`` (string)
  
``--cli-input-json`` (string)

  .. include:: ../../../include/cli-input-json.txt

Examples
--------

The following example enables ``PUT``, ``POST``, and ``DELETE`` requests from
*www.example.com*, and enables ``GET`` requests from any domain::

   $ aws s3api put-bucket-cors --bucket MyBucket --cors-configuration file://cors.json

   cors.json:
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["http://www.example.com"],
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["PUT", "POST", "DELETE"],
         "MaxAgeSeconds": 3000,
         "ExposeHeaders": ["x-amz-server-side-encryption"]
       },
       {
         "AllowedOrigins": ["*"],
         "AllowedHeaders": ["Authorization"],
         "AllowedMethods": ["GET"],
         "MaxAgeSeconds": 3000
       }
     ]
   }

Output
------

None
