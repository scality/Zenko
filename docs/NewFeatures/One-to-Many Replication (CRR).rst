One-to-Many Replication (CRR)
=============================

One-to-many replication (also called “Cross-Region Replication” or
CRR) is a bucket-level configuration that enables automatic,
asynchronous copying of objects across buckets in different RINGs or
clouds.

Zenko enables workflows from on-premise to cloud, simplifying access to
data independent of location, and provides a policy-based management
framework for moving and replicating data. Using one-to-many replication
makes it possible to replicate data from on-premise data centers to
several cloud-based storage backends, or from one cloud to many.

One-to-many CRR employs a common abstraction, providing a single common
API for multiple (heterogeneous) cloud APIs. In other words, Zenko maps
the AWS bucket and object model onto the underlying cloud by mapping S3
API calls to native API calls for each cloud.
