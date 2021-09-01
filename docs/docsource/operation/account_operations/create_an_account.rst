.. _Create an Account:

Create an Account
=================

Because |product| cannot do anything without at least one account to work with,
the first step in any working deployment is to create an account. If you have
not yet set up any accounts:

#. Log into the |product| UI.

   .. image:: ../../graphics/xdm_ui_login.png

#. The **CREATE NEW ACCOUNT** window displays automatically.

   .. image:: ../../graphics/xdm_ui_create_account.png

   If you have installed at least one account, click the **Accounts** tab, then the
   **Create Account** button to raise the **CREATE NEW ACCOUNT** window. 

   Enter a unique account name and the email address for the Storage
   Manager. You can also use the **Quota in GB** field to set a hard upper limit
   on space available to this account. Once the account is created, the quota
   cannot be changed from the |product| UI. If no value is entered, |product|
   imposes no size limit on the account.

   Click **Create**.

#. The **Accounts** view displays with the new account information.

   .. image:: ../../graphics/xdm_ui_account_created.png

   From this view, the Storage Manager can create, find, and delete accounts, or
   click the **Locations** tab to manage account locations and the buckets they
   contain.
   
Create an Account Using the Command Line
----------------------------------------

#. Set the admin access key ID and secret access key ID as environment variables:

   .. code::
      
      VAULT_CONTAINER=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko 
      get pods -l app.kubernetes.io/name=connector-vault -o jsonpath='{.items[0].metadata.name}') 

   .. code::

      ADMIN_ACCESS_KEY_ID=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf 
      get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.accessKey}' | base64 -d)

   .. code::

      ADMIN_SECRET_ACCESS_KEY=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf 
      get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.secretKey}' | base64 -d)

#. Create the Account 

   .. note:: 

      In the following example, account name is ``account1`` and email is ``account1@scality.local`` 

   .. code::

      kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c 
      "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} 
      /vault/node_modules/vaultclient/bin/vaultclient create-account --name account1 --email account1@scality.local"

Generate Account Access Keys Using the Command Line
---------------------------------------------------

#. Set the admin access key ID and secret access key ID as environment variables.

   .. code::
   
      VAULT_CONTAINER=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko get pods -l 
      app.kubernetes.io/name=connector-vault -o jsonpath='{.items[0].metadata.name}')

   .. code::

      ADMIN_ACCESS_KEY_ID=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf 
      get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.accessKey}' | base64 -d)

   .. code::

      ADMIN_SECRET_ACCESS_KEY=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf 
      get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.secretKey}' | base64 -d)

#. Generate the Account Access Key.

   .. note:: 

      In the following example, account name is ``account1`` and email is ``account1@scality.local`` 

   .. code::

      kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c 
      "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} 
      /vault/node_modules/vaultclient/bin/vaultclient generate-account-access-key --name=account1 --host 127.0.0.1  --port 8600"