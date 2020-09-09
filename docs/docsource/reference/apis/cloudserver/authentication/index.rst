Authenticating API Requests
===========================

Each request to the S3 Connector must be authenticated. Authentication is the process
of proving identity, an essential factor in S3 Connector access control decisions.
Requests are allowed or denied in part based on the identity of the
requester (for example, the right to create buckets is reserved for
approved developers and the right to create objects in a bucket is
reserved by default for the owner of the bucket in question).

.. toctree::
   :maxdepth: 2

   authentication_methods/index
   signature_calculation/index
