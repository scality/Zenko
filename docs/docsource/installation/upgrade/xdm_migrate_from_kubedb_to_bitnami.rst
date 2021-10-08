Migrating MongoDB from KubeDB to Bitnami
========================================

Once a |product| instance is up and running, you can migrate the MongoDB
service from KubeDB to Bitnami by following these manual procedures.

.. note::

   In the following documentation, `artesca` is the name of the |product|
   instance, and the migration is intended for |product| version 2.0.1 and
   earlier to 2.x.x.

   The commands are written with the |product|
   instance running Metalk8s, and the namespace is `zenko` and the
   instance name is `artesca`.

Before Upgrade
==============

#. Make sure all the follwing resources are present, and that the `Zenko`
   instance is in a running state.

   - mongodb/artesca-data-base-db
   - secret/artesca-data-base-db-auth
   - secret/artesca-data-base-db-cert
   - secret/artesca-data-db-app-creds.v2
   - volume/data-mongodb
   - persistentvolume/data-mongodb
   
   Verify `Zenko` is running and stable:

   .. code::
    
      kubectl -n zenko describe zenko/artesca-data

      # example zenko conditions
      ...
      Conditions:
      Last Transition Time:  2021-09-17T02:16:21Z
      Message:               All components ready to process requests
      Status:                True
      Type:                  Available
      Last Transition Time:  2021-09-19T22:29:31Z
      Message:               Deployment completed
      Status:                False
      Type:                  DeploymentInProgress
      Last Transition Time:  2021-09-19T22:22:55Z
      Status:                False
      Type:                  DeploymentFailure
      ...
      Ready Replicas:          1

#. Download the ISOs:

   .. code:: 

      curl -u <user> -L -o /srv/scality/release/zenko-base-2.x.x.iso \
         https://...
      curl -u <user> -L -o /srv/scality/release/zenko-2.x.x.iso \
         https://...

#. Import and activate ``zenko-base`` solution:

   .. code::

      /srv/scality/metalk8s-2.9.2/solution.sh import -a /srv/scality/release/zenko-base-2.x.x.iso
      /srv/scality/metalk8s-2.9.2/solution.sh activate -n zenko-base -V 2.x.x

#. Import and activate ``zenko`` solution:

   .. code::

      /srv/scality/metalk8s-2.9.2/solution.sh import -a /srv/scality/release/zenko-2.x.x.iso
      /srv/scality/metalk8s-2.9.2/solution.sh activate -n zenko -V 2.x.x

Upgrade
=======

The upgrade procedure will consist of:

- Deleting the KubeDB MongoDB deployment and freeing the PV resources used.
- Deploying MongoDB using the Bitnami charts.
- Updating the existing Zenko instance to use the Bitnami MongoDB.
- Updating the `MongoDB` replica set configuration.

.. warning::

   The upgrade procedure will result in |product| instance downtime, and the
   following services will not be operational:

   - Cloudserver S3 APIs
   - Backbeat APIs
   - Orbit Management APIs
   - Vault Management APIs

Update the ``Zenko-Operator``
-----------------------------

#. Update the ``zenko-operator`` deployment:

   .. code::

      /srv/scality/metalk8s-2.9.2/solution.sh add-solution -n zenko -s zenko -V 2.x.x

   After a few seconds you should see the new operator running. From there you can update each component.

Deploy the ``Bitnami MongoDB``
------------------------------

