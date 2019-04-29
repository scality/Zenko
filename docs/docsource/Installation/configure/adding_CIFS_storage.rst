.. _adding_CIFS_storage:

Adding CIFS/SMB Storage
=======================

With optional configuration, Zenko supports inputs from SMB/CIFS
servers. Zenko polls these servers on a cron schedule. When it finds a
change of state in any file, Zenko updates its namespace and mirrors
the changes to the configfured cloud backend(s). You must configure
Cosmos to implement this feature for CIFS/SMB. 

The default Zenko installation deploys Cosmos with NFS support
only. Configuring Cosmos to use SMB/CIFs or both NFS and SMB/CIFS
requires configuring Cosmos for each as described here.

.. note::

   By design, storage backend integration into Zenko and CloudServer
   is limited only by the type of volumes supported by Kubernetes.
   Kubernetes supports FlexVolume drivers that allow for custom volume
   driver integration into the Kubernetes ecosystem. This guide uses
   the Azure CIFS/SMB FlexVolume driver for Kubernetes. For more
   information on the driver, see:
   https://github.com/Azure/kubernetes-volume-drivers/tree/master/flexvolume/smb

Install Dependencies and FlexVolume Driver
------------------------------------------

Copy the following commands.

.. code:: bash

   yum install epel-release -y
   yum install wget jq cifs-utils -y

   export PLUGINS=/var/lib/kubelet/volume-plugins/microsoft.com~smb
   mkdir -p $PLUGINS
   wget -O $PLUGINS/smb https://raw.githubusercontent.com/Azure/kubernetes-volume-drivers/master/flexvolume/smb/deployment/smb-flexvol-installer/smb
   chmod a+x $PLUGINS/smb

For each Kubernetes node in the cluster, access the node (ssh in) and run 
the copied commands as root, or copy them to a script and run it with sudo
privileges.

Configure Cosmos
----------------

To configure Cosmos with a Zenko instance:

#. From `Orbit <https://admin.zenko.io/user>`__, create an NFS mount storage
   location (see "Adding a Storage Location" in *Zenko Operation and 
   Architecture*.)

   .. note:: 

      In the CIFS/SMB use case, the NFS protocol and NFS version are ignored
      and all configuration is through the config file below.

#. Copy and save the location name.

#. Create a bucket in this location. At the **Location Constraint**
   prompt, you will see two instances of the NFS server. Select the NFS
   server at the desired location that has **Mirror mode** enabled.

#. Copy and save the bucket name.

#. Create a storage account for the bucket.

#. Copy and save the storage account's access and secret keys.

#. Open the Kubernetes master from the command line. Export the
   following variables, entering information from the previous steps:

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

#. Create a secret to store the CIFS/SMB account name and password:

   .. code:: bash

      $ kubectl create secret generic smbcreds --from-literal username='<USERNAME>' --from-literal password='<PASSWORD>' --type="microsoft.com/smb"
      
#. Create a Cosmos configuration file:

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

#. Install Cosmos

   .. code:: bash

      $ helm install --name ${SMB_LOCATION} . -f cifs-custom-values.yaml

#. Manually trigger sync (optional)

   This chart deploys a Kubernetes CronJob object, which periodically launches
   rclone jobs to sync metadata. The job schedule can be configured with
   the ``rclone.schedule`` field in the ``values.yaml`` file. To trigger the
   job manually, run the following command:

   .. code:: bash

      $ kubectl create job my-job-name --from=cronjob/${SMB_LOCATION}-cosmos-rclone