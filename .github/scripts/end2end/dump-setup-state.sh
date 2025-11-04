#!/bin/bash
set -eu

NAMESPACE="${1:-default}"
ZENKO_NAME="${2:-end2end}"

echo "=================================================="
echo "ZENKO SETUP STATE DUMP"
echo "Namespace: ${NAMESPACE}"
echo "Zenko Name: ${ZENKO_NAME}"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=================================================="
echo ""

echo "=== QUICK SUMMARY ==="
INSTANCE_ID=$(kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o jsonpath='{.status.instanceID}' 2>/dev/null || echo "NONE")
ZENKO_AVAILABLE=$(kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null || echo "UNKNOWN")
NUM_LOCATIONS=$(kubectl get secret -l "app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json 2>/dev/null | \
    jq '.items[0].data."locationConfig.json"' | sed 's/"//g' | base64 -d 2>/dev/null | jq '. | length' || echo "0")
NUM_SORBET_FWDS=$(kubectl get deployment -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" -o json 2>/dev/null | \
    jq '[.items[] | select(.metadata.labels."sorbetd-location" != null)] | length' || echo "0")
NUM_ACCOUNTS=$(kubectl get secrets -n "${NAMESPACE}" -l "type=end2end" -o json 2>/dev/null | jq '.items | length' || echo "0")

echo "Instance ID: ${INSTANCE_ID}"
echo "Zenko Available: ${ZENKO_AVAILABLE}"
echo "Locations configured: ${NUM_LOCATIONS}"
echo "Sorbet forwarders: ${NUM_SORBET_FWDS}"
echo "Test accounts: ${NUM_ACCOUNTS}"
echo ""

echo "=== ZENKO CUSTOM RESOURCE ==="
kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o json | jq '.' || echo "ERROR: Failed to get Zenko CR"
echo ""

echo "=== ZENKO STATUS ==="
kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o json | jq '.status' || echo "ERROR: Failed to get status"
echo ""

echo "=== ZENKO ANNOTATIONS ==="
kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o json | jq '.metadata.annotations' || echo "No annotations"
echo ""

echo "=== INSTANCE ID ==="
echo "${INSTANCE_ID}"
echo ""

echo "=== SORBET CONFIGURATION (from Zenko CR) ==="
kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o json | jq '.spec.sorbet' || echo "No sorbet config"
echo ""

echo "=== CLOUDSERVER CONFIG SECRET ==="
kubectl get secret -l "app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0].data."config.json"' | sed 's/"//g' | base64 -d | jq '.' || echo "ERROR: Failed to get cloudserver config"
echo ""

echo "=== LOCATION CONFIG (from cloudserver config) ==="
kubectl get secret -l "app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0].data."locationConfig.json"' | sed 's/"//g' | base64 -d | jq '.' || echo "ERROR: Failed to get location config"
echo ""

echo "=== BACKBEAT CONFIG ==="
kubectl get secret -l "app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0].data."config.json"' | sed 's/"//g' | base64 -d | jq '.' || echo "ERROR: Failed to get backbeat config"
echo ""

echo "=== SORBET CONFIGS (cold location configs) ==="
for secret in $(kubectl get secrets -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" -o name | grep sorbet-config); do
    echo "--- ${secret} ---"
    kubectl get "${secret}" -n "${NAMESPACE}" -o json | \
        jq '.data."config.json"' | sed 's/"//g' | base64 -d | jq '.' || echo "ERROR: Failed to decode"
    echo ""
done
echo ""

echo "=== SORBET FORWARDER USER CREDENTIALS ==="
kubectl get secret -l "app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, accessKeyId: (.data.accessKey | @base64d)[0:10] + "..."}' || echo "No sorbet-fwd credentials found"
echo ""

echo "=== SERVICE USER CREDENTIALS ==="
for user_type in backbeat-lcbp-user-creds backbeat-lcc-user-creds backbeat-lcop-user-creds backbeat-qp-user-creds; do
    echo "--- ${user_type} ---"
    kubectl get secret -l "app.kubernetes.io/name=${user_type},app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
        jq '.items[0].metadata.name' 2>/dev/null || echo "Not found"
done
echo ""

echo "=== ACCOUNT SECRETS ==="
kubectl get secrets -n "${NAMESPACE}" -l "type=end2end" -o json | \
    jq '.items[] | {name: .metadata.name, accountId: (.data.AccountId | @base64d), accessKeyId: (.data.AccessKeyId | @base64d)[0:10] + "..."}' || echo "No account secrets found"
echo ""

echo "=== KAFKA TOPICS ==="
INSTANCE_ID=$(kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o jsonpath='{.status.instanceID}')
if [ -n "${INSTANCE_ID}" ]; then
    echo "Instance ID: ${INSTANCE_ID}"
    
    KAFKA_IMAGE=$(yq eval ".kafka.sourceRegistry" ../../../solution/deps.yaml)/$(yq eval ".kafka.image" ../../../solution/deps.yaml):$(yq eval ".kafka.tag" ../../../solution/deps.yaml)
    KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance="${ZENKO_NAME}" -n "${NAMESPACE}" \
        -o jsonpath='{.items[0].data.config\.json}' | base64 -d | jq -r '.kafka.hosts')
    
    echo "Listing Kafka topics (grep for ${INSTANCE_ID}):"
    kubectl run kafka-list-topics-dump \
        --image="${KAFKA_IMAGE}" \
        --pod-running-timeout=2m \
        --rm \
        --restart=Never \
        --attach=True \
        --namespace="${NAMESPACE}" \
        --command -- bash -c "kafka-topics.sh --list --bootstrap-server ${KAFKA_HOST_PORT}" 2>/dev/null | grep "${INSTANCE_ID}" || echo "No topics found for instance"
fi
echo ""

echo "=== ZENKO NOTIFICATION TARGETS ==="
kubectl get zenkonotificationtargets -n "${NAMESPACE}" -o json | jq '.items[] | {name: .metadata.name, spec: .spec}' || echo "No notification targets"
echo ""

echo "=== DEPLOYMENTS STATUS ==="
echo "--- Cloudserver ---"
kubectl get deployment -l "app.kubernetes.io/name=connector-cloudserver,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, replicas: .status.replicas, ready: .status.readyReplicas, generation: .status.observedGeneration, annotations: .metadata.annotations}' || echo "Not found"

echo "--- Internal Cloudserver ---"
kubectl get deployment -l "app.kubernetes.io/name=internal-s3api,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, replicas: .status.replicas, ready: .status.readyReplicas}' || echo "Not found"

echo "--- Backbeat Lifecycle Transition Processor ---"
kubectl get deployment -l "app.kubernetes.io/name=backbeat-lifecycle-transition-processor,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, replicas: .status.replicas, ready: .status.readyReplicas}' || echo "Not found"

echo "--- Backbeat Lifecycle Conductor ---"
kubectl get deployment -l "app.kubernetes.io/name=backbeat-lifecycle-conductor,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, replicas: .status.replicas, ready: .status.readyReplicas}' || echo "Not found"

echo "--- Backbeat Lifecycle Bucket Processor ---"
kubectl get deployment -l "app.kubernetes.io/name=backbeat-lifecycle-bucket-processor,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, replicas: .status.replicas, ready: .status.readyReplicas}' || echo "Not found"

echo "--- ALL Sorbet Forwarder Deployments ---"
kubectl get deployment -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" -o json | \
    jq '.items[] | select(.metadata.labels."sorbetd-location" != null) | {name: .metadata.name, location: .metadata.labels."sorbetd-location", replicas: .status.replicas, ready: .status.readyReplicas}' || echo "No sorbet forwarders found"

echo "--- Mock Sorbet ---"
kubectl get deployment mock-sorbet -n "${NAMESPACE}" -o json | \
    jq '{name: .metadata.name, replicas: .status.replicas, ready: .status.readyReplicas}' 2>/dev/null || echo "Not found"

echo "--- Mock Miria ---"
kubectl get deployment mock-miria -n "${NAMESPACE}" -o json | \
    jq '{name: .metadata.name, replicas: .status.replicas, ready: .status.readyReplicas}' 2>/dev/null || echo "Not found"
echo ""

echo "=== PODS STATUS ==="
echo "All pods (sorbet and backbeat lifecycle):"
kubectl get pods -n "${NAMESPACE}" --no-headers | grep -E "(sorbet|backbeat-lifecycle)" || echo "No sorbet/backbeat pods found"
echo ""
echo "Failing/Crashing pods in namespace:"
kubectl get pods -n "${NAMESPACE}" --field-selector=status.phase!=Running,status.phase!=Succeeded -o json | \
    jq '.items[] | {name: .metadata.name, phase: .status.phase, reason: .status.reason, containers: [.status.containerStatuses[]? | {name: .name, ready: .ready, restartCount: .restartCount, state: .state}]}' || echo "No failing pods"
echo ""

echo "=== DMF VOLUME CHECK (via mock-sorbet pod) ==="
if kubectl get deployment mock-sorbet -n "${NAMESPACE}" >/dev/null 2>&1; then
    SORBET_POD=$(kubectl get pods -n "${NAMESPACE}" -l "sorbetd-name=mock-sorbet" -o jsonpath='{.items[0].metadata.name}')
    if [ -n "${SORBET_POD}" ]; then
        echo "Sorbet pod: ${SORBET_POD}"
        echo "Files in /data:"
        kubectl exec -n "${NAMESPACE}" "${SORBET_POD}" -- find /data -type f 2>/dev/null | head -20 || echo "ERROR: Cannot access sorbet pod"
        echo "File count in /data:"
        kubectl exec -n "${NAMESPACE}" "${SORBET_POD}" -- sh -c 'find /data -type f | wc -l' 2>/dev/null || echo "ERROR"
    else
        echo "ERROR: No mock-sorbet pod found"
    fi
else
    echo "mock-sorbet deployment not found"
fi
echo ""

echo "=== HOST VOLUME CHECK (via hostPath) ==="
echo "Attempting to check /data/sorbet-data-0 via ephemeral pod..."
kubectl run diagnostic-volume-check \
    --image=alpine:3.22 \
    --restart=Never \
    --rm \
    --attach=True \
    --pod-running-timeout=1m \
    --namespace="${NAMESPACE}" \
    --overrides='
{
  "spec": {
    "containers": [{
      "name": "diagnostic",
      "image": "alpine:3.22",
      "command": ["/bin/sh", "-c"],
      "args": ["echo Files in /cold-data: && find /cold-data -type f | wc -l && find /cold-data -type f | head -10"],
      "volumeMounts": [{
        "name": "volume",
        "mountPath": "/cold-data"
      }]
    }],
    "volumes": [{
      "name": "volume",
      "hostPath": {
        "path": "/data/sorbet-data-0",
        "type": "DirectoryOrCreate"
      }
    }]
  }
}' 2>&1 || echo "Failed to check host volume"
echo ""

echo "=== PVC STATUS ==="
kubectl get pvc -n "${NAMESPACE}" -o json | jq '.items[] | {name: .metadata.name, status: .status.phase, capacity: .status.capacity.storage, storageClass: .spec.storageClassName}' || echo "No PVCs"
echo ""

echo "=== PV BACKING sorbet-data ==="
kubectl get pv -o json | jq '.items[] | select(.spec.claimRef.name == "sorbet-data") | {name: .metadata.name, hostPath: .spec.hostPath, capacity: .spec.capacity.storage, accessModes: .spec.accessModes}' || echo "No PV for sorbet-data"
echo ""

echo "=== MONGO DB CONFIG ==="
kubectl get zenko "${ZENKO_NAME}" -n "${NAMESPACE}" -o json | jq '.spec.mongodb' || echo "No mongodb config"
echo ""

echo "=== SERVICE ENDPOINTS READY CHECK ==="
for svc in "${ZENKO_NAME}-connector-s3api" "${ZENKO_NAME}-connector-vault-auth-api" "mock-sorbet"; do
    echo "--- ${svc} ---"
    kubectl get endpoints "${svc}" -n "${NAMESPACE}" -o json 2>/dev/null | jq '{addresses: [.subsets[].addresses[].ip]}' || echo "Service not found"
done
echo ""

echo "=== KAFKA CONSUMER GROUPS ==="
if [ -n "${INSTANCE_ID}" ]; then
    KAFKA_POD=$(kubectl get pods -n "${NAMESPACE}" -l "brokerId=0,app=kafka" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "${KAFKA_POD}" ]; then
        echo "Kafka pod: ${KAFKA_POD}"
        echo "Consumer groups for this instance:"
        kubectl exec -n "${NAMESPACE}" "${KAFKA_POD}" -- bash -lc "export KAFKA_OPTS='' && kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list" 2>/dev/null | grep "${INSTANCE_ID}" || echo "No consumer groups found"
    else
        echo "Kafka pod not found"
    fi
fi
echo ""

echo "=== BACKBEAT EXTENSIONS (from config) ==="
kubectl get secret -l "app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0].data."config.json"' | sed 's/"//g' | base64 -d | jq '.extensions | keys' || echo "ERROR: Failed to get extensions"
echo ""

echo "=== SECRET RESOURCE VERSIONS ==="
echo "connector-cloudserver-config:"
kubectl get secret -l "app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, resourceVersion: .metadata.resourceVersion, creationTimestamp: .metadata.creationTimestamp}'
echo "backbeat-config:"
kubectl get secret -l "app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${ZENKO_NAME}" -n "${NAMESPACE}" -o json | \
    jq '.items[0] | {name: .metadata.name, resourceVersion: .metadata.resourceVersion, creationTimestamp: .metadata.creationTimestamp}'
echo ""

echo "=== RECENT POD LOGS (last 30 lines each) ==="
echo "--- Sorbet Forwarder for e2e-cold (if exists) ---"
SORBET_FWD_POD=$(kubectl get pods -n "${NAMESPACE}" -l "sorbetd-location=e2e-cold,app.kubernetes.io/instance=${ZENKO_NAME}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "${SORBET_FWD_POD}" ]; then
    kubectl logs -n "${NAMESPACE}" "${SORBET_FWD_POD}" --tail=30 2>/dev/null || echo "Cannot get logs"
else
    echo "No sorbet-forwarder pod for e2e-cold"
fi
echo ""

echo "--- Mock Sorbet ---"
MOCK_SORBET_POD=$(kubectl get pods -n "${NAMESPACE}" -l "sorbetd-name=mock-sorbet" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "${MOCK_SORBET_POD}" ]; then
    kubectl logs -n "${NAMESPACE}" "${MOCK_SORBET_POD}" --tail=30 2>/dev/null || echo "Cannot get logs"
else
    echo "No mock-sorbet pod"
fi
echo ""

echo "--- Backbeat Lifecycle Transition Processor ---"
LTP_POD=$(kubectl get pods -n "${NAMESPACE}" -l "app.kubernetes.io/name=backbeat-lifecycle-transition-processor,app.kubernetes.io/instance=${ZENKO_NAME}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "${LTP_POD}" ]; then
    kubectl logs -n "${NAMESPACE}" "${LTP_POD}" --tail=30 2>/dev/null || echo "Cannot get logs"
else
    echo "No lifecycle transition processor pod"
fi
echo ""

echo "=== CONFIGMAPS ==="
echo "Sorbet-related ConfigMaps:"
kubectl get configmaps -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" -o json | \
    jq '.items[] | select(.metadata.name | contains("sorbet")) | {name: .metadata.name, keys: (.data | keys)}' || echo "No sorbet configmaps"
echo ""

echo "=== RECENT EVENTS (last 50) ==="
kubectl get events -n "${NAMESPACE}" --sort-by='.lastTimestamp' | tail -50 || echo "No events"
echo ""

echo "=================================================="
echo "END OF DUMP"
echo "=================================================="