#. Create the `secret` resource manifest, ``mongodb-creds.yaml``

   .. code:: 

      MONGODB_ROOT_USERNAME=$(kubectl -n zenko get secret artesca-data-base-db-auth -o jsonpath='{.data.username}')
      MONGODB_ROOT_PASSWORD=$(kubectl -n zenko get secret artesca-data-base-db-auth -o jsonpath='{.data.password}')
      MONGODB_USERNAME=$(kubectl -n zenko get secret artesca-data-db-app-creds.v2 -o jsonpath='{.data.username}')
      MONGODB_PASSWORD=$(kubectl -n zenko get secret artesca-data-db-app-creds.v2 -o jsonpath='{.data.password}')
      MONGODB_REPLICA_SET_KEY=$(kubectl -n zenko get secret artesca-data-base-db-cert -o jsonpath='{.data.key\.txt}')
      INSTANCE_ID=$(kubectl -n zenko get zenko/artesca-data -o jsonpath='{.status.instanceID}' | base64)
      cat >> mongodb-creds.yaml <<EOF
      apiVersion: v1
      kind: Secret
      metadata:
        name: mongodb-db-creds
      data:
        mongodb-root-username: $MONGODB_ROOT_USERNAME
        mongodb-root-password: $MONGODB_ROOT_PASSWORD
        mongodb-username: $MONGODB_USERNAME
        mongodb-password: $MONGODB_PASSWORD
        mongodb-database: $INSTANCE_ID
        mongodb-replica-set-key: $MONGODB_REPLICA_SET_KEY
      EOF

   - "mongodb-root-username"  is the superadmin user name, "root".
   - "mongodb-root-password" is the superadmin user password.
   - "mongodb-username" is the zenko application user name.
   - "mongodb-password" is the zenko application user password.
   - "mongodb-database" is the database the zenko user is allowed to access;
     this value is the instance id of the zenko instance.
   - "mongodb-replica-set-key" are the credentials used for allowing members to
     be added to a replica set.

#. Copy either the `/srv/scality/zenko-base-2.x.x/mongodb-1-node.yaml` or
   `/srv/scawlity/zenko-base-2.x.x/mongodb-3-nodes.yaml` into a new file,
   `mongodb.yaml`. 

#. Edit `mongodb.yaml` and replace the namespace placeholder, `SOLUTION_ENV`,
   with the value, "zenko".

#. Edit `mongodb.yaml` and replace the storageClass placehodler,
   `MONGODB_STORAGE_CLASS`, with with the existing PV storage class type
   retrieved in the following manner:

   .. code::

      kubectl get pv -l app.kubernetes.io/name=mongodb,app.kubernetes.io/part-of=zenko \
        -o custom-columns=NAME:.metadata.name,STORAGECLASS:.spec.storageClassName

      NAME            STORAGECLASS
      ...
      data-mongodb    ssd-ext4
      ...

#. Apply the manifest:

   .. code::

      kubectl --namespace zenko apply -f mongodb.yaml

   The deployment will be in a `PENDING` state and will wait until the required
   `PV` resources become `Available`.

Update the ``Zenko`` Resource
-----------------------------

#. Retrieve the ``Zenko`` instance id:

   .. code::

      INSTANCE_ID=$(kubectl -n zenko get zenko/artesca-data -o jsonpath='{.status.instanceID}')

#. Update the zenko's ``mongodb`` spec:

   - For one-node, create the `zenko-patch.yaml` file with the following contents:

     .. code::

        cat >> zenko-patch.yaml <<EOF
        spec:
            version: 2.x.x
            mongodb:
                provider: External
                persistence:
                endpoints:
                - mongodb-primary-0.mongodb-headless.zenko.svc.cluster.local:27017
                userSecretName: mongodb-db-creds
                usernameKey: mongodb-user
                passwordKey: mongodb-password
                replicaSetName: rs0
                databaseName: ${INSTANCE_ID}
        EOF

   - For three-nodes, create the `zenko-patch.yaml` file with the following contents:

     .. code::

        cat >> zenko-patch.yaml <<EOF
        spec:
            version: 2.x.x
            mongodb:
                provider: External
                persistence:
                endpoints:
                - mongodb-primary-0.mongodb-headless.zenko.svc.cluster.local:27017
                - mongodb-secondary-0.mongodb-headless.zenko.svc.cluster.local:27017
                - mongodb-secondary-1.mongodb-headless.zenko.svc.cluster.local:27017
                userSecretName: mongodb-db-creds
                usernameKey: mongodb-user
                passwordKey: mongodb-password
                replicaSetName: rs0
                databaseName: ${INSTANCE_ID}
        EOF

   - Apply the patch:

     .. code::

        kubectl --kubeconfig /etc/kubernetes/admin.conf -n zenko patch zenko artesca-data --type merge --patch "$(cat zenko-patch.yaml)"
   
   This will update the ``Zenko`` instance to use the Bitnami MongoDB and put
   the `Zenko` in a `DeploymentInProgress=True` state until the `MongoDB`
   service becomes available. Additionally, the KubeDB MongoDB deployment will
   be deleted, and the `DormantDatabase` resources will be created.

