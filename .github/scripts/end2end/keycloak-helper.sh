#! /bin/sh

set -exu

DIR=$(dirname "$0")

COMMAND=${1:-''}
NAMESPACE=${2:-default}

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

        export INSTANCE_ID=`kubectl -n ${NAMESPACE} get zenko -o jsonpath='{.items[0].status.instanceID}'`

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

    *)
        echo "Invalid action. Available actions are [setup, add-user]"
        exit 1
        ;;
esac
