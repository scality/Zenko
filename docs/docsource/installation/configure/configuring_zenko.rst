.. _configuring_zenko:

Configuring Zenko
=================

Zenko is readily configurable using Helm to pass values set in Helm charts. 
Helm charts are stored in Zenko/kubernetes/zenko/ and its subdirectories.
Helm charts are YAML files with configurable values. In a Zenko deployment, 
reconfiguration, or upgrade, Helm reads charts in the following order:

#. Base settings for Zenko microservices (for example, Grafana settings,
   written to Zenko/kubernetes/zenko/charts/grafana/values.yaml).
#. Base settings for Zenko. These settings override the base microservice 
   settings, and are found in Zenko/kubernetes/zenko/values.yaml.
#. Custom settings, which you can write to an options.yaml file. Settings
   written to this file override settings read from the preceding
   values.yaml file.

Zenko's charts are populated by default to provide a stable, feature-rich
deployment. It is easiest and safest to deploy Zenko using these default 
settings in a test environment and to adjust settings on a working deployment.
If your use case requires configuring Zenko before deployment, these
instructions remain valid.

Modifying options.yml
----------------------

The options.yml file is not present by default, but you added a simple one
at Zenko/kubernetes/zenko/options.yml when deploying Zenko. options.yml is 
the best place to make all changes to your configuration (with one 
exception, nodeCounts). While it is possible to reconfigure any aspect of
Zenko or its attendant microservices from those services' base settings or in
the Zenko settings, it is better to confine changes to options.yml. Because
options.yaml is not a part of the base installation, it cannot be overwritten
on a Zenko version upgrade. Likewise, finding changes written to several 
values.yaml file locations can become quite difficult and cumbersome. For 
these reasons, it is a best practice to *confine all modifications to 
options.yml.*

**Examples:**

Zenko provides outward-facing NFS service using Cosmos, which is enabled by
default. To deactivate Cosmos:

#. Open kubernetes/zenko/cosmos/values.yaml with read-only access
   and review the cosmos block.
#. Copy the block title declaration and the subsequent line::

      cosmos:
         enabled: true

#. Open (or create) Zenko/kubernetes/zenko/options.yml and paste the
   block you copied there. 
      
#. Change the value of ``enabled`` to ``false``.

Cosmos mirrors data based on a cron-like schedule. To modify this cron
interval, descend into the YAML structure as follows:

   #. Review the cosmos block in kubernetes/zenko/cosmos/values.yaml.

   #. Copy the relevant hierarchy to options.yml:

      .. code::   

         cosmos:
            scheduler:
      	       schedule: "* */12 * * *"

#. Edit the schedule to suit your requirements.

.. tip:: If you are comfortable with JSON or SOAP objects, you will find YAML to
   	 be logically similar. If you have problems with YAML, check the
	 indentation first.

Modifying values.yaml
---------------------

The one setting that cannot be modified in the options.yml file is nodeCount. 
To change the node count:

   #. Open Zenko/kubernetes/zenko/values.yaml

   #. Change the nodeCount value only. 

Pushing Modifications to Zenko
------------------------------

Once you have entered all changes to options.yml or changed the values.yaml
nodeCount parameter, issue the following command from Zenko/kubernetes/zenko
to push your changes to the deployed Zenko instance::

   $ helm upgrade {{zenko-server-name}} . -f options.yml

