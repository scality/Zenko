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
   
Create an Account from the Command Line
---------------------------------------

To create an account from the command line:

#. Retrieve tokens as described in :ref:`Retrieve Access Tokens`.

#. Issue the following variable declarations and commands:

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

