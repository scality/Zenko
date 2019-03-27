.. _Bucket Website Specification:

Bucket Website Specification
============================

Zenko implements the `AWS S3 Bucket Website APIs
<http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html>`__
per the AWS specifications. This makes the objects accessible through a
bucket website.

Website Redirect Rules Attached to Particular Objects
-----------------------------------------------------

When an object is put (either through a :ref:`Put Object` call, an 
:ref:`Initiate Multipart Upload` call, or a :ref:`Put Object - Copy` call), an
``x-amz-website-redirect-location`` header may be added to the call. If
such a header is provided, it will be saved with an object’s metadata
and will be retrieved on either a :ref:`Get Object` call or :ref:`Head Object`
call. Requests to the object at the bucket website endpoint will be redirected
to the location specified by the header.

The header is described by the `AWS protocol for putting
objects <http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html>`__.

Any applicable redirect rule in a bucket website configuration will
prevail over a rule sent with a ``x-amz-website-redirect-location``
header (the same behavior as AWS).

Using Bucket Websites
---------------------

To experience bucket website behavior, a user must make a request to a bucket
website endpoint rather than the usual REST endpoints. Refer to `Website 
Endpoints <https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html>`_
for the difference in response from a bucket endpoint versus the usual REST
endpoint.

To set up Zenko with website endpoints, in Federation env_s3 should have a
website_endpoints section that contains a list of all desired website
endpoints (e.g., s3-website.scality.example.com). Thus, if a user has a
bucket foo, a bucket website request to Zenko would be made to
foo.s3-website.scality.example.com.

.. note::

  To be served from the website endpoints, objects must be public, meaning
  that the ACL of such an object must be public-read. This ACL can be set
  when the object is originally put or through a :ref:`PUT Object
  ACL` call. The AWS instructions for setting up bucket websites suggest using a bucket
  policy to set all objects to public, but Zenko does not yet implement bucket
  policies so this option is not available.
