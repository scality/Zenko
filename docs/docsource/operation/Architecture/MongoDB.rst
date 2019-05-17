MongoDB
=======

MongoDB is a semi-structured open-source NoSQL database system, built on
JavaScript Object Notation (JSON). Zenko uses it for several tasks;
primary among these is its role of maintaining a freestanding,
independent namespace and location mapping of all files held in object
storage. Additionally, Zenko uses MongoDB to retain and order metadata
associated with the objects stored in these namespaces. As a
semi-structured metadata database, MongoDB also offers SQL-like metadata
search capacities that can cover tremendous amounts of data at great
speed.

As deployed in Zenko, MongoDB also ingests status, log information, and
metrics from Prometheus.

MongoDB is essential to the following Zenko features:

-  Data replication
-  Metadata search
-  Health check
-  Metrics collection
-  Queue population


