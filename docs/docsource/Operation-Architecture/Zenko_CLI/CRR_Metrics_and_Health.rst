CRR Metrics and Healthcheck
===========================

If source and destination buckets are set up to allow replication, when
a new object is added to the source bucket, the request for replicating
that object begins processing.

Metrics are gathered when entries are published to Kafka. When a Kafka
entry has completed processing and an object has replicated to its
destination bucket, further metrics are gathered to record its
completion.

Routes
------

The internal routes presented in the following table are required for
testing the overall health of Backbeat and to measure the progress of an
ongoing replication.

All metric routes contain a {{location-name}} variable.

The site name must match the name specified in
env\_replication\_endpoints under the backbeat replication
configurations in env/client\_template/group\_vars/all.

If the site is for a different cloud backend (i.e. AWS, Azure), use that
backend’s defined type (aws\_s3 or azure, for example).

To show all metrics for all sites, set {{location-name}} to “all”.

.. tabularcolumns:: X{0.15\textwidth}X{0.40\textwidth}X{0.30\textwidth}
.. table::

   +-------------+---------------------------------+----------------------------------------------+
   | Type        | Description                     |  Example URL                                 |
   +=============+=================================+==============================================+
   | Healthcheck | This basic health check returns | \http://zenko.local/_/backbeat/              |
   |             | details on the health of Kafka  | api/healthcheck                              |
   |             | and its topics.                 |                                              |
   |             |                                 |                                              |
   |             | If there is no HTTP response    |                                              |
   |             | error, the structure of the     |                                              |
   |             | response is an array of three   |                                              |
   |             | key:value objects, detailed in  |                                              |
   |             | section 15.2.                   |                                              |
   +-------------+---------------------------------+----------------------------------------------+
   | All Metrics | Returns a collection of all     | \http://zenko.local/_/backbeat/              |
   |             | metrics listed below.           | api/metrics/crr/{{location-name}}            |                         
   +-------------+---------------------------------+----------------------------------------------+
   | Pending     | Returns pending replication     | \http://zenko.local/\_/backbeat/             |
   |             | in number of objects and number | api/metrics/crr/{{location-name}}/pending    |
   |             | of total bytes. The bytes total |                                              |
   |             | represents data only and does   |                                              |
   |             | not include the size of         |                                              |
   |             | metadata.                       |                                              |
   |             |                                 |                                              |
   |             | Pending replication represents  |                                              |
   |             | the objects that have been      |                                              |
   |             | queued up to be replicated to   |                                              |
   |             | another site, but the           |                                              |
   |             | replication task has not yet    |                                              |
   |             | been completed or failed for    |                                              |
   |             | that object.                    |                                              |
   +-------------+---------------------------------+----------------------------------------------+
   | Backlog     | Returns the replication backlog | \http://zenko.local/\_/backbeat/             |
   |             | in number of objects and number | api/metrics/crr/{{location-name}}/backlog    |
   |             | of total bytes. The bytes total |                                              |
   |             | represents data only and does   |                                              |
   |             | not include the size of         |                                              |
   |             | metadata.                       |                                              |
   |             |                                 |                                              |
   |             | Replication backlog represents  |                                              |
   |             | the objects that have been      |                                              |
   |             | queued up to be replicated to   |                                              |
   |             | another site, but the           |                                              |
   |             | replication task has not yet    |                                              |
   |             | been completed or failed for    |                                              |
   |             | that object.                    |                                              |
   +-------------+---------------------------------+----------------------------------------------+
   | Completions | Returns the replication         | \http://zenko.local/_/backbeat/              |
   |             | completions in number of objects| api/metrics/crr/{location-name}/completions  |
   |             | and number of total bytes       |                                              |
   |             | transferred. The bytes total    |                                              |
   |             | represents data only and        |                                              |
   |             | does not include the size of    |                                              |
   |             | metadata.                       |                                              |
   |             |                                 |                                              |
   |             | Completions are only collected  |                                              |
   |             | up to an \`EXPIRY\` time, which |                                              |
   |             | is set to a default of 24       |                                              |
   |             | hours.                          |                                              |
   +-------------+---------------------------------+----------------------------------------------+
   | Throughput  | Returns the current throughput  | \http://zenko.local/_/backbeat/              |
   |             | in number of operations per     | api/metrics/crr/{{location-name}}/throughput |
   |             | second (or number of objects    |                                              |
   |             | replicating per second) and     |                                              |
   |             | number of total bytes           |                                              |
   |             | completing per second.          |                                              |
   +-------------+---------------------------------+----------------------------------------------+

Replication Status
------------------

A special status, PROCESSING, supports cross-region replication with a
multiple-backend topology. Objects in CRR buckets transition from PENDING to
PROCESSING to COMPLETED or FAILED.

**ReplicationStatus**

-  PENDING: CRR to all backends is pending.
-  PROCESSING: At least one backend has completed and is waiting for
   other backend(s) to finish.
-  COMPLETED: All backends report a completed status.
-  FAILED: At least one backend failed.

Each backend’s replication status is reported as user metadata.

For example, if the site names configured in the replication endpoints
are aws-backend-1, aws-backend-2, azure-backend-1, and azure-backend-2,
user metadata on the head object may appear as:

::

    aws-backend-1-replication-status: COMPLETED
    aws-backend-2-replication-status: PENDING
    azure-backend-1-replication-status: COMPLETED
    azure-backend-2-replication-status: PENDING

This user metadata is in addition to the object’s replication status,
which follows the logic laid out in the bucket config file.

Health Check Details
--------------------

Backbeat health checks return an array of three key:value objects. The
keys are:

-  A number (a numeric key)
-  ``metadata``
-  ``internalConnections``

Each numeric key contains as its value an object containing nodeId, host, and
port key objects. The numeric keys represent each ZooKeeper node and its
details.

::

    zookeeperNode: {
        nodeId: <value>,
        host: <value>,
        port: <value>
    }

One of these key:value objects is key-named “metadata.” Its value is an object
containing key:value pairs where each key represents a ZooKeeper node, and each
value holds details on topic name, partition number, leader number, replicas,
and in-sync replicas (ISRs) per partition.

::

    metadata: {
        zookeeperNode: {
            topic: <value>,
            partition: <value>,
            leader: <value>
            replicas: <value>
            isr: <value>
        }
    }

The internalConnections object key nominates an object consisting of three keys:

-  ``isrHealth``, which carries a value of either ``ok`` or ``error``.
-  ``zookeeper``, which shows a status and status details (see
   https://github.com/alexguan/node-zookeeper-client#state for more
   detail).
-  ``kafkaProducer``, which carries a value of either ``ok`` or
   ``error``, and checks the health of all Producers for every topic.

::

    internalConnections: {
        isrHealth: <ok || error>,
        zookeeper: {
            status: <ok || error>,
            details: {
                name: <value>,
                code: <value>
            }
        },
        kafkaProducer: {
            Status: <ok || error>
        }
    }

Status Code Responses
---------------------

.. tabularcolumns:: X{0.10\textwidth}X{0.85\textwidth}
.. table::

   +----------+--------------------------------------------------------------------+
   | Response | Details                                                            |
   +==========+====================================================================+
   | 200      | OK: success                                                        |
   +----------+--------------------------------------------------------------------+
   | 403      | AccessDenied: request IP address does not have access              |
   +----------+--------------------------------------------------------------------+
   | 404      | RouteNotFound: invalid route given                                 |
   +----------+--------------------------------------------------------------------+
   | 405      | MethodNotAllowed: the HTTP verb must be a GET                      |
   +----------+--------------------------------------------------------------------+
   | 500      | InternalError: Can be caused by one of several internal components |
   |          | (i.e. the api server, Kafka, Zookeeper, or one of the Producers    |
   |          | for a topic)                                                       |
   +----------+--------------------------------------------------------------------+

Example Responses
-----------------

Healthcheck Request:

::

    [
      {
        "0":{
          "nodeId":0,
          "host":"server-node1",
          "port":9092
        },
        ...
        "4":{
          "nodeId":4,
          "host":"server-node5",
          "port":9092
        }
      },
      {
        "metadata": {
          "0":{
            "topic":"backbeat-replication",
            "partition":0,
            "leader":4,
            "replicas":[0,1,4],
            "isr":[1,4,0]
          },
          ...
          "4":{
            "topic":"backbeat-replication",
            "partition":4,
            "leader":3,
            "replicas":[0,3,4],
            "isr":[4,3,0]
          }
        }
      },
      {
        "internalConnections":{
          "isrHealth":"ok",
          "zookeeper":{
            "status":"ok",
            "details":{
              "name":"SYNC_CONNECTED",
              "code":3
            }
          },
        "kafkaProducer":{
          "status":"ok"
          }
        }
      }
    ]

Pending Request:

::

    "pending":{
      "description":"Number of pending replication operations (count) and bytes (size)",
      "results":{
        "count":0,
        "size":0
      }
    }

Backlog Request:

::

    "backlog":{
      "description":"Number of incomplete replication operations (count) and number of incomplete bytes transferred (size)",
      "results":{
        "count":0,
        "size":0
      }
    }

Completions Request:

::

    "completions":{
      "description":"Number of completed replication operations (count) and number of bytes transferred (size) in the last 86400 seconds",
      "results":{
        "count":0,
        "size":0
      }
    }

Throughput Request:

::

    "throughput":{
      "description":"Current throughput for replication operations in ops/sec (count) and bytes/sec (size) in the last 900 seconds",
      "results":{
        "count":"0.00",
        "size":"0.00"
      }
    }

.. _`CRR Pause and Resume`: CRR_Pause_&_Resume.html
