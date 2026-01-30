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

# Prefer JAVA_TOOL_OPTIONS because the JVM always honors it, regardless of how the entrypoint scripts are wired.
# Keep JVMFLAGS as well for ZooKeeper scripts that may use it.
ZK_JAVA_TOOL_OPTIONS="-XX:-UseContainerSupport -XX:ActiveProcessorCount=1"
ZK_JVMFLAGS="-Xmx512m -Xms512m ${ZK_JAVA_TOOL_OPTIONS} -Djava.awt.headless=true -Dzookeeper.log.dir=/data/logs -Dzookeeper.root.logger=INFO,CONSOLE -Dlog4j.configuration=file:/data/conf/log4j.properties"

# Name of the Pravega zookeeper-operator deployment. Can be overridden; otherwise auto-detected.
ZK_OPERATOR_DEPLOYMENT="${ZK_OPERATOR_DEPLOYMENT:-}"

OPERATOR_WAIT_TIMEOUT=120
STATEFULSET_WAIT_TIMEOUT=180

# Helper function to get elapsed time
get_elapsed() {
    local start_time=$1
    echo $(($(date +%s) - start_time))
}

has_zk_flags_on_sts_template() {
  kubectl -n "${NAMESPACE}" get statefulset "${ZK_STS_NAME}" \
    -o jsonpath='{.spec.template.spec.containers[?(@.name=="'"${ZK_CONTAINER_NAME}"'")].env[?(@.name=="JAVA_TOOL_OPTIONS")].value}{"\n"}' 2>/dev/null \
    | grep -q -- "-XX:-UseContainerSupport"
}

has_zk_flags_on_pod() {
  kubectl -n "${NAMESPACE}" get pod "${ZK_POD_NAME}" \
    -o jsonpath='{.spec.containers[?(@.name=="'"${ZK_CONTAINER_NAME}"'")].env[?(@.name=="JAVA_TOOL_OPTIONS")].value}{"\n"}' 2>/dev/null \
    | grep -q -- "-XX:-UseContainerSupport"
}

detect_zk_operator_deployment() {
  if [ -n "${ZK_OPERATOR_DEPLOYMENT}" ]; then
    return 0
  fi

  # Try the common deployment name first
  if kubectl -n "${NAMESPACE}" get deploy zk-operator-zookeeper-operator > /dev/null 2>&1; then
    ZK_OPERATOR_DEPLOYMENT="zk-operator-zookeeper-operator"
    return 0
  fi

  # Fallback: best-effort name match
  ZK_OPERATOR_DEPLOYMENT=$(kubectl -n "${NAMESPACE}" get deploy -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null \
    | grep -E 'zookeeper-operator|zk-operator' | head -n 1 || true)

  if [ -z "${ZK_OPERATOR_DEPLOYMENT}" ]; then
    echo "ERROR: Could not detect zookeeper-operator deployment in namespace ${NAMESPACE}." >&2
    echo "Hint: run 'kubectl -n ${NAMESPACE} get deploy' and set ZK_OPERATOR_DEPLOYMENT explicitly." >&2
    exit 1
  fi
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

detect_zk_operator_deployment

# The zookeeper-operator reconciles the StatefulSet from the ZookeeperCluster CR.
# In practice, patching the StatefulSet while the operator is running is often reverted immediately.
# Temporarily scale down the operator, patch, restart, then scale it back up.
echo "Scaling down zookeeper-operator (${ZK_OPERATOR_DEPLOYMENT}) to prevent reconciliation..."
kubectl -n "${NAMESPACE}" scale "deployment/${ZK_OPERATOR_DEPLOYMENT}" --replicas=0
kubectl -n "${NAMESPACE}" rollout status "deployment/${ZK_OPERATOR_DEPLOYMENT}" --timeout=60s || true

echo "Patching Zookeeper StatefulSet (${ZK_STS_NAME}) with JVMFLAGS workaround..."
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
                  "name": "JAVA_TOOL_OPTIONS",
                  "value": "'"${ZK_JAVA_TOOL_OPTIONS}"'"
                },
                {
                  "name": "JVMFLAGS",
                  "value": "'"${ZK_JVMFLAGS}"'"
                }
              ]
            }
          ]
        }
      }
    }
  }'

