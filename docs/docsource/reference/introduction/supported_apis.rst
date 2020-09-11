Supported APIs
==============

Supported APIs for Zenko are detailed here.

Scality extended APIs, including the Utilization API (UTAPI), a REST API for
reporting on utilization metrics (capacity, objects, bandwidth, and operations
per unit time) are also provided here.


S3 API Endpoints
----------------

.. _S3 API:

.. tabularcolumns:: X{0.50\textwidth}X{0.30\textwidth}X{0.15\textwidth}
.. table::
   :widths: auto

   +---------------------------------------+----------------+------------+
   | Operation Name                        | Operation Type | Available? |
   +=======================================+================+============+
   | :ref:`DELETE Bucket`                  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Versioning`          | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Location`            | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket (List Objects)`      | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket (List Objects) v.2`  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Object Versions`     | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Head Bucket`                    | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket`                     | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Versioning`          | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket ACL`                 | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket ACL`                 | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`List Multipart Uploads`         | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Website`             | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Website`             | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket Website`          | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket CORS`                | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket CORS`                | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket CORS`             | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | DELETE Bucket Lifecycle               | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket Replication`      | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Bucket Policy`           | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | DELETE Bucket Tagging                 | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Lifecycle                  | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Replication`         | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Bucket Policy`              | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Lock Configuration`  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | GET Object Lock Configuration         | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Logging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Notification               | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket Tagging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | GET Bucket RequestPayment             | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Lifecycle                  | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Replication`         | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Bucket Policy`              | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object Lock Configuration`  | Bucket         | yes        |
   +---------------------------------------+----------------+------------+
   | PUT Object Lock Configuration         | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Logging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Notification               | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket Tagging                    | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | PUT Bucket RequestPayment             | Bucket         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Object`                  | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`DELETE Object Tagging`          | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Multi-Object Delete`            | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object`                     | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Legal Hold`          | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Retention`           | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object Tagging`             | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`GET Object ACL`                 | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`HEAD Object`                    | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Copy Object`                    | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | GET Object Torrent                    | Object         | no         |
   +---------------------------------------+----------------+------------+
   | OPTIONS Object                        | Object         | no         |
   +---------------------------------------+----------------+------------+
   | POST Object                           | Object         | no         |
   +---------------------------------------+----------------+------------+
   | POST Object Restore                   | Object         | no         |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object`                     | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object Legal Hold`          | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object Retention`           | Object         | yes        |
   +---------------------------------------+----------------+------------+   
   | :ref:`PUT Object Tagging`             | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object ACL`                 | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`PUT Object - Copy`              | Object         | yes        |
   +---------------------------------------+----------------+------------+
   | :ref:`Initiate Multipart Upload`      | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Upload Part`                    | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Upload Part - copy`             | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Complete Multipart Upload`      | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`Abort Multipart Upload`         | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | :ref:`List Parts`                     | Multipart      | yes        |
   |                                       | Upload         |            |
   +---------------------------------------+----------------+------------+
   | **Special Notes**                                                   |
   +---------------------------------------+----------------+------------+
   | Transfer-stream-encoding for          |                | yes        |
   | object PUT with v4 AUTH               |                |            |
   +---------------------------------------+----------------+------------+


Utilization API (UTAPI)
-----------------------

Scality's UTilization API (UTAPI) is a RESTful API is accessed using POST
requests via a JSON-based protocol. Input parameters are provided as a JSON body
(at the service level) or a JSON array of entities (for example an array of
buckets, accounts, or users) on which to query, plus a time range. The RESTful
API through which UTAPI is accessed is securely authenticated via HTTPS on a
dedicated web server and port.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-------------------------------------+-----------+------------+
   | Utilization Metric                  | Operation | Available? |
   +=====================================+===========+============+
   | :ref:`Account Level<Post Accounts>` | Post      | yes        |
   +-------------------------------------+-----------+------------+
   | :ref:`Bucket Level<Post Buckets>`   | Post      | yes        |
   +-------------------------------------+-----------+------------+
   | :ref:`User Level<Post Users>`       | Post      | yes        |
   +-------------------------------------+-----------+------------+
   | :ref:`Service Level<Post Service>`  | Post      | yes        |
   +-------------------------------------+-----------+------------+

