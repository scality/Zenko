.. _sizing:

Sizing
======

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
-------------

The default persistent volume sizing requirements are sufficient for a
conventional deployment. Your requirements may vary based on total data
managed and total number of objects managed.

.. Important::

   Persistent volume storage must match or exceed the maximum
   anticipated demand. Once set, the cluster cannot be resized
   without redefining new volumes.

To size your deployment, review the default values in Zenko/kubernetes/zenko/\
values.yaml. This file reserves space for each component
in the build. This is the baseline build, which Helm will install unless
instructed otherwise.

Next, review the values discussed in Zenko/kubernetes/zenko/storage.yaml.
The storage.yaml file contains sizing instructions and settings that, when
specified in a Helm installation, override the default values expressed in the
values.yaml file. To override default values using storage.yaml, use the
following addendum to the ``helm install`` invocation at 
:ref:`Zenko deployment<Install_Zenko>`.

::

   $ helm install [other options] -f storage.yaml


How much persistent volume space is required is calculable based on total data
managed, total objects managed, and other factors. See storage.yaml for details.
