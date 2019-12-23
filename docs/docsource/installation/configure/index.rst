.. _post-installation:

Configure
=========

Once Zenko is installed and stable, installing optional configurations
is a relatively painless process. Follow the configuration instructions
in this section to extend Zenko's capabilities. 

Because ingress control is not standardized across all Kubernetes
implementations, it is deactivated by default. You must configure it
to enable Web access to Zenko. 

Zenko supports out-of-band (OOB) updates from NFS file systems as well as
dynamic OOB updates from Scality RINGs with the S3 Connector. With added
configurations, described in the sections that follow, your Zenko instance can
access and manage these namespaces.

.. toctree::
   :maxdepth: 2 

   configuring_zenko
   configure_ingress
   configure_KMIP

