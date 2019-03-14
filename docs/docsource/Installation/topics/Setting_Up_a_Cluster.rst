.. _Setting Up a Cluster:

Setting Up a Cluster
####################

While it is possible to run Zenko on a single machine, it’s designed for
Kubernetes cluster operation. If you can set up a Kubernetes cluster on 
your own, review the :ref:`General Cluster Requirements` and skip to
:ref:`Installing Zenko`.

Much of the complexity of installing Zenko involves deploying a suitable
cluster. Scality supports MetalK8s, a Kubernetes engine that is optimized
for the Zenko use case. You can set up a cluster quickly using
`MetalK8s <https://github.com/scality/metalk8s/>`__, Scality's open-source
Kubernetes cluster project.

The following section describes general cluster requirements, which are tested
on MetalK8s. Because MetalK8s is designed to operate without support from
public cloud resources, the following sizing requirements are assumed good for
other cloud Kubernetes deployments, where such resources are preinstalled and
available on demand.

.. _General Cluster Requirements:

General Cluster Requirements
****************************

Setting up a testing cluster requires at least three machines (these can be
VMs) running CentOS_ 7.4 or higher (The recommended mimimum for Zenko
production service is five server nodes with three masters/etcds, but for
testing and familiarization, three masters and three nodes is fine). You must
have SSH access to these machines and they must have SSH access to each other.

Each machine acting as a Kubernetes_ node must also have at least one disk
available to provision storage volumes.

Once you have set up a cluster, you cannot change the size of the machines on
it.


.. _MetalK8s: https://github.com/scality/metal-k8s/
.. _CentOS: https://www.centos.org
.. _Kubernetes: https://kubernetes.io

Sizing
******

The following sizes for Zenko instances have been tested on live systems using
MetalK8s, which adds some overhead. If you are running a different Kubernetes
engine, fewer resources may be required, but such configurations remain to be
tested.

Reserve the following resources for each node.

-  Cores per server

   - 24 vCPU minimum
   - 32 vCPU medium load
   - 58 vCPU heavy load

-  RAM per server

   - 32 GB minimum
   - 64 GB medium load
   - 96 GB heavy load

-  Additional resources
   - 120 GB SSD (boot drive)
   - 80 GB SSD

-  Storage

   -  1 TB persistent volume per node minimum


      .. note::

        This requirement is for storage, not for the system device. Storage
        requirements depend on the sizing of different components and
        anticipated use. You may have to attach a separate storage volume to
        each cloud server instance.

All servers must run CentOS 7.4 or later, and must be ssh-accessible.

Custom Sizing
=============

The default persistent volume sizing requirements are sufficient for a
conventional deployment. Your requirements may vary, based on total data
managed and total number of objects managed.

.. Important::

   Persistent volume storage  must match or exceed the maximum
   anticipated demand. Once set, the cluster cannot be resized
   without redefining new volumes.

To size your deployment, review the default values in
Zenko/kubernetes/zenko/values.yaml. This file reserves space for each component
in the build. This is the baseline build, which Helm will install unless
instructed otherwise.

Next, review the values discussed in Zenko/kubernetes/zenko/storage.yaml.
The storage.yaml file contains sizing instructions and settings that, when
specified in a Helm installation, override the default values expressed in the
values.yaml file. To override default values using storage.yaml, use the
following addendum to the helm install invocation at Zenko deployment.

::

   $ helm install [other options] -f storage.yaml


How much persistent volume space is required is calculable based on total data
managed, total objects managed, and other factors. See storage.yaml for details.

Proxies
=======

If you are behind a proxy, add the following lines to your local machine’s
/etc/environment file:

::

    http_proxy=http://user;pass@<my-ip>:<my-port>
    https_proxy=http://user;pass@<my-ip>:<my-port>
    no_proxy=localhost,127.0.0.1,10.*

