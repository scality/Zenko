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
production service is five server nodes with three masters/etcds, but three-node
configurations are also supported. The cluster must have an odd number of nodes to provide a
quorum. You must have SSH access to these machines and they must have SSH access
to each other.

.. important::
   
   Three-server clusters can continue to operate without service disruption or
   data loss if one node fails. Five-server clusters can operate without
   disruption or loss if two nodes fail.

Each machine acting as a Kubernetes_ node must also have at least one disk
available to provision storage volumes.

Once you have set up a cluster, you cannot change the size of the machines on
it.

.. _MetalK8s: https://github.com/scality/metalk8s/
.. _CentOS: https://www.centos.org
.. _Kubernetes: https://kubernetes.io
