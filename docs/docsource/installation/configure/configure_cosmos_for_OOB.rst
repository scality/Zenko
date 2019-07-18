Configuring Cosmos for Out-of-Band Updates
==========================================

The Cosmos storage backend for CloudServer enables you to manage data stored on
a filesystem and on other storage platforms. Cosmos is a microservice that
translates between CloudServer and the NFS and CIFS/SMB protocols. When
CloudServer receives a request for NFS or CIFS/SMB service, it sends an API
request to Cosmos, which translates the request into the desired output.

Zenko uses the Cosmos service to provide NFS protocol access. As of version
1.1, Zenko supports NFS access with Cosmos as a preconfigured feature. For most
users, the default Cosmos installation offers sufficient configurability through
the Orbit user interface. Some users may require greater configurability of the
Cosmos NFS service and will need to configure Cosmos manually. These
instructions are offered for such users.

Cosmos bootstraps onto a `Kubernetes <http://kubernetes.io>`__ cluster using
the `Helm <https://helm.sh>`__ package manager. Source files for custom Cosmos
installations are located in the Zenko/kubernetes/cosmos directory. The primary
method for customization is to write or change parameters in the values.yaml
chart located there.

Prerequisites
-------------

Before installing this chart, you must have either a Zenko or standalone
CloudServer instance running under Kubernetes.

Deploy Cosmos
-------------

To install the chart with the release name “my-release”:

.. code:: bash

    $ helm install --name my-release .

The command deploys Cosmos on the Kubernetes cluster in the default
configuration. The Parameters_ section lists parameters that can be configured
during installation.

.. Tip:: List all releases using ``helm list``


Parameters
~~~~~~~~~~

The following table lists the Cosmos chart’s configurable parameters and their
default values.

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

Configure Cosmos
----------------

To configure Cosmos with a Zenko instance:

#. From `Orbit <https://admin.zenko.io/user>`__, create an NFS mount storage
   location (see "Adding a Storage Location" in *Zenko Operation*.)

   .. note:: 

      In the CIFS/SMB use case, the NFS protocol and NFS version are ignored
      and all configuration is through the config file below.

#. Copy and save the location name.

#. Create a bucket in this location. At the **Location Type** prompt, you will
   see two instances of the NFS server. Select the NFS server at the desired
   location that has **Mirror mode** enabled.

#. Copy and save the bucket name.

#. Create a storage account for the bucket.

#. Copy and save the storage account's access and secret keys.

#. Open the Kubernetes master from the command line. Export the following
   variables, entering information from the previous steps. 
   
   For an SMB location:

   .. code:: bash

      # Values from Orbit
      export ACCESS_KEY=<your-cosmos-user-access-key>
      export SECRET_KEY=<your-cosmos-user-secret-key>
      export SMB_BUCKET=<your-cosmos-bucket-name>
      export SMB_LOCATION=<your-storage-location-name>

      # Values of your SMB share
      export SMB_HOST=<your-smb-host>
      export SMB_PATH=<your-smb-path>

      # Cloudserver endpoint (assuming it is running on the same namespace)
      export CLOUDSERVER_ENDPOINT="http://$(kubectl get svc -l app=cloudserver -o jsonpath='{.items[*].metadata.name}')"

   For an NFS location:

   .. code:: bash

      export ACCESS_KEY=<your-cosmos-user-access-key>
      export SECRET_KEY=<your-cosmos-user-secret-key>
      export NFS_BUCKET=<your-cosmos-bucket-name>
      export NFS_LOCATION=<your-nfs-mount-location-name>

      # Values of your NFS mount point	
      export NFS_HOST=<your-nfs-server-host>	
      export NFS_EXPORT_PATH=<your-nfs-server-path>	
      
      # Cloudserver endpoint (assuming it is running on the same namespace)
      export CLOUDSERVER_ENDPOINT="http://$(kubectl get svc -l app=cloudserver -o jsonpath='{.items[*].metadata.name}')"

#. Create a secret to store the CIFS/SMB account name and password:

   .. code:: bash

      $ kubectl create secret generic smbcreds --from-literal username='<USERNAME>' --from-literal password='<PASSWORD>' --type="microsoft.com/smb"
      
#. Create a Cosmos configuration file:

   For SMB:

   .. code:: bash

      $ cat << EOF > cifs-custom-values.yaml
      rclone:
        remote:
          accessKey: ${ACCESS_KEY}
          secretKey: ${SECRET_KEY}
          endpoint: ${CLOUDSERVER_ENDPOINT}
          region: ${SMB_LOCATION}
          bucket: ${SMB_BUCKET}

      persistentVolume:
        enabled: true
        volumeConfig:
          flexVolume:
            driver: "microsoft.com/smb"
            secretRef:
              name: smbcreds
            options:
              source: "//${SMB_HOST}/${SMB_PATH}"
              # The mount options can be configured however necessary
              mountoptions: "vers=3.0,dir_mode=0777,file_mode=0777"
      EOF

   For NFS:

   .. code:: bash

      $ cat << EOF > destinationvalues.yaml
      rclone:
        destination:
          accessKey: ${ACCESS_KEY}
          secretKey: ${SECRET_KEY}
          endpoint: ${CLOUDSERVER_ENDPOINT}
          region: ${NFS_LOCATION}
          bucket: ${NFS_BUCKET} # Bucket will be created if not present

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
   
#. Install Cosmos

   For the SMB values above, run: 

   .. code:: bash

      $ helm install --name ${SMB_LOCATION} . -f cifs-custom-values.yaml

   For the NFS values above, run:

   .. code:: bash

      $ helm install --name ${COSMOS_RELEASE_NAME} . -f destinationValues.yaml

   .. important:: 
      Your Cosmos installation’s release name *must* match your NFS mount 
      location name. Do not name the release or the location “cosmos”.

#. Manually trigger sync (optional)

   This chart deploys a Kubernetes CronJob object, which periodically launches
   rclone jobs to sync metadata. The job schedule can be configured with
   the ``rclone.schedule`` field in the ``values.yaml`` file. To trigger the
   job manually, run the following command:

   .. code:: bash

      $ kubectl create job my-job-name --from=cronjob/${SMB_LOCATION}-cosmos-rclone