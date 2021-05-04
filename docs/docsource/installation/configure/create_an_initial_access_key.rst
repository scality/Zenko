.. _Create an Initial Access Key:

Create an Initial Access Key
============================

The first set of credentials for an account is created using ``vaultclient`` and
admin credentials. Use these account credentials with the AWS API to create
users and policies.

Prerequisites
-------------

- The data service must be deployed
- Credentials must be generated from the Artesca cluster itself

Procedure
---------

#. Set the admin access key ID and the secret access key.

   .. code::

      VAULT_CONTAINER=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko get pods -l app.kubernetes.io/name=connector-vault -o jsonpath='{.items[0].metadata.name}')
      ADMIN_ACCESS_KEY_ID=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf  get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.accessKey}' | base64 -d)
      ADMIN_SECRET_ACCESS_KEY=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf  get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.secretKey}' | base64 -d)

#. Create an account using ``vaultclient``.

   .. code::

      kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c   "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} /vault/node_modules/vaultclient/bin/vaultclient create-account --name account1 --email account1@scality.local"

#. Create the access key.

   .. code::

      kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c   "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} /vault/node_modules/vaultclient/bin/vaultclient generate-account-access-key --name=account1 --host 127.0.0.1  --port 8600"

   .. note::

     If the ``UserName`` field is not specified, the user name is determined based
     on the access key ID used to sign the request.
  
