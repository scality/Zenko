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

wait_for_endpoint() {
    local host=$1
    local port=$2
    local timeout_s=$3

    kubectl run wait-for-port \
        --image=busybox \
        --attach=True \
        --rm \
        --restart=Never  \
        --pod-running-timeout=5m \
        --image-pull-policy=IfNotPresent \
        --env="HOST=${host}" \
        --env="PORT=${port}" \
        --env="TIMEOUT_S=${timeout_s}" \
        -- sh -c '
wait_for_endpoint() {
    local count=0
    echo "waiting for $HOST:$PORT to be available"
    while ! nc -z -w 1 $HOST "$PORT"; do
        count=$((count + 1))
        [ "$count" -ge "$TIMEOUT_S" ] && echo "Error: timedout waiting for $HOST:$PORT after $TIMEOUT_S seconds" && return 1
        sleep 1
    done
    echo "$HOST:$PORT is now available."
}
wait_for_endpoint
'
}

wait_for_all_pods_behind_services() {
    local service=$1
    local namespace=$2
    local port_regex=$3
    local timeout_s=$4
    kubectl get pods -n $namespace -l app=$service -o jsonpath='{range .items[*]}{.metadata.deletionTimestamp}:{.status.podIP}:{.spec.containers[*].ports[*].containerPort}{"\n"}{end}' | while read -r output; do
        deletion_timestamp=$(echo $output | cut -d':' -f1)
        ip=$(echo $output | cut -d':' -f2)
        ports=$(echo $output | cut -d':' -f3)
        # skip pods that are terminating
        if [ -n "$deletion_timestamp" ] || [ -z "$ip" ] || [ -z "$ports" ]; then
            continue
        fi
        # waiting for all ports that match the port prefix in cases where
        # multiple containers are running within the same pod
        for port in $ports; do
            if [[ $port == $port_regex ]]; then
                wait_for_endpoint $ip $port $timeout_s
            fi
        done
    done
}
