.. _Retrieve Access Tokens:

Retrieve Access Tokens
======================

Prerequisites
~~~~~~~~~~~~~

- jq and curl installed
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
          curl -s -k "http://keycloak.zenko.local/auth/realms/${OIDC_REALM}/protocol/openid-connect/token" \
              -d 'scope=openid' \
              -d "client_id=${OIDC_CLIENT_ID}" \
              -d "username=${OIDC_USER}" \
              -d "password=${OIDC_USER_PASSWORD}" \
              -d "grant_type=password" | \
              jq -cr '.access_token'
      )
      
      TOKEN=$(
          curl -s -k "http://keycloak.zenko.local/auth/realms/${OIDC_REALM}/protocol/openid-connect/token" \
              -d 'scope=openid' \
              -d "client_id=${OIDC_CLIENT_ID}" \
              -d "username=${OIDC_USER}" \
              -d "password=${OIDC_USER_PASSWORD}" \
              -d "grant_type=password" | \
              jq -cr '.id_token'
      )
      
      
      INSTANCE_ID=$(
          curl -s -k "http://keycloak.zenko.local/auth/realms/${OIDC_REALM}/protocol/openid-connect/userinfo" \
              -H "Authorization: bearer $ACCESS_TOKEN" | \
              jq -rc '.instanceIds[0]'
      )

