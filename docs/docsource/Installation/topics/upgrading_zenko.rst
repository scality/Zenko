Upgrading Zenko
===============

Once a Zenko instance is up and running, it is upgraded by a simple Helm 
command. 

To upgrade Zenko: 

#. Download the latest stable version (.zip or .tar.gz) from
   https://github.com/scality/Zenko/releases

#. Unpack the .zip or .tar.gz file and navigate to Zenko/kubernetes/. 

#. Enter this Helm commamnd, inserting your Zenko's release name
   :: 

      $ helm upgrade {{zenko-release-name}} ./zenko

   If you are used a custom values be sure to reuse this file on upgrades.
   ::

      $ helm upgrade {{zenko-release-name}} ./zenko -f options.yaml

   On success, Helm reports:
   :: 

      Release "{{zenko-release-name}}" has been upgraded. Happy Helming!

   Then, after a few seconds, Helm displays a voluminous status report on the
   server's current operating condition.

   ..tip ::

      Expect the cluster to take a few minutes to stabilize. You may see 
      CrashLoopBackoff errors. This is normal, expected behavior.

Upgrading from 1.0.x to 1.1.x
=============================

Zenko 1.0.x versions use MongoDB version 3.4 which is upgraded to 3.6 in Zenko
1.1.x versions. Upgrades using the previously mentioned commands will work
however some newer features may not function by default.

#. Run the typical upgrade command, inserting your Zenko's release name
   ::

     $ helm upgrade {{zenko-release-name}} ./zenko

   After the upgrade has stabilized all pod rollouts, run the following
   command to finialize the MongoDB compatibility upgrade:
   ::

     $ helm upgrade {{zenko-release-name}} ./zenko --set maintenance.upgradeMongo=true

   You will see a pod get deployed that will run to and show a Completed status
   once the upgrade has successfully occurred.
   ::

     {{zenko-release-name}}-zenko-mongo-capabilities       0/1     Completed          0          4h

   ..note ::

     Once the upgrade is completed the maintenance flag is not needed
     and should not be specified for further 1.1.x upgrades.

Upgrade conisderations
======================

Most installs will have have custom values used to setup the desired installation
needs. Please compare any live values to the ones that will be applied in an upgrade
to ensure consistency and prevent any undesired changes.

To see the custom values of a running Zenko:

   $ helm get values {{zenko-release-name}} > pre_upgrade_values.yaml

..note ::

   Any values added at upgrade will override and completely replace the running
   values. Please carefully review any changes between the pre upgrade values with
   the intended values that will be applied during the upgrade. 



In a production environment, it is a best practice to run an upgrade simulation.
For example:: 
  
   $ helm upgrade zenko ./zenko --dry-run --debug

..note ::

   A production environment may neccessitate additional validation before 
   proceeding with the upgrade. Upgrades run with the `--dry-run` flag simulate 
   and, if possible, validate a compatible upgrade. If the `--debug` flag is 
   set, Helm outputs all templated values and deployment configurations to be
   installed. These are basic validations, but their upgrade implications must
   be considered by both the Zenko and Kubernetes administrators.
