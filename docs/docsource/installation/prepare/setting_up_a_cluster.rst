.. _Setting Up a Cluster:

Setting Up a Cluster
====================

While running Zenko on a single machine is desirable for certain use cases, a
clustered operating environment is required for high-availability deployments.
If you can set up a Kubernetes cluster on your own, review the :ref:`General
Cluster Requirements` and skip to :ref:`Install_Zenko`. Otherwise, download `the
latest stable version of MetalK8s
<https://github.com/scality/metalk8s/releases>`_ and follow its instructions to
establish a working Kubernetes instance on your cluster.

.. note: 

   Zenko 1.1 and later are not compatible with Kubernetes instances before
   version |min_kubernetes|. Scality recommends MetalK8s 2.4 or later, which
   satisfies this requirement.

Most of the complexity of installing Zenko on a cluster involves deploying the
cluster istelf. Scality supports MetalK8s_, an open source Kubernetes engine
optimized for the Zenko use case. The following section describes general
cluster requirements that have been tested on MetalK8s. Because MetalK8s is
designed to operate without support from public cloud resources, the following
sizing requirements are assumed sufficient for hosted cloud Kubernetes 
clusters, where such resources are available on demand.

.. _General Cluster Requirements:

General Cluster Requirements
----------------------------

Setting up a cluster requires at least three machines (these can be VMs) running
CentOS_ 7.4 or higher. The recommended mimimum for a high-availability Zenko
production service is the Standard Architecture, a five-node server with three
masters/etcds. The Compact Architecture, a three-node configuration, is also
supported. The cluster must have an odd number of nodes to provide a quorum. You
must have SSH access to these machines and they must have SSH access to each
other.

.. important::
   
   Three-server clusters can continue to operate without service disruption or
   data loss if one node fails. Five-server clusters can operate without
   disruption or loss if two nodes fail.

Each machine acting as a Kubernetes_ node must also have at least one disk
available to provision storage volumes.

Once you have set up a cluster, you cannot change the size of the machines on
it.

Service and Component Architecture
----------------------------------

Zenko consists of the following stateful and stateless services.

Stateful Services
~~~~~~~~~~~~~~~~~

For the following stateful services, each node has a copy of the data. Though
their terminology varies, each service employs the same strategy for maintaining
availability. A primary service acts on data and transfers it to replica
instances on the other nodes. If the service running as the primary fails
(either due to internal error or node failure), the remaining replica services
elect a primary to continue. If this occurs on a three-node cluster, no data is
lost unless two nodes fail. On a five-node cluster, no data is lost unless three
nodes fail.

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
  * Backbeat API

**Monitoring Services**

  * Prometheus
  * Grafana

**Out-of-Band Services**

  * Ingestion Consumer
  * Ingestion Producer
  * Cosmos Operator
  * Cosmos Scheduler

**Orbit Management Layer**

  * CloudServer Manager

.. _MetalK8s: https://github.com/scality/metalk8s/
.. _CentOS: https://www.centos.org
.. _Kubernetes: https://kubernetes.io
