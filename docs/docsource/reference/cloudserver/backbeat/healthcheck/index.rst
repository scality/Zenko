Backbeat Healthcheck
====================

The Healthcheck feature uses one API route, :ref:`get_healthcheck`.
Healthchecks return details on the health of Kafka and its topics.

Specifically, Backbeat Healthcheck returns an object with two main keys: ``topics``
and ``internalConnections``.

The topics key returns details on the Kafka CRR topic only. The name field
returns the Kafka topic name, and the partitions field returns details of each
partition for the CRR topic. ``id`` is the partition ID, ``leader`` is the
current node responsible for all reads and writes for the given partition, the
replicas array is the list of nodes that replicate the log for the given
partition, and the isrs array is the list of in-sync replicas.

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

The internalConnections key returns general details on the health of the system
as a whole. The isrHealth contains whether the minimum in-sync replicas for
every partition has been met, the zookeeper field returns whether ZooKeeper is
running properly, and the kafkaProducer field returns the health of all Kafka
producers for every topic.

.. toctree::
   :maxdepth: 1
	      
   get_healthcheck
