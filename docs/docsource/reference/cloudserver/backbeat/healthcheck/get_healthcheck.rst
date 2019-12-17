.. _get_healthcheck:

GET Healthcheck
===============

Healthcheck return details on the health of Kafka and its topics.

Request
-------

.. code::

   GET /_/backbeat/api/healthcheck

Responses
---------

If the response is not an HTTP error, it is structured as an object with
two main keys: *topics* and *internalConnections*.

The topics key returns details on the Kafka CRR topic only. The name field
returns the Kafka topic name, and the partitions field returns details of each
partition for the CRR topic. ``id`` carries the partition ID, ``leader``
contains the current node responsible for all reads and writes for the given
partition, the ``replicas`` array is the list of nodes that replicate the log for
the given partition, and the ``isrs`` array is the list of in-sync replicas.

.. code::

  topics: {
    <topicName>: {
      name: <string>,
      partitions: {
        id: <number>,
        leader: <number>,
        replicas: [<number>, ...],
        isrs: [<number>, ...],
      },
      ...
    },
  }

The ``internalConnections`` key returns general details on the health of the
system as a whole. It contains an object of three keys:

-  ``isrHealth``, which carries a value of either ``ok`` or ``error``.
-  ``zookeeper``, which shows a status and status details (see
   https://github.com/alexguan/node-zookeeper-client#state for more
   detail).
-  ``kafkaProducer``, which carries a value of either ``ok`` or
   ``error``, and reports the health of all producers for every topic.

``isrHealth`` reports whether the minimum in-sync replicas count for every partition
is met. The zookeeper field indicates whether ZooKeeper is running properly. 
The kafkaProducer field reports the health of all Kafka producers for every
topic.

The zookeeper:details field provides a status name and status code provided
directly from the `node-zookeeper
<https://github.com/alexguan/node-zookeeper-client#state>`__), library.

.. code::

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
      status: <ok || error>
    }
  }

Example
~~~~~~~

.. note::

   The following example is redacted for brevity.

.. code::

  {
    "topics": {
      "backbeat-replication": {
        "name": "backbeat-replication",
        "partitions": [
          {
            "id": 2,
            "leader": 4,
            "replicas": [2,3,4],
            "isrs": [4,2,3]
          },
          ...
          {
            "id": 0,
            "leader": 2,
            "replicas": [0,1,2],
            "isrs": [2,0,1]
          }
        ]
      }
    },
    "internalConnections": {
      "isrHealth": "ok",
      "zookeeper": {
        "status": "ok",
        "details": {
          "name": "SYNC_CONNECTED",
          "code": 3
        }
      },
      "kafkaProducer": {
        "status": "ok"
      }
    }
  }