echo "Verifying JAVA_TOOL_OPTIONS is present on StatefulSet template..."
if ! has_zk_flags_on_sts_template; then
  echo "ERROR: JAVA_TOOL_OPTIONS not present on StatefulSet template after patch." >&2
  kubectl -n "${NAMESPACE}" get statefulset "${ZK_STS_NAME}" -o yaml | sed -n '1,220p' >&2 || true
  # Scale operator back up before exiting
  kubectl -n "${NAMESPACE}" scale "deployment/${ZK_OPERATOR_DEPLOYMENT}" --replicas=1 || true
  exit 1
fi


# Delete the pod to apply the patch
kubectl delete pod "${ZK_POD_NAME}" -n "${NAMESPACE}" --ignore-not-found=true --wait=false

# Wait for the StatefulSet to recreate the pod, then for it to become Ready.
POD_WAIT_TIMEOUT=300
POD_WAIT_START=$(date +%s)

while true; do
  ELAPSED=$(get_elapsed ${POD_WAIT_START})
  if [ ${ELAPSED} -ge ${POD_WAIT_TIMEOUT} ]; then
    echo "ERROR: Timed out after ${POD_WAIT_TIMEOUT}s waiting for ${ZK_POD_NAME} to be recreated and become Ready." >&2
    echo "--- StatefulSet status ---" >&2
    kubectl -n "${NAMESPACE}" get sts "${ZK_STS_NAME}" -o wide >&2 || true
    kubectl -n "${NAMESPACE}" describe sts "${ZK_STS_NAME}" | sed -n '1,200p' >&2 || true
    echo "--- Pod list (matching quorum) ---" >&2
    kubectl -n "${NAMESPACE}" get pods -o wide | grep "${ZK_STS_NAME}" >&2 || true
    echo "--- Zookeeper pod describe ---" >&2
    kubectl -n "${NAMESPACE}" describe pod "${ZK_POD_NAME}" >&2 || true
    echo "--- Zookeeper pod logs (tail) ---" >&2
    kubectl -n "${NAMESPACE}" logs "${ZK_POD_NAME}" --tail=120 >&2 || true
    exit 1
  fi

  if kubectl -n "${NAMESPACE}" get pod "${ZK_POD_NAME}" > /dev/null 2>&1; then
    # If the pod was recreated but is missing the flags, don't wait pointlessly.
    if ! has_zk_flags_on_pod; then
      sleep 2
      continue
    fi
    if kubectl -n "${NAMESPACE}" wait --for=condition=Ready "pod/${ZK_POD_NAME}" --timeout=10s > /dev/null 2>&1; then
      break
    fi
  fi

  sleep 2
done

echo "Scaling zookeeper-operator (${ZK_OPERATOR_DEPLOYMENT}) back up..."
kubectl -n "${NAMESPACE}" scale "deployment/${ZK_OPERATOR_DEPLOYMENT}" --replicas=1
kubectl -n "${NAMESPACE}" rollout status "deployment/${ZK_OPERATOR_DEPLOYMENT}" --timeout=120s || true

sleep 3

# In some environments the operator reconciles the StatefulSet back to its original template.
# Detect that and keep the operator scaled down (CI-like runs only) to prevent immediate reverts.
if ! has_zk_flags_on_sts_template; then
  echo "WARN: zookeeper-operator appears to have reverted the StatefulSet template (flags missing)." >&2
  echo "WARN: Re-applying patch and keeping zookeeper-operator scaled down to prevent reverts." >&2
  kubectl -n "${NAMESPACE}" scale "deployment/${ZK_OPERATOR_DEPLOYMENT}" --replicas=0 || true
  kubectl -n "${NAMESPACE}" rollout status "deployment/${ZK_OPERATOR_DEPLOYMENT}" --timeout=60s || true

  kubectl -n "${NAMESPACE}" patch statefulset "${ZK_STS_NAME}" --type='strategic' \
    -p '{
      "spec": {
        "template": {
          "spec": {
            "containers": [
              {
                "name": "'"${ZK_CONTAINER_NAME}"'",
                "env": [
                  {"name": "JAVA_TOOL_OPTIONS", "value": "'"${ZK_JAVA_TOOL_OPTIONS}"'"},
                  {"name": "JVMFLAGS", "value": "'"${ZK_JVMFLAGS}"'"}
                ]
              }
            ]
          }
        }
      }
    }'

  kubectl delete pod "${ZK_POD_NAME}" -n "${NAMESPACE}" --ignore-not-found=true --wait=false
  kubectl -n "${NAMESPACE}" wait --for=condition=Ready "pod/${ZK_POD_NAME}" --timeout=300s || true

  echo "Zookeeper fix applied (operator left scaled down to avoid reverts)." >&2
  exit 0
fi

echo "Zookeeper fix applied successfully."
