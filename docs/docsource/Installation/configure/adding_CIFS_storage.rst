.. _adding_CIFS_storage:

Adding CIFS/SMB Storage
=======================

Cosmos CIFS/SMB Use Case
------------------------

By design, storage backend integration into Zenko and Cloudserver is
only limited by the type of volumes supported by Kubernetes.
Fortunately, Kubernetes supports “FlexVolume” drivers that allow for
custom volume driver integration into the Kubernetes ecosystem. This
guide uses the Azure CIFS/SMB FlexVolume driver for Kubernetes. For
more information on the driver, see:
https://github.com/Azure/kubernetes-volume-drivers/tree/master/flexvolume/smb

CIFS/SMB Install on MetalK8s
----------------------------

This section shows how Cosmos can be adapted to use alternative backends
through the flexibility of Kubernetes.

Install Dependencies and FlexVolume Driver on Every MetalK8s VM
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Copy the following commands and run them with root or sudo privileges.

.. code:: bash

   yum install epel-release -y
   yum install wget jq cifs-utils -y

   export PLUGINS=/var/lib/kubelet/volume-plugins/microsoft.com~smb
   mkdir -p $PLUGINS
   wget -O $PLUGINS/smb https://raw.githubusercontent.com/Azure/kubernetes-volume-drivers/master/flexvolume/smb/deployment/smb-flexvol-installer/smb
   chmod a+x $PLUGINS/smb

Usage with Cosmos Integration
-----------------------------

Installing the Chart with a Zenko Instance
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
To configure Cosmos with a Zenko instance, perform the following
steps in `Orbit <https://admin.zenko.io>`__:

1. Create a storage location of type “NFS Mount”.

   In the CIFS/SMB use case, the NFS protocol and NFS version are ignored
   and all configuration is done via the config file below.

2. Create a bucket within this location constraint.

3. Create a user for Cosmos.

4. Use information from the previous steps to configure instance-specific 
   Cosmos values. Export the following variables with appropriate values
   entered:

   .. code:: bash

      # Values from Orbit
      export ACCESS_KEY=<your-cosmos-user-access-key>
      export SECRET_KEY=<your-cosmos-user-secret-key>
      export SMB_BUCKET=<your-cosmos-bucket-name>
      export SMB_LOCATION=<your-storage-location-name>

      # Values of your SMB share
      export SMB_HOST=<your-smb-host>
      export SMB_PATH=<your-smb-path>

      # Cloudserver endpoint (assuming it's running on the same namespace)
      export CLOUDSERVER_ENDPOINT="http://$(kubectl get svc -l app=cloudserver -o jsonpath='{.items[*].metadata.name}')"

5. Create a secret to store the CIFS/SMB account name and password.

   .. code:: bash

      $ kubectl create secret generic smbcreds --from-literal username='<USERNAME>' --from-literal password='<PASSWORD>' --type="microsoft.com/smb"

6. Create a Cosmos configuration file.

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

7. Install Cosmos

   .. code:: bash

      $ helm install --name ${SMB_LOCATION} . -f cifs-custom-values.yaml

8. Manually Trigger Sync (optional)

   This chart deploys a Kubernetes CronJob object, which periodically launches
   rclone jobs to sync metadata. The job schedule can be configured with
   the ``rclone.schedule`` field in the ``values.yaml`` file. However, to
   to manually trigger the job, run the following command:

   .. code:: bash

      $ kubectl create job my-job-name --from=cronjob/${SMB_LOCATION}-cosmos-rclone
