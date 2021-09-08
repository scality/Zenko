.. _manage_access_keys:

Manage Access Keys
==================

Creating Access Keys
--------------------

#. Log into the |product| UI using previously provisioned credentials (refer to :ref:`Create an Account`).

   .. image:: ../../graphics/sign_into_artesca.PNG

#. Click **Accounts** on the top menu.

   .. image:: ../../graphics/account_banner.PNG

#. Click **+Create Access key**

   .. image:: ../../graphics/accounts-page.PNG

#. Click **Continue** on the **Create Root user Access keys** screen.

   .. image:: ../../graphics/root_user_access_keys_dialog.PNG

#. Save the Secret Access Key ID by clicking the copy button, and save it in a secure location 
   
   .. image:: ../../graphics/close_button.PNG

#. Close **Close**.

Deleting Access Keys
--------------------

#. Log into the |product| UI.

#. Click **Accounts** on the top menu.

   .. image:: ../../graphics/account_banner.PNG

#. Click the red trash icon to the right of the access key you wish to delete. 

   .. important::

	   You will not be asked for confirmation. Clicking the trash icon will immediatly delete the key. 
   
   .. image:: ../../graphics/delete_access_key_icon.PNG

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