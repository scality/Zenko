#!/usr/bin/env bash
#
# Fix Zookeeper StatefulSet memory issues
#
# This script waits for the Zenko operator to create the Zookeeper StatefulSet,
# then patches it with proper JVM flags to prevent memory issues on newer
# Ubuntu GHA runners.
#

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

# Step 1: Wait for operator to acknowledge and start processing the CR
echo "Waiting for Zenko operator to start processing CR (${ZENKO_NAME})..."
OPERATOR_WAIT_START=$(date +%s)

while true; do
    ELAPSED=$(get_elapsed ${OPERATOR_WAIT_START})
    
    if [ ${ELAPSED} -ge ${OPERATOR_WAIT_TIMEOUT} ]; then
        echo "ERROR: Timed out after ${OPERATOR_WAIT_TIMEOUT}s waiting for Zenko operator to process CR."
        echo ""
        echo "=== Diagnostic Information ==="
        echo "--- Zenko CR Status ---"
        kubectl -n "${NAMESPACE}" get zenko/"${ZENKO_NAME}" -o yaml 2>&1 || echo "Could not get Zenko CR."
        echo ""
        echo "--- Operator Pods ---"
        kubectl get pods -n operators -l app.kubernetes.io/name=zenko-operator 2>&1 || echo "Could not find operator pods."
        echo ""
        echo "--- Recent Operator Logs ---"
        kubectl logs -n operators -l app.kubernetes.io/name=zenko-operator --tail=100 2>&1 || echo "Could not get operator logs."
        exit 1
    fi
    
    # Check if CR has a status field (indicates operator has started processing)
    if kubectl -n "${NAMESPACE}" get zenko/"${ZENKO_NAME}" -o jsonpath='{.status}' 2>/dev/null | grep -q .; then
        echo "✓ Zenko operator acknowledged CR (elapsed: ${ELAPSED}s)"
        break
    fi
    
    if [ $((ELAPSED % 10)) -eq 0 ] && [ ${ELAPSED} -gt 0 ]; then
        echo "  Waiting for operator to acknowledge CR... (${ELAPSED}s/${OPERATOR_WAIT_TIMEOUT}s)"
    fi
    
    sleep 2
done

# Step 2: Wait for the Zookeeper StatefulSet to be created
echo "Waiting for Zookeeper StatefulSet (${ZK_STS_NAME}) to be created by operator..."
STATEFULSET_WAIT_START=$(date +%s)

while true; do
    ELAPSED=$(get_elapsed ${STATEFULSET_WAIT_START})
    
    if [ ${ELAPSED} -ge ${STATEFULSET_WAIT_TIMEOUT} ]; then
        echo "ERROR: Timed out after ${STATEFULSET_WAIT_TIMEOUT}s waiting for Zookeeper StatefulSet."
        echo ""
        echo "=== Diagnostic Information ==="
        echo "--- Zenko CR Status ---"
        kubectl -n "${NAMESPACE}" get zenko/"${ZENKO_NAME}" -o yaml 2>&1 || echo "Could not get Zenko CR."
        echo ""
        echo "--- StatefulSets in namespace ${NAMESPACE} ---"
        kubectl -n "${NAMESPACE}" get statefulsets 2>&1 || echo "Could not list StatefulSets."
        echo ""
        echo "--- All Pods in namespace ${NAMESPACE} ---"
        kubectl -n "${NAMESPACE}" get pods 2>&1 || echo "Could not list pods."
        echo ""
        echo "--- Operator Logs ---"
        kubectl logs -n operators -l app.kubernetes.io/name=zenko-operator --tail=100 2>&1 || echo "Could not get operator logs."
        exit 1
    fi
    
    if kubectl get statefulset "${ZK_STS_NAME}" -n "${NAMESPACE}" > /dev/null 2>&1; then
        echo "✓ Zookeeper StatefulSet ${ZK_STS_NAME} found (elapsed: ${ELAPSED}s)"
        break
    fi
    
    if [ $((ELAPSED % 10)) -eq 0 ] && [ ${ELAPSED} -gt 0 ]; then
        echo "  Waiting for StatefulSet... (${ELAPSED}s/${STATEFULSET_WAIT_TIMEOUT}s)"
    fi
    
    sleep 2
done

# Step 3: Patch the StatefulSet with proper JVM flags
echo "Patching Zookeeper StatefulSet (${ZK_STS_NAME}) template to add JVMFLAGS..."
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

echo "✓ StatefulSet patched successfully"

# Step 4: Delete the pod to apply the patch
echo "Deleting Zookeeper pod (${ZK_POD_NAME}) to apply patch..."
kubectl delete pod "${ZK_POD_NAME}" -n "${NAMESPACE}" --ignore-not-found=true --wait=false

# Step 5: Wait for the pod to become Ready
echo "Waiting for Zookeeper pod (${ZK_POD_NAME}) to become Ready..."
if ! kubectl wait --for=condition=Ready "pod/${ZK_POD_NAME}" --timeout=300s -n "${NAMESPACE}"; then
    echo "ERROR: Zookeeper pod ${ZK_POD_NAME} failed to become Ready after patching."
    echo ""
    echo "=== Diagnostic Information ==="
    echo "--- Pod Logs ---"
    kubectl logs "pod/${ZK_POD_NAME}" -n "${NAMESPACE}" --tail=100 2>&1 || echo "Could not get logs for ${ZK_POD_NAME}."
    echo ""
    echo "--- Pod Description ---"
    kubectl describe pod "${ZK_POD_NAME}" -n "${NAMESPACE}" 2>&1 || echo "Could not describe pod ${ZK_POD_NAME}."
    exit 1
fi

echo "✓ Zookeeper pod ${ZK_POD_NAME} is Ready"
echo "Zookeeper fix applied successfully."

