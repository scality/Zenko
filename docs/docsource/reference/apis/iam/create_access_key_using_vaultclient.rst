Create a First AccessKey Using vaultclient
==========================================

The first set of credentials of an account is created using
``vaultclient`` and admin credentials. Later on, account credentials
can be used with AWS API to create users and policies.

Prerequisites
-------------

- The data service is deployed
- Admin credentials 
- Admin routes

Procedure
---------

#. Set the admin access key ID and secret access key.

   .. code::

      ADMIN_ACCESS_KEY_ID=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf  get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.accessKey}' | base64 -d)
      ADMIN_SECRET_ACCESS_KEY=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf  get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.secretKey}' | base64 -d)

#. Create an account using ``vaulclient``.

   .. code::

      kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c   "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} /vault/node_modules/vaultclient/bin/vaultclient create-account --name account2 --email account2@test.com --host 127.0.0.1  --port 8600"

#. Create the access key.

   .. code::

      kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c   "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} /vault/node_modules/vaultclient/bin/vaultclient generate-account-access-key --name=account2 --host 127.0.0.1  --port 8600"
