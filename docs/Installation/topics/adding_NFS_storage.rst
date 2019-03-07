Adding NFS Storage Locations with Cosmos
========================================

The Cosmos storage backend for Cloudserver enables you to manage data
stored on a filesystem and on other storage platforms.

Cosmos bootstraps onto a `Kubernetes <http://kubernetes.io>`__
cluster using the `Helm <https://helm.sh>`__ package manager.

Prerequisites
-------------

Before installing this chart, you must have either a Zenko or
standalone Cloudserver instance running.

Installing the Chart
--------------------

To install the chart with the release name “my-release”:

.. code:: bash

    $ helm install --name my-release .

The command deploys Cosmos on the Kubernetes cluster in the default
configuration. The Parameters_ section lists 
parameters that can be configured during installation.

.. Tip:: List all releases using ``helm list``


Parameters
----------

The following table lists the Cosmos chart’s configurable parameters
and their default values.

.. tabularcolumns:: X{0.32\textwidth}X{0.32\textwidth}X{0.32\textwidth}
.. table::

   +------------------------------------+---------------------------------------+------------------------------+
   | Parameter                          | Description                           | Default                      |
   +====================================+=======================================+==============================+
   | ``pfsd.name``                      | Name of the pfsd component            | ``pfsd``                     |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.replicaCount``              | Number of pfsd replicas               | ``1``                        |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.image.repository``          | pfsd image repository                 | ``zenko/pfsd``               |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.image.tag``                 | pfsd image tag                        | ``0.1``                      |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.image.pullPolicy``          | pfsd image pull policy                | ``IfNotPresent``             |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.service.type``              | pfsd service type                     | ``ClusterIP``                |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.service.port``              | pfsd service port                     | ``80``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.resources``                 | pfsd resource requests and limits     | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.nodeSelector``              | Node labels for pfsd pod assignment   | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.tolerations``               | Node taints to tolerate               | ``[[``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``pfsd.affinity``                  | pfsd pod affinity                     | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.name``                    | Name of the rclone component          | ``rclone``                   |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.image.repository``        | rclone image repository               | ``zenko/rclone``             |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.image.tag``               | rclone image tag                      | ``0.2``                      |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.image.pullPolicy``        | rclone image pull policy              | ``IfNotPresent``             |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.schedule``                | rclone CronJob schedule               | ``0 */12 * * *``             |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.successfulJobsHistory``   | rclone CronJob successful job history | ``1``                        |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.remote.existingSecret``   | Specify secret to use for credentials | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.remote.accessKey``        | Remote backend access key             | ``my-access-key``            |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.remote.secretKey``        | Remote backend secret key             | ``my-secret-key``            |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.remote.endpoint``         | Remote endpoint                       | ``http://cloudserver.local`` |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.remote.region``           | Remote region                         | ``us-east-1``                |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.resources``               | rclone resource requests and limits   | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.nodeSelector``            | Node labels for rclone pod assignment | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.tolerations``             | Node taints to tolerate               | ``[]``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``rclone.affinity``                | rclone pod affinity                   | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``persistentVolume.enabled``       | If true, enable persistentVolume      | ``false``                    |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``persistentVolume.volumeConfig``  | Specify volume type and mount options | ``{}``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``persistentVolume.accessModes``   | Persistent volume access modes        | ``ReadWriteMany``            |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``persistentVolume.existingClaim`` | Name of existing claim                | ``""``                       |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``persistentVolume.size``          | Persistent volume size                | ``1Gi``                      |
   +------------------------------------+---------------------------------------+------------------------------+
   | ``persistentVolume.readOnly``      | If true, persistent volume will be    | ``false``                    |
   |                                    | read-only                             |                              |
   +------------------------------------+---------------------------------------+------------------------------+

Specify each parameter using the ``--set key=value[,key=value]``
argument to ``helm install``. For example,

.. code:: bash

    $ helm install . --name my-release --set pfsd.replicaCount=3

Alternatively, a YAML file that specifies the values for the above
parameters can be provided while installing the chart. For example,

.. code:: bash

    $ helm install . --name my-release -f values.yaml

.. Tip:: Use the default values.yaml file from the Zenko
	 source at ~/Zenko/kubernetes/cosmos/values.yaml

Installing the Chart with a Zenko Instance
------------------------------------------
 
To configure Cosmos on a Zenko instance, perform the following steps
from `Orbit <https://admin.zenko.io>`_.
 
1. Create a storage location of type "NFS Mount".
 
2. Create a bucket within this location constraint.
 
3. Create a user for Cosmos.
 
4.  Use information from the previous steps to configure instance-
    specific Cosmos values. Export the following variables with 
    appropriate values entered:
 
   .. code:: bash

      # Values from Orbit
      export ACCESS_KEY=<your-cosmos-user-access-key>
      export SECRET_KEY=<your-cosmos-user-secret-key>
      export NFS_BUCKET=<your-cosmos-bucket-name>
      export NFS_LOCATION=<your-nfs-mount-location-name>
 
      # Values of your NFS mount point
      export NFS_HOST=<your-nfs-server-host>
      export NFS_EXPORT_PATH=<your-nfs-server-path>
 
      # Cloudserver endpoint (assuming it's running on the same namespace)
      export CLOUDSERVER_ENDPOINT="http://$(kubectl get svc -l app=cloudserver -o jsonpath='{.items[*].metadata.name}')"
 
5. Create a Cosmos configuration file.
 
   .. code:: bash
 
      $ cat << EOF > custom-values.yaml
       rclone:
         remote:
           accessKey: ${ACCESS_KEY}
           secretKey: ${SECRET_KEY}
           endpoint: ${CLOUDSERVER_ENDPOINT}
           region: ${NFS_LOCATION}
           bucket: ${NFS_BUCKET}
 
       persistentVolume:
         enabled: true
         volumeConfig:
           nfs:
             server: ${NFS_HOST}
             path: ${NFS_EXPORT_PATH}
             readOnly: false
           # Any valid nfs mount option can be listed here
           mountOptions: "nfsvers=3,rw"
       EOF
  
6. Install Cosmos.
 
   .. code:: bash

      $ helm install --name ${NFS_LOCATION} . -f custom-values.yaml
  
   .. Important:: 
      Your Cosmos installation’s release name *must* match your NFS Mount 
      location name. Do not name the release or the location “cosmos”.


Installing the Chart with a Standalone Cloudserver Instance
-----------------------------------------------------------

.. Note:: This example assumes the Cloudserver installation
   release is named “cloudserver”. 

1. Export common variables between both charts.

   .. code:: bash

      $ export COSMOS_RELEASE_NAME=blue-sky
      $ export NFS_LOCATION=nfs-1

2. Configure the Cosmos location constraint in the 
   ``locationValues.yaml`` file

   .. code:: bash

      $ cat << EOF > locationValues.yaml
      api:
        locationConstraints:
          # Required default location
          us-east-1:
            type: file
            objectId: us-east-1
            legacyAwsBehavior: true
            details: {}
          # New Location
          ${NFS_LOCATION}:
            type: pfs
            objectId: nfs-1
            legacyAwsBehavior: true
            details:
              bucketMatch: true
              pfsDaemonEndpoint:
                host: ${COSMOS_RELEASE_NAME}-cosmos-pfsd
                port: 80
      EOF

3. Upgrade the cloudserver chart using the ``locationValues.yaml`` file.

   .. code:: bash
 
      $ helm upgrade cloudserver . -f locationValues.yaml

4. Configure Cosmos values.

   .. code:: bash

      $ cat << EOF > remoteValues.yaml
      rclone:
        remote:
          accessKey: my-access-key
          secretKey: my-secret-key
          endpoint: http://cloudserver
          region: ${NFS_LOCATION}
          bucket: my-nfs-bucket # Bucket will be created if not present

      persistentVolume:
        enabled: true
        volumeConfig:
          nfs:
            server: 10.100.1.42 # IP address of your NFS server
            path: /data # NFS export
            readOnly: false
          # Any valid nfs mount option can be listed here
          mountOptions: "nfsvers=3,rw"
      persistentVolume:
      EOF

5. Install Cosmos.

   .. code:: bash

      $ helm install --name ${COSMOS_RELEASE_NAME} . -f remoteValues.yaml

Manually Trigger Sync
---------------------

This chart deploys a Kubernetes CronJob, which periodically launches
rclone jobs to sync metadata. The job schedule can be configured with
the ``rclone.schedule`` field in the ``values.yaml`` file. However, to
to manually trigger the job run the following command:

.. code:: bash

    $ kubectl create job my-job-name --from=cronjob/my-release-cosmos-rclone

Uninstalling the Chart
----------------------

To uninstall/delete the “my-release” deployment:

.. code:: bash

    $ helm delete my-release

The command removes all Kubernetes components associated with the
chart and deletes the release.
