.. _PUT Bucket Policy:

PUT Bucket Policy
=================

This PUT operation uses the policy subresource to return a specified bucket's
policy. For any identity other than the root user of the account that owns the
bucket, the calling identity must have PutBucketPolicy permissions on the
specified bucket and belong to the bucket owner's account to use this operation.

In the absence of PutBucketPolicy permissions, S3 Connector returns a ``403
Access Denied`` error. If the permissions are correct, but you are not using
an identity that belongs to the bucket owner's account, S3 Connector returns a
``405 Method Not Allowed`` error.

.. important::

   The root user of the account that owns a bucket can always use this
   operation, even if the policy explicitly denies the root user the ability to
   perform this action.

For more information about bucket policies, see `Using Bucket Policies and User
Policies
<https://docs.aws.amazon.com/AmazonS3/latest/dev/using-iam-policies.html>`__ in
the *Amazon Simple Storage Service Developer Guide*.

Requests
--------

Syntax
~~~~~~

.. code:: 

   PUT /?policy HTTP/1.1
   Host: BucketName.s3.example.com
   Date: date
   Authorization: authorization string (see Authenticating Requests (AWS
   Signature Version 4))

   Policy written in JSON

Request Parameters
~~~~~~~~~~~~~~~~~~

This operation does not use request parameters.

Request Headers
~~~~~~~~~~~~~~~

This operation uses only request headers that are common to all operations.

Request Elements
~~~~~~~~~~~~~~~~

The body is a JSON string containing policy contents that contain policy
statements.

Responses
---------

Response Headers
~~~~~~~~~~~~~~~~

This operation uses only response headers that are common to most responses.

Response Elements
~~~~~~~~~~~~~~~~~

PUT response elements return whether the operation succeeded or not.

Special Errors
~~~~~~~~~~~~~~

This operation does not return special errors. 

Examples
--------

Sample Request
~~~~~~~~~~~~~~

The following request shows the PUT individual policy request for the bucket.

.. code::

   PUT /?policy HTTP/1.1
   Host: bucket.s3.example.com  
   Date: Fir, 27 Sep 2019 20:22:00 GMT  
   Authorization: authorization string

   {
   "Version":"2008-10-17",
   "Id":"aaaa-bbbb-cccc-dddd",
   "Statement" : [
       {
           "Effect":"Allow",
           "Sid":"1", 
           "Principal" : {
               "AWS":["111122223333","444455556666"]
           },
           "Action":["s3:*"],
           "Resource":"arn:aws:s3:::bucket/*"
       }
     ] 
   }

Sample Response
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 204 No Content  
   x-amz-id-2: Uuag1LuByR5Onimru9SAMPLEAtRPfTaOFg==  
   x-amz-request-id: 656c76696e6727732SAMPLE7374  
   Date: Fri, 27 Sep 2019 20:22:01 GMT  
   Connection: keep-alive  
   Server: S3Server
