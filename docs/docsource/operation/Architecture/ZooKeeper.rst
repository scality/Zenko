ZooKeeper
=========

ZooKeeper is an Apache service for maintaining configuration
information, naming, providing distributed synchronization, and
providing group services. Backbeat uses ZooKeeper as a configuration
engine, storing information generated and required by Kafka in a
Kafka-friendly Java-based context. Backbeat also uses ZooKeeper to store
and maintain some state information (oplogs).


