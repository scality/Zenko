.. _POST Service:

POST Service
============

POST Service returns the metrics at the global service level, providing
a response with summary metrics representing the aggregate of all
accounts defined in the service, within the specified time range.

Requests
--------

Request Headers
~~~~~~~~~~~~~~~

.. code::

   POST /?Action=ListMetrics HTTPS/1.1
   Content-Type:application/json;charset=utf-8
   Host: https://<domain-name>.com:<port>
   Content-length:207
   Authorization: AWS4-HMAC-SHA256 Credential=AKIAJMJ7CRUHVGN5TZYQ/20160712/us-east-1/s3/aws4_request, SignedHeaders=content-length;content-type;host;something;version;
   x-amz-date,Signature=5d79624ca2823afd96b800202dd4d0fcf9a22cfaa57b745a6cfe0255b6974854

.. note::

   For S3C Releases prior to version 7.7.0.1, include ``&Version=2016-08-15`` in the POST
   declaration. For example:

   .. code:: 

      POST /users?Action=ListMetrics&Version=2016-08-15 HTTPS/1.1
   
Request Body
~~~~~~~~~~~~

.. code::

   {
     "timeRange": [startTime, endTime(optional - defaults to now)],
     "service": "s3"
   }

Responses
---------

Response Headers
~~~~~~~~~~~~~~~~

.. code::

   Server: ScalityS3
   x-scal-request-id:846e03194f2d54306268
   content-type:application/json;charset=utf-8

Response Body
~~~~~~~~~~~~~

.. code::

   {
     "serviceName": "s3",
     "timeRange": [startTime, endTime],
     "storageUtilized": [123456789, 124456789],
     "incomingBytes": 123456789,
     "outgoingBytes": 123456789,
     "numberOfObjects": [123456789, 124456789],
     "operations": {
       "s3:DeleteBucket": 12,
       "s3:GetBucketAcl": 40,
       "s3:ListBucket": 2000,
       "s3:CreateBucket": 20,
       "s3:PutBucketAcl": 10,
       "s3:PutObject": 200000,
       "s3:ListBucketMultipartUploads": 200,
       "s3:ListMultipartUploadParts": 300,
       "s3:AbortMultipartUpload": 10,
       "s3:DeleteObject": 2000,
       "s3:GetObject": 50000,
       "s3:GetObjectAcl": 10,
       "s3:GetObject": 20,
       "s3:PutObjectAcl": 10,
       "s3:ListAllMyBuckets": 2000,
       "s3:UploadPart": 300,
       "s3:InitiateMultipartUpload": 50,
       "s3:CompleteMultipartUpload": 50,
       "s3:HeadBucket": 200,
       "s3:HeadObject": 200
     }
   }
