.. _DELETE Bucket Policy:

DELETE Bucket Policy
====================

This DELETE operation uses the policy subresource to delete a specified bucket's
policy. For any identity other than the root user of the account that owns the
bucket, the identity must have the DeleteBucketPolicy permissions on the
specified bucket and belong to the bucket owner's account to use this operation.

In the absence of DeleteBucketPolicy permissions, S3 Connector returns a ``403
Access Denied`` error. If the permissions are correct, but you are not using an
identity that belongs to the bucket owner's account, S3 Connector returns a
``405 Method Not Allowed`` error.

.. important::

   The root user of the AWS account that owns a bucket can always use this
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

   DELETE /?policy HTTP/1.1
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

The response elements contain the status of the DELETE operation including
the error code if the request failed.

Special Errors
~~~~~~~~~~~~~~

This operation does not return special errors.

Examples
--------

Sample Request
~~~~~~~~~~~~~~

This request deletes the bucket named "BucketName".

.. code::

   DELETE /?policy HTTP/1.1
   Host: BucketName.s3.example.com  
   Date: Fri, 27 Sep 2019 20:22:00 GMT  
   Authorization: signatureValue 

Sample Response
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 204 No Content 
   x-amz-id-2: Uuag1LuByRx9e6j5OnimrSAMPLEtRPfTaOFg==  
   x-amz-request-id: 656c76696e672SAMPLE5657374  
   Date: Fri, 27 Sep 2019 20:22:01 GMT  
   Connection: keep-alive  
   Server: S3Connector

