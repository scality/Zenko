.. _Burry:

Burry
=====

Burry is a **B**\ack\ **u**\ p and **r**\ecove\ **ry** tool for cloud-native
infrastructure services. |product| uses Burry to back up and restore critical
base infrastructure services such as ZooKeeper and the Kafka configurations and
topics it contains.

Install
-------

Burry is installed with |product| as a cronjob in suspended mode. To enable it, edit
the options.yaml file; then update |product| with Helm. It is toggled off by default
with the ``suspend:`` parameter set to ``true``. Setting this parameter to ``false``
activates the feature when pushed to a |product| server.

.. code:: sh

   burry:
     cronjob:
       suspend: false
       schedule: "5 * * * *"
     configMap:
       destType: "s3"
       destEndpoint: "{{zenko-server-name}}"
       accessKey: "accessKey"
       secretKey: "secretKey"
       bucket: "bucketName"
       ssl: "false

When you've completed your reconfiguration, push the new configuration to your
|product| server with a Helm command::

  $ helm upgrade {{zenko-server-name}} ./zenko -f options.yaml
