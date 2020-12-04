.. _Service Utilization API:

Service Utilization API
=======================

Scality's |product| provides a Service Utilization API (UTAPI) for resource
utilization tracking and metrics reporting.

UTAPI includes information on RING storage capacity, the number of bytes
transferred in and out of the service, and the number of operations
performed on the service. It extends the basic AWS S3 REST API, enabling
a comprehensive, on-premises resource utilization tracking solution, as
required by service providers for external billing or internal
charge-back reporting capabilities. AWS provides these reporting
capabilities through peripheral services such as AWS CloudWatch
monitoring and the AWS dashboard, but not currently through the AWS S3
protocol.

UTAPI is deployed and accessed through a RESTful API that is securely
authenticated via HTTPS, on a dedicated web server and port. The service
is integrated with the |product| IAM policies for access control through the
``utapi:ListMetrics`` policy action.

To enable access, an IAM policy must first be created that grants
permission for this action, after which the policy must be assigned to
the IAM Users or IAM Groups that are permitted to access the service
metrics.

For efficiency, a global maximum of 100 entities per call is enforced
for the Bucket entities.

Federation currently starts the UTAPI server at S3 port + 100 on the S3
container.

.. code::

   env_s3_port | default(8000)) + 100

.. note::

  Use AWS Signature Version 4 to authenticate UTAPI requests.

UTAPI Error Codes
-----------------

The following error codes may be returned by the Service Utilization API
(UTAPI):

.. tabularcolumns:: lLc
.. table::
   :widths: auto

   +-----------------------------+-----------------------+------------------+
   | Error Code                  | Description           | HTTP Status Code |
   +=============================+=======================+==================+
   | AccessDenied                | The requester does    | 403              |
   |                             | not have access to    |                  |
   |                             | the resource or       |                  |
   |                             | action.               |                  |
   +-----------------------------+-----------------------+------------------+
   | IncompleteSignature         | The request signature | 403              |
   |                             | does not conform to   |                  |
   |                             | AWS V4 standards.     |                  |
   +-----------------------------+-----------------------+------------------+
   | InternalError               | The request           | 500              |
   |                             | processing has failed |                  |
   |                             | because of an unknown |                  |
   |                             | error, exception or   |                  |
   |                             | failure.              |                  |
   +-----------------------------+-----------------------+------------------+
   | InvalidAction               | The action or         | 400              |
   |                             | operation requested   |                  |
   |                             | is invalid. Verify    |                  |
   |                             | that the action is    |                  |
   |                             | typed correctly.      |                  |
   +-----------------------------+-----------------------+------------------+
   | InvalidAccessKeyId          | The AWS access key ID | 403              |
   |                             | provided does not     |                  |
   |                             | exist in our records. |                  |
   +-----------------------------+-----------------------+------------------+
   | InvalidParameterCombination | An invalid or         | 400              |
   |                             | outofrange value was  |                  |
   |                             | supplied for the      |                  |
   |                             | input parameter.      |                  |
   +-----------------------------+-----------------------+------------------+
   | InvalidParameterValue       | The start time or end | 400              |
   |                             | time value is invalid.|                  |
   |                             | Start time cannot be  |                  |
   |                             | greater than end time.|                  |
   +-----------------------------+-----------------------+------------------+
   | InvalidQueryParameter       | The query string is   | 400              |
   |                             | malformed.            |                  |
   +-----------------------------+-----------------------+------------------+
   | MalformedQueryString        | The query string      | 404              |
   |                             | contains a syntax     |                  |
   |                             | error.                |                  |
   +-----------------------------+-----------------------+------------------+
   | MissingAction               | The request is        | 400              |
   |                             | missing an action or  |                  |
   |                             | a required parameter. |                  |
   +-----------------------------+-----------------------+------------------+
   | MissingAuthenticationToken  | The request must      | 403              |
   |                             | contain a valid       |                  |
   |                             | (registered) access   |                  |
   |                             | key ID.               |                  |
   +-----------------------------+-----------------------+------------------+
   | MissingParameter            | A required parameter  | 400              |
   |                             | for the specified     |                  |
   |                             | action is not         |                  |
   |                             | supplied.             |                  |
   +-----------------------------+-----------------------+------------------+
   | RequestExpired              | The request reached   | 400              |
   |                             | the service more than |                  |
   |                             | 15 minutes after the  |                  |
   |                             | date stamp on the     |                  |
   |                             | request or more than  |                  |
   |                             | 15 minutes after the  |                  |
   |                             | request expiration    |                  |
   |                             | date (such as for     |                  |
   |                             | presigned URLs), or   |                  |
   |                             | the date stamp on the |                  |
   |                             | request is more than  |                  |
   |                             | 15 minutes in the     |                  |
   |                             | future.               |                  |
   +-----------------------------+-----------------------+------------------+
   | ValidationError             | The input fails to    | 400              |
   |                             | satisfy the           |                  |
   |                             | constraints specified |                  |
   |                             | by the UTAPI service. |                  |
   +-----------------------------+-----------------------+------------------+

.. toctree::
   :maxdepth: 1

   utapi_metrics_and_reporting_granularities
   post_accounts
   post_buckets
   post_users
   post_service

