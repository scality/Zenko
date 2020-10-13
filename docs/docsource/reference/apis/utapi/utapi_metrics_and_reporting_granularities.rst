UTAPI Metrics and Reporting Granularities
=========================================

Zenko can track and report the following utilization metrics through a RESTful
API:

-  Storage capacity in bytes
-  Number of objects
-  Network utilization per unit time

   -  Bytes transferred ingoing
   -  Bytes transferred outgoing

-  Number of operations per unit time

   -  PUT operations
   -  GET/LIST operations
   -  DELETE operations
   -  HEAD operations
   -  MPU operations

UTAPI tracks all of these metrics and makes them available for reporting
at the bucket level.

This service is deployed and accessed through a RESTful API that is
securely authenticated via HTTPS, on a dedicated web server and port.
The service is integrated with the Zenko IAM policies for access control
through the ``utapi:ListMetrics`` policy action.

To enable access, an IAM policy must first be created that grants
permission for the action, after which the policy must be set to the Zenko IAM
Users or IAM Groups that are permitted to access the service metrics.

.. note::

  For efficiency, a global maximum of 100 entities are enforced per call
  for the bucket entities.

Federation currently starts the Utapi server at S3 port + 100 on the S3
container.

.. code::

   env_s3_port | default(8000)) + 100
