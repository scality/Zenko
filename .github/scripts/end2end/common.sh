get_token() {
    curl -k -H "Host: keycloak.zenko.local" \
        -d "client_id=${OIDC_CLIENT_ID}" \
        -d "username=${OIDC_USERNAME}" \
        -d "password=${OIDC_PASSWORD}" \
        -d "grant_type=password" \
        -d 'scope=openid' \
        https://localhost/auth/realms/${OIDC_REALM}/protocol/openid-connect/token | \
        jq -cr '.id_token'
}

