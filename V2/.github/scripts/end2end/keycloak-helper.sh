#! /bin/sh

set -exu

DIR=$(dirname "$0")

COMMAND=${1:-''}
NAMESPACE=${2:-default}
ZENKO_NAME=${3:-end2end}

KEYCLOAK_EXEC="kubectl -n ${NAMESPACE} exec -i keycloak-0 --"

refresh_creds() {
    ${KEYCLOAK_EXEC} \
        /opt/jboss/keycloak/bin/kcadm.sh config credentials \
        --server http://localhost:8080/auth \
        --realm master \
        --user admin \
        --password password
}

case $COMMAND in
    "setup-realm")
        refresh_creds
        envsubst < $DIR/configs/keycloak_config.json | \
            ${KEYCLOAK_EXEC} /opt/jboss/keycloak/bin/kcadm.sh create realms -f -
        ;;

    "add-user")
        refresh_creds

        export INSTANCE_ID=`kubectl -n ${NAMESPACE} get zenko ${ZENKO_NAME} -o jsonpath='{.status.instanceID}'`
        
        export OIDC_EMAIL=${OIDC_EMAIL:-"e2e@zenko.local"}

        envsubst < $DIR/configs/keycloak_user.json | \
            ${KEYCLOAK_EXEC} /opt/jboss/keycloak/bin/kcadm.sh create users -r ${OIDC_REALM} -f -

        ${KEYCLOAK_EXEC} /opt/jboss/keycloak/bin/kcadm.sh set-password \
            -r ${OIDC_REALM} \
            --username ${OIDC_USERNAME} \
            --new-password ${OIDC_PASSWORD}

        # attach StorageManager role to user
        ${KEYCLOAK_EXEC} /opt/jboss/keycloak/bin/kcadm.sh add-roles \
          -r ${OIDC_REALM} \
          --uusername ${OIDC_USERNAME} \
          --rolename "StorageManager"
        ;;
    
    "set-user-instance-ids")
        refresh_creds

        export INSTANCE_ID=`kubectl -n ${NAMESPACE} get zenko -o jsonpath='{.items[0].status.instanceID}'`

        # get user id
        USER_ID=$(${KEYCLOAK_EXEC} /opt/jboss/keycloak/bin/kcadm.sh get users -r ${OIDC_REALM} -q "username=${OIDC_USERNAME}" | jq -r '.[0].id')
        # set instanceIds array attribute for user
        ${KEYCLOAK_EXEC} /opt/jboss/keycloak/bin/kcadm.sh update users/${USER_ID} -r ${OIDC_REALM} -s 'attributes={"instanceIds":["'"${INSTANCE_ID}"'"],"role":"user"}'


        ;;
    *)
        echo "Invalid action. Available actions are [setup, add-user]"
        exit 1
        ;;
esac
