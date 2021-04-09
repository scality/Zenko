.. _Install XDM on MetalK8s:

Install |product| on MetalK8s
=============================

.. note::
   
   This installation procedure is performed on a single node.

Prerequisites
-------------

- Partition your disk as follows:
   
  +-------------+---------+-----------+
  | Partition # | Size    | Service   |
  +=============+=========+===========+
  | 1           | 300 GiB | Mongo     |
  +-------------+---------+-----------+
  | 2           | 100 GiB | Kafka     |
  +-------------+---------+-----------+
  | 3           | 100 GiB | S3Data    |
  +-------------+---------+-----------+
  | 4           | 10 GiB  | Redis     |
  +-------------+---------+-----------+
  | 5           | 10 GiB  | ZooKeeper |
  +-------------+---------+-----------+

  If necessary, partition your disk:

  .. code::
      
     DISK_NAME=/dev/vdb
     parted -a none ${DISK_NAME} --script \
         mklabel gpt \
         mkpart primary ext4 1MiB 320GiB \
         mkpart primary ext4 320GiB 420GiB \
         mkpart primary ext4 420GiB 520GiB \
         mkpart primary ext4 520GiB 530GiB \
         mkpart primary ext4 530GiB 540GiB \
         mkpart primary ext4 540GiB 550GiB \
         mkpart primary ext4 550GiB 560GiB \
         mkpart primary ext4 560GiB 570GiB \
         mkpart primary ext4 570GiB 580GiB

Deploy MetalK8s
---------------

Refer to *MetalK8s Installation* for details on its deployment.

Deploy |product| Operator
-------------------------

#. From your terminal, create an environment for |product|:

   .. code::

      /srv/scality/metalk8s-{{version-number}}/solutions.sh create-env --name zenko

#. Install |product| Base:

   .. parsed-literal::

      /srv/scality/metalk8s-{{version-number}}/solutions.sh import --archive $ZENKO_BASE_ISO
      sed "s/SOLUTION_ENV/zenko/g" /srv/scality/zenko-base-|version|/operator.yaml | kubectl apply -f -
      kubectl -n zenko rollout status --timeout 10m deploy kubedb-operator
      sed "s/SOLUTION_ENV/zenko/g" /srv/scality/zenko-base-|version|/operator.yaml | kubectl apply -f -

#. Install |product| Operator:

   .. parsed-literal::

      /srv/scality/metalk8s-{{version-number}}/solutions.sh import --archive $ZENKO_ISO
      /srv/scality/metalk8s-{{version-number}}/solutions.sh activate --name zenko --version |version|
      /srv/scality/metalk8s-{{version-number}}/solutions.sh add-solution --name zenko --solution zenko --version |version|
      kubectl -n zenko rollout status --timeout 10m deploy zenko-operator

Deploy |product|
----------------

#. Create a Keycloak realm for |product|:

   .. code::

      REALM_NAME="zenko-realm"
      CLIENT_ID="zenko-ui"
      UI_ENDPOINT="http://ui.zenko.local"
      
      kubectl -n ringx-auth exec -i keycloak-0 -- /opt/jboss/keycloak/bin/kcadm.sh       config credentials --server http://localhost:8080/auth --realm master --user       admin --password password
      cat <<EOF | kubectl -n ringx-auth exec -i keycloak-0 -- /opt/jboss/keycloak/      bin/kcadm.sh create realms -f -
      {
        "realm" : "${REALM_NAME}",
        "enabled" : true,
        "groups" : [ ],
        "defaultRoles" : [ "uma_authorization", "offline_access" ],
        "requiredCredentials" : [ "password" ],
        "users" : [ ],
        "clients" : [ {
          "clientId" : "${CLIENT_ID}",
          "rootUrl" : "${UI_ENDPOINT}",
          "adminUrl" : "${UI_ENDPOINT}",
          "surrogateAuthRequired" : false,
          "enabled" : true,
          "alwaysDisplayInConsole" : false,
          "clientAuthenticatorType" : "client-secret",
          "secret" : "",
          "redirectUris" : [ "${UI_ENDPOINT}/*" ],
          "webOrigins" : [ "${UI_ENDPOINT}" ],
          "notBefore" : 0,
          "bearerOnly" : false,
          "consentRequired" : false,
          "standardFlowEnabled" : true,
          "implicitFlowEnabled" : false,
          "directAccessGrantsEnabled" : true,
          "serviceAccountsEnabled" : false,
          "publicClient" : true,
          "frontchannelLogout" : false,
          "protocol" : "openid-connect",
          "attributes" : { },
          "authenticationFlowBindingOverrides" : { },
          "fullScopeAllowed" : true,
          "nodeReRegistrationTimeout" : -1,
          "protocolMappers" : [ {
            "name" : "instanceids_mapper",
            "protocol" : "openid-connect",
            "protocolMapper" : "oidc-usermodel-attribute-mapper",
            "consentRequired" : false,
            "config" : {
              "multivalued" : "true",
              "userinfo.token.claim" : "true",
              "user.attribute" : "instanceIds",
              "id.token.claim" : "true",
              "access.token.claim" : "true",
              "claim.name" : "instanceIds"
            }
          }, {
            "name" : "role_mapper",
            "protocol" : "openid-connect",
            "protocolMapper" : "oidc-usermodel-attribute-mapper",
            "consentRequired" : false,
            "config" : {
              "user.attribute" : "role",
              "id.token.claim" : "true",
              "access.token.claim" : "true",
              "claim.name" : "role",
              "userinfo.token.claim" : "true"
            }
          } ]
        } ]
      }
      EOF

