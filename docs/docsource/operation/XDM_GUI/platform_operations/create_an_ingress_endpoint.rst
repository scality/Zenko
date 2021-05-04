.. _Create an Ingress Endpoint:

Create an Ingress Endpoint
==========================

Prerequisites
-------------

- jq and curl must be installed
- Access from the user machine's browser 

Procedure
---------

#. Retrieve ACCESS_TOKEN, TOKEN, and INSTANCE_ID::

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

#. Create the endpoint::

     ENDPOINT_PARAMS=$(echo '{}' |jq -c ".hostname=\"${ENDPOINT_HOSTNAME}\" |.locationName=\"${LOCATION_NAME}\"")

     curl -s -k -X POST \
       -H "X-Authentication-Token: ${TOKEN}" \
       -H "Content-Type: application/json" \
       -d "${ENDPOINT_PARAMS}" \
       "http://management.zenko.local/api/v1/config/${INSTANCE_ID}/endpoint" | \
       jq '.'
