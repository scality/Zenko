.. _configuring_zenko:

Configuring |product|
=====================

|product| is readily configurable using Helm to pass values set in Helm charts. 
Helm charts are stored in Zenko/kubernetes/zenko/ and its subdirectories.
Helm charts are YAML files with configurable values. In a |product| deployment, 
reconfiguration, or upgrade, Helm reads charts in the following order:

#. Base settings for |product| microservices (for example, Grafana settings,
   written to Zenko/kubernetes/zenko/charts/grafana/values.yaml).
#. Base settings for |product|. These settings override the base microservice 
   settings, and are found in Zenko/kubernetes/zenko/values.yaml.
#. Custom settings, which you can write to an options.yaml file. Settings
   written to this file override settings read from the preceding
   values.yaml file.

|product|'s charts are populated by default to provide a stable, feature-rich
deployment. It is easiest and safest to deploy |product| using these default 
settings in a test environment and to adjust settings there for a working
deployment. If your use case requires configuring |product| before deployment,
these instructions will remain valid and portable to the production system.

Modify options.yaml
-------------------

The options.yaml file is not present by default, but you added a simple one at
Zenko/kubernetes/options.yaml when :ref:`deploying<create_options.yaml>` 
|product|. options.yaml is the best place to make all changes
to your configuration (with one exception, nodeCounts). While it is possible to
reconfigure any aspect of |product| or its attendant microservices from those
services' base settings or in the |product| settings, it is better to make changes
to options.yaml. Because options.yaml is not a part of the base installation, it
is not overwritten on a |product| version upgrade. Likewise, finding changes written
to several values.yaml file locations can become quite difficult and
cumbersome. For these reasons, it is a best practice to *confine all
modifications to options.yaml.*

**Examples:**

|product| provides outward-facing NFS service using Cosmos, which is enabled by
default. To deactivate Cosmos:

#. Open kubernetes/zenko/cosmos/values.yaml with read-only access
   and review the cosmos block.
#. Copy the block title declaration and the subsequent line::

      cosmos:
        enabled: true

#. Open (or create) Zenko/kubernetes/options.yaml and paste the
   block you copied there. 
#. Change the value of ``enabled`` to ``false``.

Cosmos mirrors data based on a cron-like schedule. To modify this cron
interval (for an enabled Cosmos instance), descend into the YAML structure
as follows:

#. Review the cosmos block in kubernetes/zenko/cosmos/values.yaml.

#. Copy the relevant hierarchy to options.yaml:

   .. code::

      cosmos:
        scheduler:
          schedule: "* */12 * * *"

#. Edit the schedule to suit your requirements.

   .. tip:: If you are comfortable with JSON or SOAP objects, you will find
      YAML to be logically similar. If you have problems with YAML, check the
      indentation first.

Modify values.yaml
------------------

The one setting that cannot be modified in the options.yaml file is nodeCount. 
To change the node count:

#. Open Zenko/kubernetes/zenko/values.yaml

#. Change the nodeCount value only.

Push Modifications to |product|
-------------------------------

Once you have entered all changes to options.yaml or changed the values.yaml
nodeCount parameter, issue the following command from Zenko/kubernetes
to push your changes to the deployed |product| instance::

   $ helm upgrade {{zenko-server-name}} ./zenko -f options.yaml 
