Account Routes
==============

Account API routes enable you to manage S3 Accounts using HTTP.

Accessing Account Routes
------------------------

Account routes are accessible either:

- Through Vault's admin port, which is TCP 8600 by default,
- Through standard HTTP port (TCP 80),
- Through standard HTTPS port (TCP 443) if :ref:`Frontend SSL <Enabling SSL/TLS
  in S3 Frontend Service>` has been activated.

All hosts belonging to the ``[runners_s3]`` Ansible group (see
:ref:`Federation`\'s inventory file) host the Vault service. They
all can be used as endpoints.

All requests to the underlying routes must comply with the `AuthV4
<https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html>`_
authentication schema. Parameters must be entered in the POST body, not the URL.

Account routes can only be accessed by the super-admin user, whose access and
secret keys are stored in :ref:`Federation`, in the
``env/s3config/vault/admin-clientprofile/admin1.json`` file.

.. toctree::
   :maxdepth: 1

   create_account
   list_account
   delete_account
   update_account_quota
   delete_account_quota

