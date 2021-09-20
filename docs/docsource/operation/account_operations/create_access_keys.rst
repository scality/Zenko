.. _create_access_keys:

Create Access Keys
==================

Create Access Keys Using the UI
-------------------------------

#. Log into the |product| UI using previously provisioned credentials (refer to :ref:`Create an Account`).

#. Click **Accounts** on the top menu.

   .. image:: ../../graphics/account_banner.PNG

#. Click **+ Create Access key**.

   .. image:: ../../graphics/accounts-page.PNG

#. Click **-> Continue** on the **Create Root user Access keys** screen.

   .. image:: ../../graphics/root_user_access_keys_dialog.PNG

#. Click the copy button to save the Secret Access key ID. Make sure to save it in a secure location. 
   
   .. image:: ../../graphics/close_button.PNG

#. Click **Close** after saving the Secret Access key ID.

Create Access Keys Using the Command Line
-----------------------------------------

#. Set the Admin Access key ID and Secret Access key ID as environment variables.

   .. code-block:: none
      :caption: VAULT_CONTAINER
   
      VAULT_CONTAINER=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko get pods -l 
      app.kubernetes.io/name=connector-vault -o jsonpath='{.items[0].metadata.name}')

   .. code-block:: none
      :caption: ADMIN_ACCESS_KEY_ID

      ADMIN_ACCESS_KEY_ID=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf 
      get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.accessKey}' | base64 -d)

   .. code-block:: none
      :caption: ADMIN_SECRET_ACCESS_KEY

      ADMIN_SECRET_ACCESS_KEY=$(kubectl --kubeconfig=/etc/kubernetes/admin.conf 
      get secret artesca-data-management-vault-admin-creds.v1 -n zenko -o jsonpath='{.data.secretKey}' | base64 -d)

#. Generate the Account Access key.

   .. note:: 

      In the following example, account name is ``account1`` and email is ``account1@scality.local``. 

   .. code::

      kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c 
      "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} 
      /vault/node_modules/vaultclient/bin/vaultclient generate-account-access-key --name=account1 --host 127.0.0.1  --port 8600"