Adding NFS Storage Locations with Cosmos
========================================

The Cosmos storage backend for CloudServer enables you to manage data
stored on a filesystem and on other storage platforms. Cosmos is a
microservice that translates between CloudServer and the NFS and
CIFS/SMB protocols. When CloudServer receives a request for NFS or
CIFS/SMB service, it sends an API request to Cosmos, which translates
the request into the desired output.

Zenko uses the Cosmos service to provide NFS protocol access. As of version
1.1, Zenko supports NFS access with Cosmos as a preconfigured feature. For most
users, the default Cosmos installation offers sufficient configurability through
the Orbit user interface. 

Some users may require greater configurability of the Cosmos NFS service 
and will need to configure Cosmos manually. These instructions are offered
for such users. 

Cosmos bootstraps onto a `Kubernetes <http://kubernetes.io>`__
cluster using the `Helm <https://helm.sh>`__ package manager. Source files
for custom Cosmos installations are located in the Zenko/kubernetes/cosmos
directory. The primary method for customization is to write or change 
parameters in the values.yaml chart located there. 

Prerequisites
-------------

Before installing this chart, you must have either a Zenko or
standalone CloudServer instance running under Kubernetes.

Deploy Cosmos
-------------

To install the chart with the release name “my-release”:

.. code:: bash

    $ helm install --name my-release .

The command deploys Cosmos on the Kubernetes cluster in the default
configuration. The Parameters_ section lists 
parameters that can be configured during installation.

.. Tip:: List all releases using ``helm list``


Parameters
~~~~~~~~~~

The following table lists the Cosmos chart’s configurable parameters
and their default values.

.. tabularcolumns:: X{0.32\textwidth}X{0.32\textwidth}X{0.32\textwidth}
.. table::

   +-----------------------------------+---------------------------------------+------------------------------+
   | Parameter                         | Description                           | Default                      |
   +===================================+=======================================+==============================+
   | pfsd.name                         | Name of the pfsd component            | ``pfsd``                     |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.replicaCount                 | Number of pfsd replicas               | ``1``                        |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.image.repository             | pfsd image repository                 | ``zenko/pfsd``               |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.image.tag                    | pfsd image tag                        | ``0.1``                      |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.image.pullPolicy             | pfsd image pull policy                | ``IfNotPresent``             |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.service.type                 | pfsd service type                     | ``ClusterIP``                |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.service.port                 | pfsd service port                     | ``80``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.resources                    | pfsd resource requests and limits     | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.nodeSelector                 | Node labels for pfsd pod assignment   | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.tolerations                  | Node taints to tolerate               | ``[]``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | pfsd.affinity                     | pfsd pod affinity                     | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.name                       | Name of the rclone component          | ``rclone``                   |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.image.repository           | rclone image repository               | ``zenko/rclone``             |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.image.tag                  | rclone image tag                      | ``0.2``                      |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.image.pullPolicy           | rclone image pull policy              | ``IfNotPresent``             |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.initialIngestion           | launches a post-install ingestion job | ``true``                     |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.schedule                   | rclone CronJob schedule               | ``0 */12 * * *``             |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.successfulJobsHistory      | rclone CronJob successful job history | ``1``                        |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.destination.existingSecret | Specify secret to use for credentials | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.destination.accessKey      | Remote backend access key             | ``my-access-key``            |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.destination.secretKey      | Remote backend secret key             | ``my-secret-key``            |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.destination.endpoint       | Remote endpoint                       | ``http://cloudserver.local`` |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.destination.region         | Remote region                         | ``us-east-1``                |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.options                    | rclone cli options as key:value pair  | ``see values.yaml``          |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.resources                  | rclone resource requests and limits   | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.nodeSelector               | Node labels for rclone pod assignment | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.tolerations                | Node taints to tolerate               | ``[]``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | rclone.affinity                   | rclone pod affinity                   | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | persistentVolume.enabled          | If true, enable persistentVolume      | ``false``                    |
   +-----------------------------------+---------------------------------------+------------------------------+
   | persistentVolume.volumeConfig     | Specify volume type and mount options | ``{}``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | persistentVolume.accessModes      | Persistent volume access modes        | ``ReadWriteMany``            |
   +-----------------------------------+---------------------------------------+------------------------------+
   | persistentVolume.existingClaim    | Name of existing claim                | ``""``                       |
   +-----------------------------------+---------------------------------------+------------------------------+
   | persistentVolume.size             | Persistent volume size                | ``1Gi``                      |
   +-----------------------------------+---------------------------------------+------------------------------+
   | persistentVolume.readOnly         | If true, persistent volume will be    | ``false``                    |
   |                                   | read-only                             |                              |
   +-----------------------------------+---------------------------------------+------------------------------+

Specify each parameter using the ``--set key=value[,key=value]``
argument to ``helm install``. For example,

.. code:: bash

    $ helm install . --name my-release --set pfsd.replicaCount=3

Alternatively, a YAML file that specifies the values for the above
parameters can be provided while installing the chart. For example,

.. code:: bash

    $ helm install . --name my-release -f values.yaml

.. Tip:: 

      Use the default values.yaml file from the Zenko
      source at ~/Zenko/kubernetes/cosmos/values.yaml

Configure Cosmos on a Zenko Instance
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 
To configure Cosmos on a Zenko instance, perform the following steps
from `Orbit <https://admin.zenko.io>`_.
 
#. From `Orbit <https://admin.zenko.io/user>`__, create an NFS mount storage
   location (see "Adding a Storage Location" in *Zenko Operation and
   Architecture*.)
 
#. Copy and save the location name.

#. Create a bucket in this location.

#. Copy and save the bucket name.

#. Create a storage account for the bucket.

#. Copy and save the storage account's access and secret keys.

#. Open the Kubernetes master from the command line. Export the
   following variables, entering information from the previous steps:

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
 
#. Create a Cosmos configuration file.
 
   .. code:: bash
 
      $ cat << EOF > custom-values.yaml
       rclone:
         destination:
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
  
   .. important:: 
      Your Cosmos installation’s release name *must* match your NFS mount 
      location name. Do not name the release or the location “cosmos”.


Configure Cosmos on a Standalone CloudServer
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. Note:: This example assumes the CloudServer installation
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

#. Upgrade the CloudServer chart using the ``locationValues.yaml`` file.

   .. code:: bash
 
      $ helm upgrade cloudserver . -f locationValues.yaml

#. Configure Cosmos values.

   .. code:: bash

      $ cat << EOF > destinationValues.yaml
      rclone:
        destination:
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

#. Install Cosmos.

   .. code:: bash

      $ helm install --name ${COSMOS_RELEASE_NAME} . -f destinationValues.yaml

#. Manually trigger sync (optional)

   This chart deploys a Kubernetes Job object at installation to
   begin a metadata sync immediately. Additionally, a Kubernetes
   CronJob object is deployed, which periodically launches rclone jobs
   to sync any additional metadata changes. The job schedule can be
   configured with the rclone.schedule field in the values.yaml file. 
   To trigger the job manually, run the following command:

   .. code:: bash

      $ kubectl create job my-job-name --from=cronjob/my-release-cosmos-rclone

Uninstalling a Deployment
-------------------------

To uninstall/delete the “my-release” deployment:

.. code:: bash

    $ helm delete my-release

The command removes all Kubernetes components associated with the
chart and deletes the release.