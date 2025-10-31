# This file is a temporary fix. Pravega zookeeper is not
# maintained anymore and is as such not compatible with
# recent Linux kernel versions. Disabling container support
# is not acceptable for production, and only done here
# for the CI.
set -eu

ZENKO_NAME="${1:?Missing ZENKO_NAME argument}"
NAMESPACE="${2:?Missing NAMESPACE argument}"

ZK_STS_NAME="${ZENKO_NAME}-base-quorum"
ZK_CONTAINER_NAME="zookeeper"
ZK_POD_NAME="${ZK_STS_NAME}-0"

OPERATOR_WAIT_TIMEOUT=120
STATEFULSET_WAIT_TIMEOUT=180

# Helper function to get elapsed time
get_elapsed() {
    local start_time=$1
    echo $(($(date +%s) - start_time))
}

# Wait for the Zenko operator to process the CR
OPERATOR_WAIT_START=$(date +%s)

while true; do
    ELAPSED=$(get_elapsed ${OPERATOR_WAIT_START})
    
    if [ ${ELAPSED} -ge ${OPERATOR_WAIT_TIMEOUT} ]; then
        echo "ERROR: Timed out after ${OPERATOR_WAIT_TIMEOUT}s waiting for Zenko operator to process CR."
        kubectl -n "${NAMESPACE}" get zenko/"${ZENKO_NAME}" -o yaml 2>&1 || echo "Could not get Zenko CR."
        kubectl get pods -n operators -l app.kubernetes.io/name=zenko-operator 2>&1 || echo "Could not find operator pods."
        kubectl logs -n operators -l app.kubernetes.io/name=zenko-operator --tail=100 2>&1 || echo "Could not get operator logs."
        exit 1
    fi
    
    if kubectl -n "${NAMESPACE}" get zenko/"${ZENKO_NAME}" -o jsonpath='{.status}' 2>/dev/null | grep -q .; then
        break
    fi
    
    sleep 2
done

# Wait for the Zookeeper StatefulSet to be created
echo "Waiting for Zookeeper StatefulSet (${ZK_STS_NAME}) to be created by operator..."
STATEFULSET_WAIT_START=$(date +%s)

while true; do
    ELAPSED=$(get_elapsed ${STATEFULSET_WAIT_START})
    
    if [ ${ELAPSED} -ge ${STATEFULSET_WAIT_TIMEOUT} ]; then
        echo "ERROR: Timed out after ${STATEFULSET_WAIT_TIMEOUT}s waiting for Zookeeper StatefulSet."
        exit 1
    fi
    
    if kubectl get statefulset "${ZK_STS_NAME}" -n "${NAMESPACE}" > /dev/null 2>&1; then
        break
    fi
    
    sleep 2
done

# Patch the StatefulSet with JVM flags to disable container support
# as ubuntu runners now are incompatible with zookeeper.
kubectl -n "${NAMESPACE}" patch statefulset "${ZK_STS_NAME}" --type='strategic' \
  -p '{
    "spec": {
      "template": {
        "spec": {
          "containers": [
            {
              "name": "'"${ZK_CONTAINER_NAME}"'",
              "env": [
                {
                  "name": "JVMFLAGS",
                  "value": "-Xmx512m -Xms512m -XX:-UseContainerSupport -XX:ActiveProcessorCount=1 -Djava.awt.headless=true -Dzookeeper.log.dir=/data/logs -Dzookeeper.root.logger=INFO,CONSOLE -Dlog4j.configuration=file:/data/conf/log4j.properties"
                }
              ]
            }
          ]
        }
      }
    }
  }'


# Delete the pod to apply the patch
kubectl delete pod "${ZK_POD_NAME}" -n "${NAMESPACE}" --ignore-not-found=true --wait=false

# Wait for the pod to become Ready
if ! kubectl wait --for=condition=Ready "pod/${ZK_POD_NAME}" --timeout=300s -n "${NAMESPACE}"; then
    echo "ERROR: Zookeeper pod ${ZK_POD_NAME} failed to become Ready after patching."
    exit 1
fi

echo "Zookeeper fix applied successfully."
