.. _Generate Root User Account Access Keys:

Generate Root User Account Access Keys
======================================

To generate root user account access keys from the command line:

#. Retrieve tokens as described in :ref:`Retrieve Access Tokens`.

#. Issue the following command:

   .. code::

      # kubectl --kubeconfig=/etc/kubernetes/admin.conf -n zenko exec $VAULT_CONTAINER -- bash -c "ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} /vault/node_modules/vaultclient/bin/vaultclient generate-account-access-key --name=account --name account1"

