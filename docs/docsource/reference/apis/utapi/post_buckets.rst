.. _POST Buckets:

POST Buckets
============

The POST Buckets operation returns metrics at the bucket level. Input
must contain at least one bucket name, or optionally, an array of
multiple bucket names, and a start time for the time range. It returns
metrics for a maximum of 100 buckets per call.

Requests
--------

Request Headers
~~~~~~~~~~~~~~~

.. code::

   POST /buckets?Action=ListMetrics HTTPS/1.1
   Content-Type:application/json;charset=utf8
   Host: https://sua.<domainname>.com
   Content-length:207
   Authorization: AWS4HMACSHA256
   Credential=AKIAJMJ7CRUHVGN5TZYQ/20160712/useast1/s3/aws4_request,
   SignedHeaders=contentlength;contenttype;host;something;version;
   xamzdate,Signature=5d79624ca2823afd96b800202dd4d0fcf9a22cfaa57b745a6cfe0255b697485

.. note::

   For S3C Releases prior to version 7.7.0.1, include ``&Version=2016-08-15`` in the POST
   declaration. For example:

   .. code:: 

      POST /users?Action=ListMetrics&Version=2016-08-15 HTTPS/1.1
   
Request Body
~~~~~~~~~~~~

.. code::

   {
     buckets:[<bucket_name>, <bucket_name>...],
     timeRange: [startTime, endTime(optional - defaults to now)]
   }

Responses
---------

Response Headers
~~~~~~~~~~~~~~~~

.. code::

   Server: ScalityS3
   xscalrequestid:846e03194f2d54306268
   content-type:application/json;charset=utf8

Response Body
~~~~~~~~~~~~~

.. code::

   [
     {
     "bucketName": <bucket_name>,
     "timeRange": [startTime, endTime],
     "storageUtilized": [123456789, 124456789],
     "incomingBytes": 123456789,
     "outgoingBytes": 123456789,
     "numberOfObjects": [123456789, 124456789],
     "operations": {
       "s3:DeleteBucket": 12,
       "s3:ListBucket": 3000 ,
       "s3:GetBucketAcl": 40,
       "s3:CreateBucket": 20,
       "s3:PutBucketAcl": 10,
       "s3:PutObject": 200000,
       "s3:UploadPart": 300
       "s3:ListBucketMultipartUploads": 200,
       "s3:ListMultipartUploadParts": 300,
       "s3:InitiateMultipartUpload": 50
       "s3:CompleteMultipartUpload": 50
       "s3:AbortMultipartUpload": 10,
       "s3:DeleteObject": 2000,
       "s3:GetObject": 50000,
       "s3:GetObjectAcl": 10,
       "s3:PutObjectAcl": 10,
       "s3:HeadBucket": 200
       "s3:HeadObject": 200
       }
     },
   ...
   ]
