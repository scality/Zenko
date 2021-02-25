Architecture
============

This section describes |product|'s system architecture and its software components.

Basics
------

|product| provides a layer that mediates between a user or configured
storage frontend and one or several storage backends.

.. ifconfig:: product in ('Zenko')
	      
   .. image:: ../Graphics/Zenko_hi-level.*
      :align: center

.. ifconfig:: product in ('XDM')
	      
   .. image:: ../Graphics/XDM_hi-level.*
      :align: center

|product| may use a transient source, which enables it to write once to a
master (local) storage cloud, then replicate the stored data to other
clouds without incurring egress fees from the primary storage cloud.

|product| uses agile application frameworks such as Kubernetes for
orchestration and Prometheus for monitoring. |product| is deployed using
Kubernetes either on-premises or remotely, or using a cloud Kubernetes
framework (such as GKE, AKS, EKS, or Kops). Scality supports MetalK8s
as the reference Kubernetes implementation for |product| installations.

|product| Services Stack
------------------------

The following diagram summarizes the |product| cloud architecture:


.. ifconfig:: product in ('Zenko')
	      
   .. image:: ../Graphics/Zenko_arch_NoNFS.*
      :align: center

.. ifconfig:: product in ('XDM')
	      
   .. image:: ../Graphics/XDM_arch_NoNFS.*
      :align: center
 
The |product| instance depicted above presents an idealized representation
of |product|’s structure. Several complexities are elided for clarity.

Transient source replication is optional and configurable. Transient
source storage requires an on-premises RING deployment (with sproxyd).

The central square in this diagram represents the suite of
interdependent services required to implement a working |product| instance.
Deployed, this suite of services is highly available, containerized, and
under the control of Kubernetes. Kubernetes dynamically creates and
destroys services in response to demand.

The following table offers brief descriptions of the |product| components in
this architecture:

.. tabularcolumns:: X{0.20\textwidth}X{0.65\textwidth}
.. table::

   +--------------------+---------------------------------------------------------+
   | Component          | Description                                             |
   +====================+=========================================================+
   | CloudServer        | CloudServer is an open-source Node.js implementation of |
   |                    | a server handling the Amazon S3 protocol. It presents   |
   |                    | the core logic for translating user inputs and data     |
   |                    | into object storage on several cloud storage systems.   |
   |                    | With this component, users can create locations         |
   |                    | corresponding to different clouds.                      |
   +--------------------+---------------------------------------------------------+
   | Blobserver         | Blobserver is an open-source Node.js implementation of  |
   |                    | a server handling Microsoft's Azure Blob Storage        |
   |                    | protocol. It is functionally analogous to CloudServer   |
   |                    | in that it provides logic to translate user inputs and  |
   |                    | data into Azure Blob-compatible object storage. This    |
   |                    | feature remains under development.                      |
   +--------------------+---------------------------------------------------------+
   | Backbeat           | Backbeat manages the queues involved in |product| cloud |
   |                    | event tracing (such as admin\_API, etc.) and job        |
   |                    | queuing for current actions (such as CRR, lifecycle     |
   |                    | management, synchronous encryption, etc).               |
   +--------------------+---------------------------------------------------------+
   | |product| UI       | The |product| UI offers users controls for location,    |
   |                    | bucket, and object management in the RINGX context.     |
   +--------------------+---------------------------------------------------------+
   | CLI                | CloudServer accepts commands from command-line          |
   |                    | interfaces.                                             |
   +--------------------+---------------------------------------------------------+
   | MongoDB            | An open-source metadata database, MongoDB works with    |
   |                    | one or multiple instances in scale-out mode. It also    |
   |                    | explodes JSON values, allowing powerful searches and    |
   |                    | potentially indexing to speed up searches.              |
   +--------------------+---------------------------------------------------------+
   | Local RING/sproxyd | For local cloud storage (including transient source),   |
   |                    | S3 data can be put to an sproxyd RING.                  |
   +--------------------+---------------------------------------------------------+


Service and Component Architecture
----------------------------------

|product| consists of the following stateful and stateless services.

Stateful Services
~~~~~~~~~~~~~~~~~

For the following stateful services, each node has a copy of its object
data. Though their terminology varies, each service employs the same strategy
for maintaining availability. A primary service acts on data and transfers it to
replica instances on the other nodes. If the service running as the primary
fails (either due to internal error or node failure), the remaining replica
services elect a primary to continue. If this occurs on a three-node cluster, no
data is lost unless two nodes fail. On a five-node cluster, no data is lost
unless three nodes fail.

If a replica node fails, the primary continues operation without interruption
or an election.

The following stateful services conform to this failover strategy:

  * MongoDB
  * Redis
  * Kafka
  * ZooKeeper

Stateless Services
~~~~~~~~~~~~~~~~~~

The following stateless services are based on a transactional model. If a
service fails, Kubernetes automatically reschedules the process on an available
node.

**Lifecycle Services**

  * Lifecycle Bucket Processor
  * Lifecycle Conductor
  * Lifecycle Object Processor
  * Garbage Collection (GC) Consumer

**Replication Services**

  * Replication Data Processor
  * Replication Populator
  * Replication Status Processor

**APIs**

  * CloudServer API

**Monitoring Services**

  * Prometheus
  * Grafana

**Out-of-Band Services**

  * Ingestion Consumer
  * Ingestion Producer
  * Cosmos Operator
  * Cosmos Scheduler

**|product| UI Management Layer**

  * CloudServer Manager


|product| Cluster Topology
--------------------------

To operate with high availability, |product| must operate on a cluster of at least
three physical or virtual servers running Kubernetes |min_kubernetes| or
later. Run in such a cluster configuration, |product| is highly available: load
balancing, failover, and service management are handled dynamically in real time
by Kubernetes. This dramatically improves several aspects of service management,
creating a fast, robust, self-healing, flexible, scalable system. From the
user’s perspective, |product| is functionally a single instance that obscures the
services and servers behind it.

.. ifconfig:: product in ('Zenko')
	      
   .. image:: ../Graphics/Zenko_cluster_NoNFS.*
      :align: center

.. ifconfig:: product in ('XDM')
	      
   .. image:: ../Graphics/XDM_cluster_NoNFS.*
      :align: center

A basic test configuration—a cluster of three servers—is depicted 
above. Five servers is the recommended minimum service deployment for
high availability. In actual practice, each server can dynamically
deploy up to ten CloudServer instances, making for a default maximum of 
50 CloudServer instances, plus one master. Kubernetes sets the current
upper boundary, defined by the number of pods (including service
pods) that can be run, at 100 pods. The |product| instance that manages all
these CloudServers spans all deployed and functioning servers, managing
a common namespace of data and associated metadata, with Kubernetes
managing individual servers, spinning services up and down in response
to emergent conditions.

These services and their likely use cases are described in the sections
that follow.

.. toctree::

   Software_Components
