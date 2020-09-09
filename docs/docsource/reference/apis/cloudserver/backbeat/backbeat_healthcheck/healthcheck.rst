Healthcheck
===========

Basic healthchecks return details on the health of Kafka and its topics.

If there is no HTTP response error, the structure of the response is an
array of three key:value objects.

-  One key:value object has a numeric key, with a value consisting of a
   three-key object containing ``nodeId``, ``host``, and ``port``. Each
   numeric key represents a ZooKeeper node and that node’s details.

   .. code::

      zookeeperNode: {
          nodeId: <value>,
          host: <value>,
          port: <value>
      }

-  One key:value object has a key named ``metadata``. Its value is an
   object containing ZooKeeper node keys, and each of these keys is
   associated with a value containing details on topic name, partition
   number, leader number, replica count, and in-sync replicas per
   partition.

   .. code::

      metadata: {
          zookeeperNode: {
              topic: <value>,
              partition: <value>,
              leader: <value>
          }
      }

-  One key:value object has a key named ``internalConnections``. Its
   value is an object with three keys:

   -  ``isrHealth``, either ``ok`` or ``error``
   -  ``zookeeper``, which contains a status and status details (more
      about ZooKeeper status codes at
      https://github.com/alexguan/node-zookeeper-client#state)
   -  ``kafkaProducer``, containing either ``ok`` or ``error`` and
      checks the health of all Producers for every topic.

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

Example Output
--------------

.. code::

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

