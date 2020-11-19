.. _sizing:

Sizing
======

The following sizes for XDM instances have been tested on live systems using
MetalK8s, which adds some overhead. If you are running a different Kubernetes
engine, fewer resources may be required, but such configurations are not
supported and remain to be tested.

Reserve at least the following resources for each node.

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

   -  200 GB persistent volume per node 

      .. note::

        This requirement is for storage, not for the system device. Storage
        requirements depend on the sizing of different components and
        anticipated use. You may have to attach a separate storage volume to
        each cloud server instance.

All servers must run CentOS 7.7 or later, with kernel version 3.10.0-1062.4.1 or
later, and must be SSH-accessible.

Partitioning
------------

.. table::

   +---------------+-----------------+
   | /var/lib/etcd | 5 GB on an SSD  |
   +---------------+-----------------+
   | /var          | 100 GB for logs |
   +---------------+-----------------+
   | /             | 40 GB           |
   +---------------+-----------------+

Custom Sizing
=============

The default persistent volume sizing requirements are sufficient for a
conventional deployment. Your requirements may vary based on total data managed
and total number of objects managed.

.. Important::

   Persistent volume storage must match or exceed the maximum anticipated
   demand. Once set, the cluster cannot be resized without redefining new
   volumes.

To size your deployment, review the default values in
Zenko/kubernetes/zenko/values.yaml. This file reserves space for each component
in the build. values.yaml contains baseline build settings, which Helm installs
unless instructed otherwise.

Next, review the values discussed in Zenko/kubernetes/zenko/storage.yaml.
The storage.yaml file contains default sizing instructions and settings.

To make changes, copy the default settings from values.yaml or storage.yaml to
Zenko/kubernetes/options.yaml and modify the values there.

To override default values using options.yaml, use the following addendum to the
``helm install`` invocation at :ref:`Install_XDM`.

::

   $ helm install [other options] -f options.yaml

How much persistent volume space is required is calculable based on total data
managed, total objects managed, and other factors. Review the comments in
storage.yaml for details.
