export DR_SINK_NAME=${DR_SINK_NAME:-'end2end-pra-dr-sink'}
export DR_SOURCE_NAME=${DR_SOURCE_NAME:-'end2end-dr-source'}
export NAMESPACE=${NAMESPACE:-'default'}

cat configs/zenko_dr_sink.yaml | envsubst | kubectl apply -f -

k_cmd="kubectl -n ${NAMESPACE} get zenkodrsink/${DR_SINK_NAME}"
for i in $(seq 1 120); do
    conditions=$($k_cmd -o "jsonpath={.status.conditions}")
    if kubectl wait --for condition=Available --timeout 5s --namespace ${NAMESPACE} zenkodrsink/${DR_SINK_NAME}; then
        break;
    fi
done


cat configs/zenko_dr_source.yaml | envsubst | kubectl apply -f -

k_cmd="kubectl -n ${NAMESPACE} get zenkodrsource/${DR_SOURCE_NAME}"
for i in $(seq 1 120); do
    conditions=$($k_cmd -o "jsonpath={.status.conditions}")
    if kubectl wait --for condition=Available --timeout 5s --namespace ${NAMESPACE} zenkodrsource/${DR_SOURCE_NAME}; then
        break;
    fi
done
