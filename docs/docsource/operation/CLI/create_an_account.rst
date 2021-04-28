Create an Account
=================

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

