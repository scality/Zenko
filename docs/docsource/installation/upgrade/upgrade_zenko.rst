Upgrading
=========

Once a Zenko instance is up and running, you can upgrade it with a
simple Helm command. 

Before Upgrade
--------------

Most installations use custom values to set them up as required.
Compare any live values to those to be applied in an
upgrade to ensure consistency and prevent undesired changes.

To see the custom values of a running Zenko instance::

   $ helm get values {{zenko-release-name}} > pre_upgrade_values.yaml

.. important::

   Values added at upgrade *override and completely replace* the values used
   to configure the running instance. Before invoking ``helm upgrade``,
   carefully review all changes between the values used in the running instance
   against the values you intend to push in the upgrade. 

In a production environment, it is a best practice to run an upgrade simulation.
For example:: 
  
   $ helm upgrade zenko ./zenko --dry-run --debug

.. note::

   A production environment may neccessitate additional validation
   before upgrading. Upgrades run with the ``--dry-run`` flag simulate
   and, if possible, validate a compatible upgrade. If the ``--debug``
   flag is set, Helm outputs all templated values and deployment
   configurations to be installed. These are basic validations, but
   their upgrade implications must be considered by both the Zenko and
   Kubernetes administrators.

Upgrade
-------

To upgrade Zenko: 

#. Back up your existing Zenko directory.

   ::

   $ cp -r Zenko Zenko-backup

#. Download the latest stable version (.zip or .tar.gz) from
   https://github.com/scality/Zenko/releases

#. Unpack the .zip or .tar.gz file and navigate to Zenko/kubernetes/. 

#. Copy Zenko/kubernetes/options.yaml from your existing Zenko
   source directory to the same directory in the new Zenko source.  

#. If you have modified the node count from the default value of 3,
   go to Zenko/kubernetes/zenko/values.yaml in the new Zenko source and
   edit the nodeCount value to match the existing nodeCount value. 

#. From the kubernetes/ directory of the new Zenko source, enter this
   Helm command, inserting your Zenko server's name:

   ::
      
      $ helm upgrade {{zenko-server-name}} ./zenko

   If you are using custom values, reuse options.yaml on upgrades.
   
   ::

      $ helm upgrade {{zenko-server-name}} ./zenko -f options.yaml

#. On success, Helm reports:
   
   ::
      
      Release "{{zenko-server-name}}" has been upgraded. Happy Helming!

   After a few seconds, Helm displays a voluminous status report on the
   server's current operating condition.

   .. tip::

      Expect the cluster to take a few minutes to stabilize. You may see 
      CrashLoopBackoff errors. This is normal, expected behavior.

