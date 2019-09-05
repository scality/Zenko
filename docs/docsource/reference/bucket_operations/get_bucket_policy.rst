.. _GET Bucket Policy:

GET Bucket Policy
=================

This GET operation uses the policy subresource to return a specified bucket's
policy. For any identity other than the root user of the account that owns the
bucket, the identity must have GetBucketPolicy permissions on the specified
bucket and belong to the bucket owner's account to use this operation.

In the absence of GetBucketPolicy permissions, S3 Connector returns a ``403
Access Denied`` error. If the permissions are correct, but you are not using an
identity that belongs to the bucket owner's account, S3 Connector returns a
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

::

   GET /?policy HTTP/1.1
   Host: BucketName.s3.example.com
   Date: date
   Authorization: authorization string (see Authenticating Requests (AWS
   Signature Version 4))

Request Parameters
~~~~~~~~~~~~~~~~~~

This operation does not use request parameters.

Request Headers
~~~~~~~~~~~~~~~

This operation uses only request headers that are common
to all operations. 

Request Elements
~~~~~~~~~~~~~~~~

This operation does not use request elements.

Responses
---------

Response Headers
~~~~~~~~~~~~~~~~

This operation uses only response headers that are common to most responses.

Response Elements
~~~~~~~~~~~~~~~~~

The response contains the (JSON) policy of the specified bucket.

Special Errors
~~~~~~~~~~~~~~

This operation does not return special errors. 

Examples
--------

Sample Request
~~~~~~~~~~~~~~

The following request returns the policy of the specified bucket.

.. code:: 

   GET ?policy HTTP/1.1
   Host: bucket.s3.yourservice.com
   Date: Fri, 27 Sep 2019 20:22:00 GMT
   Authorization: authorization string

Sample Response
~~~~~~~~~~~~~~~

.. code:: 

   HTTP/1.1 200 OK  
   x-amz-id-2: Uuag1LuByru9pO4SAMPLEAtRPfTaOFg==  
   x-amz-request-id: 656c76696e67SAMPLE57374  
   Date: Fri, 27 Sep 2019 20:22:01 GMT  
   Connection: keep-alive  
   Server: S3Server    


   {
   "Version":"2008-10-17",
   "Id":"aaaa-bbbb-cccc-dddd",
   "Statement" : [
          {
           "Effect":"Deny",
           "Sid":"1", 
           "Principal" : {
               "AWS":["111122223333","444455556666"]
           },
           "Action":["s3:*"],
           "Resource":"arn:aws:s3:::bucket/*"
         }
      ] 
   }
