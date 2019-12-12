.. _managing bucket policies:

Managing Bucket Policies
========================

In addition to controlling user or process access using access control lists
(ACLs) and cross-origin resource sharing (CORS), bucket owners can control
access at the resource level using bucket policies. Using bucket policies, a
bucket's owner can set policies that apply to the bucket, to all objects in a
bucket, or to specific objects in a bucket. Bucket policies provide added
granularity to permission management.

Bucket policies are passed to Zenko using the PUT Bucket Policy API call, which
puts a JSON request body to CloudServer. Once the policy is written to the
managed bucket, it can be read with a GET Bucket Policy request or deleted with
a DELETE Bucket Policy request.

Access to bucket polices is via the S3 API. You can pass these commands using
the AWS CLI tool, S3cmd, or direct http(s) requests to the REST endpoints.

.. note::

   Bucket policy features are not supported for Azure Blob Storage points of
   origin (Azure Blob frontend servers) in Zenko version |version|.
