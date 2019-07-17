.. _adding_CIFS_storage:

Add Out-of-Band Updates from CIFS/SMB
=====================================

With optional configuration, Zenko supports out-of-band updates from SMB/CIFS
servers. Zenko polls these servers on a cron schedule. When it finds a change of
state in any file, Zenko updates its namespace enabling management and
replication for qualified cloud backends. You must configure Cosmos to implement
this feature for CIFS/SMB.

The default Zenko installation deploys Cosmos with NFS support only. Zenko's
Orbit graphical user interface does not support SMB/CIFS endpoints, which must
be configured from the CLI. Configuring Cosmos to use SMB/CIFs or both NFS and
SMB/CIFS requires configuring Cosmos for each as described here.

.. note::

   By design, storage backend integration into Zenko and CloudServer
   is limited only by the type of volumes supported by Kubernetes.
   Kubernetes supports FlexVolume drivers that allow for custom volume
   driver integration into the Kubernetes ecosystem. This guide uses
   the Azure CIFS/SMB FlexVolume driver for Kubernetes. For more
   information on the driver, see:
   https://github.com/Azure/kubernetes-volume-drivers/tree/master/flexvolume/smb

Install Dependencies and FlexVolume Driver
------------------------------------------

Copy the following commands.

.. code:: bash

   yum install epel-release -y
   yum install wget jq cifs-utils -y

   export PLUGINS=/var/lib/kubelet/volume-plugins/microsoft.com~smb
   mkdir -p $PLUGINS
   wget -O $PLUGINS/smb https://raw.githubusercontent.com/Azure/kubernetes-volume-drivers/master/flexvolume/smb/deployment/smb-flexvol-installer/smb
   chmod a+x $PLUGINS/smb

For each Kubernetes node in the cluster, access the node (ssh in) and run 
the copied commands as root, or copy them to a script and run it with sudo
privileges.