#. Check the Keycloak realm:

   .. code::
      
      kubectl -n ringx-auth exec keycloak-0 -- curl http://keycloak.zenko.local/auth/realms/zenko-realm

#. Create a ``.yaml`` file for the new |product| version:

   .. parsed-literal::

      kubectl apply --namespace zenko -f /srv/scality/zenko-|version|/zenkoversion.yaml

#. Create storage classes:

   .. code::

      cat <<EOF | kubectl apply -f -
      apiVersion: storage.k8s.io/v1
      kind: StorageClass
      metadata:
        name: sc-300-g
        labels:
          zenko: storageclass
      mountOptions:
      - rw
      - discard
      parameters:
        fsType: ext4
        mkfsOptions: '["-m", "0"]'
      provisioner: kubernetes.io/no-provisioner
      reclaimPolicy: Retain
      volumeBindingMode: WaitForFirstConsumer
      ---
      apiVersion: storage.k8s.io/v1
      kind: StorageClass
      metadata:
        name: sc-100-g
        labels:
          zenko: storageclass
      mountOptions:
      - rw
      - discard
      parameters:
        fsType: ext4
        mkfsOptions: '["-m", "0"]'
      provisioner: kubernetes.io/no-provisioner
      reclaimPolicy: Retain
      volumeBindingMode: WaitForFirstConsumer
      ---
      apiVersion: storage.k8s.io/v1
      kind: StorageClass
      metadata:
        name: sc-10-g
        labels:
          zenko: storageclass
      mountOptions:
      - rw
      - discard
      parameters:
        fsType: ext4
        mkfsOptions: '["-m", "0"]'
      provisioner: kubernetes.io/no-provisioner
      reclaimPolicy: Retain
      volumeBindingMode: WaitForFirstConsumer
      ---
      EOF

#. Refer to *MetalK8s Operation* to create volumes for |product|.

#. Create a resource for |product|:

   .. parsed-literal::

      cat <<EOF | kubectl apply -n zenko -f - 
      apiVersion: zenko.io/v1alpha1
      kind: Zenko
      metadata:
        name: zenko-instance
      spec:
        version: |version|
        replicas: 1
        mongodb:
          provider: KubeDB
          persistence:
            volumeClaimTemplate:
              size: 300Gi
              storageClassName: sc-300-g
        redis:
          provider: KubeDB
          persistence:
            volumeClaimTemplate:
              size: 10Gi
              storageClassName: sc-10-g
        kafka:
          provider: Managed
          persistence:
            volumeClaimTemplate:
              size: 100Gi
              storageClassName: sc-100-g
        zookeeper:
          provider: Managed
          persistence:
            volumeClaimTemplate:
              size: 10Gi
              storageClassName: sc-10-g
        localData:
          persistence:
            volumeClaimTemplate:
              size: 100Gi
              storageClassName: sc-100-g
        vault:
          enable: true
          iamIngress:
            hostname: iam.zenko.local
          stsIngress:
            hostname: sts.zenko.local
        management:
          provider: InCluster
          ui:
            ingress:
              hostname: ui.zenko.local
          oidc:
            provider: 'http://keycloak.zenko.local/auth/realms/zenko-realm'
            uiClientId: zenko-ui
            vaultClientId: zenko-ui
          api:
            ingress:
              hostname: management.zenko.local
            allowFrom:
            - 172.16.0.0/12
            - 10.0.0.0/8
        ingress:
          workloadPlaneClass: 'nginx'
          controlPlaneClass: 'nginx'
          annotations:
            nginx.ingress.kubernetes.io/proxy-body-size: 0m
      EOF
      kubectl wait --for condition=Available --timeout 10m -n zenko zenko/      
      zenko-instance

