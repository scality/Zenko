get_token() {
    HOST={$1-keycloak.zenko.local}
    curl -k -H "Host: ${HOST}" \
        -d "client_id=${OIDC_CLIENT_ID}" \
        -d "username=${OIDC_USERNAME}" \
        -d "password=${OIDC_PASSWORD}" \
        -d "grant_type=password" \
        -d 'scope=openid' \
        https://localhost/auth/realms/${OIDC_REALM}/protocol/openid-connect/token | \
        jq -cr '.id_token'
}

