.. _POST Users:

POST Users
==========

The POST Users operation returns the statistics at the User level. Input
must contain at least user name (or an optional array of user names) and
a startTime for the time range. This API returns metrics for a maximum
of 100 users per call.

Requests
--------

Request Headers
~~~~~~~~~~~~~~~

.. code::

   POST /users?Action=ListMetrics HTTPS/1.1
   Content-Type:application/json;charset=utf-8
   Host: https://sua.<domain-name>.com
   Content-length:207
   Authorization: AWS4-HMAC-SHA256 Credential=AKIAJMJ7CRUHVGN5TZYQ/20160712/us-east-1/s3/aws4_request, SignedHeaders=content-length;content-type;host;something;version;
   x-amz-date,Signature=5d79624ca2823afd96b800202dd4d0fcf9a22cfaa57b745a6cfe0255b697485


.. note::

   For S3C Releases prior to version 7.7.0.1, include ``&Version=2016-08-15`` in the POST
   declaration. For example:

   .. code:: 

      POST /users?Action=ListMetrics&Version=2016-08-15 HTTPS/1.1

      
Request Body
~~~~~~~~~~~~

.. code::

   {
     "accountId": <account_id>,
     "users":[<user_name>, <user_name>...],
     "timeRange": [startTime, endTime(optional - defaults to now)]
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

   [
     {
     "userName": <user_name>,
     "timeRange": [startTime, endTime],
     "storageUtilized": [123456789, 124456789],
     "incomingBytes": 123456789,
     "outgoingBytes": 123456789,
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
     },
   ...
   ]