Releasing and removing claims on the `PV` resources
---------------------------------------------------

#. Make sure the `DormantDatabase` resources are in a ``Paused`` state.

#. Once ``Paused``, delete the `DormantDatabases` resources:

   .. code::

      kubectl delete -n zenko dormantdatabase -l kubedb.com/kind=MongoDB

#. Delete the `PVC` created by `KubeDB`:

   .. code::

      kubectl delete -n zenko pvc -l kubedb.com/kind=MongoDB,kubedb.com/name=artesca-data-base-db

#. Remove the `claimRef` from each `PV` to make them `Available`:

   - Retrieve the list of `PVs`:

     .. code::

        kubectl get pv -l app.kubernetes.io/name=mongodb,app.kubernetes.io/part-of=zenko

   - Remove `claimRef` from each `PV` in the list:

     .. code::

        kubectl patch pv <pv name> --type merge -p '{"spec":{"claimRef": null}}'

   The `Pending` Bitnami MongoDB deployment should now be able to claim the
   existing `PVs` and start the creation of the `MongoDB` resources.

Configuring the MongoDB Replica Set
-----------------------------------

#. Wait for the `mongodb-primary` and `mongodb-secondary` statefulsets to be
   successfully deployed.

   .. code::
      
        kubectl rollout status statefulset mongodb-primary
        # if deploying a multi-node configuration, run:
        kubectl rollout status statefulset mongodb-secondary

#. Access the `mongo` shell to start configuration procedure:
   
   .. code::

      MONGODB_ROOT_USERNAME=$(kubectl -n zenko get secret mongodb-db-creds -o jsonpath='{.data.mongodb-root-username}' | base64 -d)
      MONGODB_ROOT_PASSWORD=$(kubectl -n zenko get secret mongodb-db-creds -o jsonpath='{.data.mongodb-root-password}' | base64 -d)
      kubectl -n zenko exec -ti mongodb-primary-0 -c mongodb-primary -- mongo -u $MONGODB_ROOT_USERNAME -p $MONGODB_ROOT_PASSWORD

#. In `mongo` shell, run the following commands:

   - Create `rsconf` variable in:

     .. code::

        rs0:OTHER> rsconf = rs.conf()

   - Add replica set members: 
 
     .. code::

        rs0:OTHER> rsconf.members = [
        ... {_id: 0, host: "mongodb-primary-0.mongodb-headless.zenko.svc.cluster.local:27017"}
        ... ] 

     If running 3-nodes, the following should be added:

     .. code::

        rs0:OTHER> rsconf.members = [
        ... {_id: 0, host: "mongodb-primary-0.mongodb-headless.zenko.svc.cluster.local:27017"},
        ... {_id: 1, host: "mongodb-secondary-0.mongodb-headless.zenko.svc.cluster.local:27017"},
        ... {_id: 2, host: "mongodb-secondary-1.mongodb-headless.zenko.svc.cluster.local:27017"}
        ... ] 

   - Run `rs.reconfig` to elect new `PRIMARY`:

     .. code::

        rs0:OTHER> rs.reconfig(rsconf, { force: true})

   - Verify the replica set is configured correctly:
    
     .. code::
        
        rs0:PRIMARY> rs.status()["members"]

Verifying Zenko Deployment Status
---------------------------------

#. Wait for the `Zenko` instance to be upgraded:

   .. code::

      # wait for any existing errors from the upgrade to be resolved
      kubectl -n zenko wait --for condition=DeploymentFailure=false --timeout 10m zenko/artesca-data

      # wait for any for upgrade completion
      kubectl -n zenko wait --for condition=DeploymentInProgress=false --timeout 10m zenko/artesca-data

   If an error occurs during the upgrade process or a upgrade times out, the
   following can be run to debug the issue:

   .. code::

      kubectl -n zenko describe zenko/artesca-data

   The ``DeploymentFailure`` condition will contain details about the error
   preventing the upgrade from completing.
