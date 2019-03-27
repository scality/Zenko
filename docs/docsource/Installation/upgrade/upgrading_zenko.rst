Upgrading Zenko
===============

Once a Zenko instance is up and running, it is upgraded by a simple Helm 
command. 

To upgrade Zenko: 

#. Download the latest stable version (.zip or .tar.gz) from
   https://github.com/scality/Zenko/releases

#. Unpack the .zip or .tar.gz file and navigate to Zenko/kubernetes/. 

#. Enter this Helm commamnd, inserting your Zenko server's name
   :: 

      $ helm upgrade {{zenko-server-name}} ./zenko

   On success, Helm reports:
   :: 

      Release "{{zenko-server-name}}" has been upgraded. Happy Helming!

   Then, after a few seconds, Helm displays a voluminous status report on the
   server's current operating condition.

   ..tip ::

      Expect the cluster to take a few minutes to stabilize. You may see 
      CrashLoopBackoff errors. This is normal, expected behavior.

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