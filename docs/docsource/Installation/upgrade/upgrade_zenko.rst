Upgrade
=======

Once a Zenko instance is up and running, you can upgrade it with a
simple Helm command. 

Before Upgrading 
----------------

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
   before upgrading. Upgrades run with the `--dry-run` flag simulate
   and, if possible, validate a compatible upgrade. If the `--debug`
   flag is set, Helm outputs all templated values and deployment
   configurations to be installed. These are basic validations, but
   their upgrade implications must be considered by both the Zenko and
   Kubernetes administrators.

Upgrading
---------

To upgrade Zenko: 

#. Back up your existing Zenko directory.

   ::

   $ cp -r Zenko Zenko-backup

#. Download the latest stable version (.zip or .tar.gz) from
   https://github.com/scality/Zenko/releases

#. Unpack the .zip or .tar.gz file and navigate to Zenko/kubernetes/. 

#. Copy Zenko/kubernetes/zenko/options.yaml from your existing Zenko 
   source directory to the same directory in the new Zenko source.  

#. If you have modified the node count from the default value of 3,
   go to Zenko/kubernetes/zenko/values.yaml in the new Zenko source and
   edit the nodeCount value to match the existing nodeCount value. 

#. From the kubernetes/ directory of the new Zenko source, enter this
   Helm command, inserting your Zenko server's name:

   :: 

      $ helm upgrade {{zenko-server-name}} ./zenko

   If you are using custom values, reuse options.yml on upgrades.
   ::

      $ helm upgrade {{zenko-server-name}} ./zenko -f options.yml

#. On success, Helm reports:
   :: 

      Release "{{zenko-server-name}}" has been upgraded. Happy Helming!

   After a few seconds, Helm displays a voluminous status report on the
   server's current operating condition.

   .. tip::

      Expect the cluster to take a few minutes to stabilize. You may see 
      CrashLoopBackoff errors. This is normal, expected behavior.

Upgrading from 1.0.x to 1.1.x
-----------------------------

Zenko 1.0.x versions use MongoDB version 3.4, which has been upgraded to 3.6
in Zenko 1.1.x. Although upgrades using the commands above will work, some
newer features may not function.

To upgrade from 1.0.x to 1.1:

#. Run the typical upgrade command, inserting your Zenko server's release name
   ::

     $ helm upgrade {{zenko-release-name}} ./zenko

   If you are using custom values, be sure to reuse the options.yaml file on
   upgrades.
   ::

      $ helm upgrade {{zenko-server-name}} ./zenko -f options.yaml

#. After the upgrade has stabilized all pod rollouts, run the following
   command to finalize the MongoDB compatibility upgrade:
   ::

     $ helm upgrade {{zenko-release-name}} ./zenko --set maintenance.upgradeMongo=true -f options.yaml

#. A pod is deployed. When the upgrade is successful, it shows a "Completed"
   status.
   ::

     {{zenko-release-name}}-zenko-mongo-capabilities       0/1     Completed          0          4h

   .. note::

      Once this upgrade is complete, the maintenance flag is no
      longer required for further 1.1.x upgrades.
