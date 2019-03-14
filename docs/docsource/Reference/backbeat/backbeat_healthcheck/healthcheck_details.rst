Healthcheck Details
===================

Backbeat health-checks returns an object with two main keys: topics and
internalConnections.

The topics key returns details on the Kafka CRR topic only. The name
field returns the Kafka topic name, and the partitions field returns
details of each partition for the CRR topic. The id is the partition id,
the leader is the current node responsible for all reads and writes for
the given partition, the replicas array is the list of nodes that
replicate the log for the given partition, and the isrs array is the
list of in-sync replicas.

.. code::

   topics: {
       <topicName>: {
           name: <value>,
           partitions: [
               {
                   id: <value>,
                   leader: <value>,
                   replicas: [<value>, ...],
                   isrs: [<value>, ...]
               },
               ...
           ]
       }
   }

The internalConnections key returns general details on the health of the
system as a whole. The isrHealth checks if the minimum in-sync replicas
for every partition is met, the zookeeper field checks if ZooKeeper is
running properly, and the kafkaProducer field checks the health of all
Kafka Producers for every topic.
