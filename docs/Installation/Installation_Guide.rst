Installation Guide
==================

While it is possible to run Zenko on a single machine, it’s designed for
cluster operation. If you can set up a Kubernetes cluster on your own,
review the :ref:`General Cluster Requirements` and skip to
:ref:`Installing Zenko`.

Otherwise, you can set up a cluster quickly using
`MetalK8s <https://github.com/scality/metalk8s/>`__, Scality's open-source
Kubernetes cluster project, as described in "`Setting Up a MetalK8s Cluster`_".

.. toctree::
   :maxdepth: 1

   topics/Setting_Up_a_Cluster
   topics/Installing_Zenko
   topics/configure_ingress
   topics/adding_NFS_storage
   topics/adding_CIFS_storage

.. _`Setting Up a MetalK8s Cluster`: ./topics/Setting_Up_a_Cluster.html
