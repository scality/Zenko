get_token() {
    curl -k -H "Host: keycloak.zenko.local" \
        -d "client_id=${OIDC_CLIENT_ID}" \
        -d "username=${OIDC_USERNAME}" \
        -d "password=${OIDC_PASSWORD}" \
        -d "grant_type=password" \
        -d "scope=openid" \
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

# wait for consumer group to be in a stable state (no rebance + at least one consumer connected)
wait_for_consumer_group() {
    namespace=$1
    # Getting the name of the first kafka pod
    kafka_pod=$(kubectl get pods -n $namespace -l brokerId=0,kafka_cr=end2end-base-queue,app=kafka -o jsonpath='{.items[0].metadata.name}')
    consumer_group=$2
    # When a pod is restarted the previous consumer is kept in the group until the session timeout expires
    expected_members=$3
    timeout_s=$4
    interval_s=${5:-5}
    kubectl exec -it $kafka_pod -n $namespace -- bash -c '
export KAFKA_OPTS=
consumer_group=$1
expected_members=$2
timeout_s=$3
interval_s=$4
start_time=$(date +%s)
while true; do
    # The state becomes "Stable" when no rebalance is happening and at least one consumer is connected
    state=$(kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group $consumer_group --state | awk '"'"'NF>1 && $(NF-1) != "STATE" {print (NF>1?$(NF-1):"None")} {next}'"'"')
    members=$(kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group $consumer_group --state | awk '"'"'NF>1 && $NF != "#MEMBERS" {print (NF>1?$NF:"None")} {next}'"'"')
    echo "Consumer group $consumer_group state: $state, members: $members"
    if [ "$state" == "Stable" ] && [ "$members" -eq "$expected_members" ]; then
        echo "Consumer group $consumer_group is now consuming."
        exit 0
    fi
    # Check if we have reached the timeout
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))
    if [ "$elapsed_time" -ge "$timeout_s" ]; then
        echo "Error: Timed out waiting for consumer group $consumer_group to start consuming."
        exit 1
    fi
    sleep $interval_s
done
' -- "$consumer_group" "$expected_members" "$timeout_s" "$interval_s"
}
