.. _Setting Up a Cluster:

Setting Up a Cluster
====================

While running Zenko on a single machine is desirable for certain use cases,
a clustered operating environment is required for high-availability deployments.
If you can set up a Kubernetes cluster on your own, review the :ref:`General
Cluster Requirements` and skip to :ref:`Install_Zenko`. Otherwise, download
MetalK8s and follow its instructions (or review the requirements and
instructions in Zenko/docs/gke.md) to establish a working Kubernetes instance
on your cluster.

.. note: 
   
   Zenko 1.1 will not install with a Kubernetes instance older than version
   1.11.3. Scality recommends MetalK8s 1.1, which installs Kubernetes v. 1.11.3.

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

Setting up a cluster requires at least three machines (these can be VMs)
running CentOS_ 7.4 or higher (The recommended mimimum for a high-availability
Zenko production service is five server nodes with three masters/etcds, but for
testing and familiarization, three masters and three nodes is fine. The cluster
must have an odd number of nodes to provide a quorum). You must have SSH access
to these machines and they must have SSH access to each other.

Each machine acting as a Kubernetes_ node must also have at least one disk
available to provision storage volumes.

Once you have set up a cluster, you cannot change the size of the machines on
it.

.. _MetalK8s: https://github.com/scality/metalk8s/
.. _CentOS: https://www.centos.org
.. _Kubernetes: https://kubernetes.io