#. Create a Keycloak user for the |product| instance:

   .. code::
      
      OIDC_USER="zenko-tester"
      INSTANCE_ID=$(kubectl -n zenko get zenko/zenko-instance -o jsonpath='{.      status.instanceID}')
      REALM_NAME="zenko-realm"
      
      kubectl -n ringx-auth exec -i keycloak-0 -- /opt/jboss/keycloak/bin/kcadm.sh       config credentials --server http://localhost:8080/auth --realm master --user       admin --password password
      cat <<EOF | kubectl -n ringx-auth exec -i keycloak-0 -- /opt/jboss/keycloak/      bin/kcadm.sh create users -r "${REALM_NAME}" -f -   
      {
          "username": "${OIDC_USER}",
          "enabled": true,
          "totp": false,
          "emailVerified": true,
          "firstName": "zenko",
          "lastName": "tester",
          "email": "${OIDC_USER}@zenko.local",
          "attributes": {
              "instanceIds": [
                  "${INSTANCE_ID}"
              ],
              "role": [
              "user"
              ]
          },
          "credentials": [],
          "disableableCredentialTypes": [],
          "requiredActions": [],
          "realmRoles": [
              "uma_authorization",
              "offline_access"
          ],
          "clientRoles": {
              "account": [
              "view-profile",
              "manage-account"
              ]
          },
          "notBefore": 0,
          "groups": []
      }
      EOF
      
      kubectl -n ringx-auth exec -i keycloak-0 -- /opt/jboss/keycloak/bin/kcadm.sh       set-password -r ${REALM_NAME} --username ${OIDC_USER}

Testing
-------

Using the GUI
*************

Add the following hosts to your ``etc/hosts`` file, resolving them to the 
MetalK8s node's IP address:

- management.zenko.local
- keycloak.zenko.local
- ui.zenko.local
- s3.zenko.local

.. note::

   If port 80 is open, you can access the user interface through http://ui.zenko.local.

.. important::

   The user interface is limited to creating accounts and locations.

Using the Command Line
**********************

Prerequisites
~~~~~~~~~~~~~~

- jq and curl must be installed
- Access from the browser user machine

Procedure
~~~~~~~~~

#. Retrieve ``ACCESS_TOKEN``, ``TOKEN``, and ``INSTANCE_ID``:

   .. code::
      
      OIDC_REALM='zenko-realm'
      OIDC_CLIENT_ID='zenko-ui'
      OIDC_USER='zenko-tester'
      OIDC_USER_PASSWORD='password'
      ZENKO_NAME='zenko-instance'
      
      ACCESS_TOKEN=$(
          curl -s -k "http://keycloak.zenko.local/auth/realms/${OIDC_REALM}/protocol/      openid-connect/token" \
              -d 'scope=openid' \
              -d "client_id=${OIDC_CLIENT_ID}" \
              -d "username=${OIDC_USER}" \
              -d "password=${OIDC_USER_PASSWORD}" \
              -d "grant_type=password" | \
              jq -cr '.access_token'
      )
      
      TOKEN=$(
          curl -s -k "http://keycloak.zenko.local/auth/realms/${OIDC_REALM}/protocol/      openid-connect/token" \
              -d 'scope=openid' \
              -d "client_id=${OIDC_CLIENT_ID}" \
              -d "username=${OIDC_USER}" \
              -d "password=${OIDC_USER_PASSWORD}" \
              -d "grant_type=password" | \
              jq -cr '.id_token'
      )
      
      
      INSTANCE_ID=$(
          curl -s -k "http://keycloak.zenko.local/auth/realms/${OIDC_REALM}/protocol/      openid-connect/userinfo" \
              -H "Authorization: bearer $ACCESS_TOKEN" | \
              jq -rc '.instanceIds[0]'
      )

#. Create an account:

   .. code::
      
      ZENKO_ACCOUNT='test-account-1'

      USER_PARAMS=$(
          echo '{}' |
          jq -c "
              .userName=\"${ZENKO_ACCOUNT}\" |
              .email=\"${ZENKO_ACCOUNT}@zenko.local\"
          "
      )
      
      curl -s -k -X POST \
          -H "X-Authentication-Token: ${TOKEN}" \
          -H "Content-Type: application/json" \
          -d "${USER_PARAMS}" \
          "http://management.zenko.local/api/v1/config/${INSTANCE_ID}/user" | \
          jq '.'

#. Create an additional S3 endpoint:

   .. code::
      
      ENDPOINT_PARAMS=$(
          echo '{}' |
          jq -c "
              .hostname=\"${ENDPOINT_HOSTNAME}\" |
              .locationName=\"${LOCATION_NAME}\"
          "
      )
      
      curl -s -k -X POST \
          -H "X-Authentication-Token: ${TOKEN}" \
          -H "Content-Type: application/json" \
          -d "${ENDPOINT_PARAMS}" \
          "http://management.zenko.local/api/v1/config/${INSTANCE_ID}/endpoint" | \
          jq '.'

#. Generate the account key:

   .. code::
      
      ZENKO_ACCOUNT='test-account-1'

      curl -s -k -X POST \
          -H "X-Authentication-Token: ${TOKEN}" \
          -H "Content-Type: application/json" \
          "http://management.zenko.local/api/v1/config/${INSTANCE_ID}/user/$      {ZENKO_ACCOUNT}/key" | \
          jq '.'
