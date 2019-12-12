.. _Backup Services:

Backup Services
===============

Zenko uses two scripted backup services, Burry and MGOB. Burry backs up
Kubernetes data. MGOB backs up the namespace and other metadata that MongoDB
generates and uses to track object stores. Both perform scheduled backups using
a crontab-like configfuration.

.. toctree::
   :maxdepth: 1

   Burry<burry>
   MGOB<mgob>
