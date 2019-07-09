.. _post-installation:

Configure
=========

Once Zenko is installed and stable, installing optional configurations
is a relatively painless process. Follow the configuration instructions
in this section to extend Zenko's capabilities. 

Because ingress control is not standardized across all Kubernetes
implementations, it is deactivated by default. You must configure it
to have Web access to Zenko. Zenko supports the popular NFS protocol
by default. With added configurations, described in the sections that 
follow, your Zenko instance can also provide access to SMB/CIFS or both
SMB/CIFS and NFS.

.. toctree::
   :maxdepth: 2 

   configuring_zenko
   set_up_NFS_for_OOB
   set_up_CIFS_for_OOB
   configure_cosmos_for_OOB
   configure_ingress
