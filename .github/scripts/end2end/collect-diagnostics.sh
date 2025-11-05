#!/bin/bash
# Comprehensive diagnostic collection script for Kubernetes clusters
# Collects host and cluster information even if tests fail

# Note: Not using 'set -e' - we want to continue even if individual commands fail
# This ensures we collect as much diagnostic data as possible
set -o pipefail

# Safe command wrapper - ensures commands don't crash the script
safe_run() {
    "$@" || {
        local exit_code=$?
        echo "Command failed with exit code ${exit_code}: $*" >&2
        return 0  # Always return success to continue script
    }
}

# Configuration
NAMESPACE="${NAMESPACE:-default}"
INSTANCE_ID="${INSTANCE_ID:-end2end}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-${HOME}/.kube/config}"
OUTPUT_DIR="${OUTPUT_DIR:-diagnostics-$(date +%Y%m%d-%H%M%S)}"

echo "=========================================="
echo "Starting Comprehensive Diagnostic Collection"
echo "Timestamp: $(date -Iseconds)"
echo "Output Directory: ${OUTPUT_DIR}"
echo "Kubeconfig: ${KUBECONFIG_FILE}"
echo "=========================================="

# Verify kubeconfig exists
if [ ! -f "${KUBECONFIG_FILE}" ]; then
    echo "ERROR: Kubeconfig file not found: ${KUBECONFIG_FILE}"
    echo "Please set KUBECONFIG_FILE environment variable to a valid kubeconfig path"
    echo "Skipping Kubernetes diagnostics, will only collect host information"
    SKIP_KUBERNETES=true
else
    SKIP_KUBERNETES=false
    echo "✓ Kubeconfig file found"
fi
echo ""

# Create output directories (must succeed or there's no point continuing)
mkdir -p "${OUTPUT_DIR}"/{host,kubernetes,applications,logs,metrics} || {
    echo "FATAL: Cannot create output directories in ${OUTPUT_DIR}"
    exit 1
}

# ==============================================================================
# HOST DIAGNOSTICS
# ==============================================================================
echo ""
echo "=== Collecting Host Diagnostics ==="

# System information
{
    echo "=== System Information ==="
    echo "Hostname: $(hostname)"
    echo "Kernel: $(uname -a)"
    echo "OS: $(cat /etc/os-release 2>/dev/null || echo 'N/A')"
    echo "Uptime: $(uptime)"
    echo ""
} > "${OUTPUT_DIR}/host/system_info.txt"

# CPU information
{
    echo "=== CPU Information ==="
    if command -v lscpu &> /dev/null; then
        lscpu 2>/dev/null || echo "lscpu failed"
    else
        cat /proc/cpuinfo 2>/dev/null | head -50 || echo "CPU info not available"
    fi
    echo ""
    echo "=== CPU Usage ==="
    if command -v top &> /dev/null; then
        top -bn1 2>/dev/null | head -20 || echo "top command failed"
    else
        echo "top command not available"
    fi
    echo ""
    echo "=== Load Average ==="
    cat /proc/loadavg 2>/dev/null || echo "Load average not available"
    echo ""
} > "${OUTPUT_DIR}/host/cpu_info.txt" 2>&1

# Memory information
{
    echo "=== Memory Information ==="
    if command -v free &> /dev/null; then
        free -h 2>/dev/null || echo "free command failed"
    else
        echo "free command not available"
    fi
    echo ""
    echo "=== Detailed Memory ==="
    cat /proc/meminfo 2>/dev/null || echo "meminfo not accessible"
    echo ""
    echo "=== Memory Top Consumers ==="
    if command -v ps &> /dev/null; then
        ps aux --sort=-%mem 2>/dev/null | head -20 || ps aux 2>/dev/null | head -20 || echo "ps command failed"
    else
        echo "ps command not available"
    fi
    echo ""
} > "${OUTPUT_DIR}/host/memory_info.txt" 2>&1

# Disk information
{
    echo "=== Disk Usage ==="
    df -h 2>/dev/null || echo "df command not available"
    echo ""
    echo "=== Disk I/O Stats ==="
    if command -v iostat &> /dev/null; then
        iostat -x 1 3 2>/dev/null || echo "iostat failed"
    else
        echo "iostat not available"
    fi
    echo ""
    echo "=== Mount Points ==="
    if mount 2>/dev/null | column -t 2>/dev/null; then
        echo "Mount points captured"
    else
        mount 2>/dev/null || echo "mount command not available"
    fi
    echo ""
    echo "=== Inode Usage ==="
    df -i 2>/dev/null || echo "df -i not available"
    echo ""
} > "${OUTPUT_DIR}/host/disk_info.txt" 2>&1

# Network information
{
    echo "=== Network Interfaces ==="
    if command -v ip &> /dev/null; then
        ip addr show 2>/dev/null || echo "ip addr failed"
    else
        ifconfig 2>/dev/null || echo "Network interface commands not available"
    fi
    echo ""
    echo "=== Network Statistics ==="
    if command -v netstat &> /dev/null; then
        netstat -s 2>/dev/null || echo "netstat failed"
    elif command -v ss &> /dev/null; then
        ss -s 2>/dev/null || echo "ss failed"
    else
        echo "Network statistics tools not available"
    fi
    echo ""
    echo "=== Active Connections ==="
    if command -v netstat &> /dev/null; then
        netstat -tulpn 2>/dev/null || netstat -tuln 2>/dev/null || echo "netstat failed"
    elif command -v ss &> /dev/null; then
        ss -tulpn 2>/dev/null || ss -tuln 2>/dev/null || echo "ss failed"
    else
        echo "Connection listing tools not available"
    fi
    echo ""
    echo "=== Routing Table ==="
    if command -v ip &> /dev/null; then
        ip route show 2>/dev/null || echo "ip route failed"
    else
        route -n 2>/dev/null || echo "Routing table not available"
    fi
    echo ""
    echo "=== DNS Configuration ==="
    cat /etc/resolv.conf 2>/dev/null || echo "resolv.conf not accessible"
    echo ""
} > "${OUTPUT_DIR}/host/network_info.txt" 2>&1

# Process information
{
    echo "=== Top Processes by CPU ==="
    if command -v ps &> /dev/null; then
        ps aux --sort=-%cpu 2>/dev/null | head -30 || ps aux 2>/dev/null | head -30 || echo "ps command failed"
    else
        echo "ps command not available"
    fi
    echo ""
    echo "=== Top Processes by Memory ==="
    if command -v ps &> /dev/null; then
        ps aux --sort=-%mem 2>/dev/null | head -30 || ps aux 2>/dev/null | head -30 || echo "ps command failed"
    else
        echo "ps command not available"
    fi
    echo ""
    echo "=== Process Tree ==="
    if command -v pstree &> /dev/null; then
        pstree -p 2>/dev/null || echo "pstree failed"
    elif command -v ps &> /dev/null; then
        ps auxf 2>/dev/null || ps aux 2>/dev/null || echo "ps command failed"
    else
        echo "Process tree commands not available"
    fi
    echo ""
} > "${OUTPUT_DIR}/host/process_info.txt" 2>&1

# Docker/containerd information (may require permissions)
{
    echo "=== Docker Info ==="
    if command -v docker &> /dev/null; then
        docker info 2>/dev/null || echo "Docker not accessible (insufficient permissions or not running)"
    else
        echo "Docker not available"
    fi
    echo ""
    echo "=== Docker Stats ==="
    if command -v docker &> /dev/null; then
        timeout 5 docker stats --no-stream 2>/dev/null || echo "Docker stats not accessible"
    else
        echo "Docker not available"
    fi
    echo ""
    echo "=== Containerd Info ==="
    if command -v ctr &> /dev/null; then
        ctr version 2>/dev/null || echo "containerd not accessible (insufficient permissions)"
    else
        echo "containerd not available"
    fi
    echo ""
} > "${OUTPUT_DIR}/host/container_runtime.txt" 2>&1

# Kernel and system logs (may require elevated permissions)
{
    echo "=== Recent Kernel Messages (last 200 lines) ==="
    if dmesg 2>/dev/null | tail -200; then
        echo "Kernel messages captured"
    else
        echo "Unable to read kernel messages (insufficient permissions or not available)"
    fi
    echo ""
} > "${OUTPUT_DIR}/host/dmesg.txt" 2>&1

# Systemd journal for kubelet (may not be available in containers)
{
    echo "=== Kubelet Logs (last 500 lines) ==="
    if journalctl -u kubelet -n 500 --no-pager 2>/dev/null; then
        echo "Kubelet logs captured"
    else
        echo "Kubelet logs not available (may not be running in systemd environment)"
    fi
    echo ""
} > "${OUTPUT_DIR}/host/kubelet_logs.txt" 2>&1

# ==============================================================================
# KUBERNETES CLUSTER DIAGNOSTICS
# ==============================================================================
echo ""
echo "=== Collecting Kubernetes Cluster Diagnostics ==="

if [ "${SKIP_KUBERNETES}" = "true" ]; then
    echo "Skipping Kubernetes diagnostics (kubeconfig not available)"
    echo "Kubernetes diagnostics skipped: kubeconfig file not found at ${KUBECONFIG_FILE}" > "${OUTPUT_DIR}/kubernetes/SKIPPED.txt"
    # Skip to the summary section
else
    echo "✓ Starting Kubernetes diagnostics collection"
fi

# Only proceed with Kubernetes diagnostics if kubeconfig is available
if [ "${SKIP_KUBERNETES}" = "false" ]; then

# Cluster information
{
    echo "=== Cluster Info ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" cluster-info
    echo ""
    echo "=== API Server Version ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" version
    echo ""
} > "${OUTPUT_DIR}/kubernetes/cluster_info.txt"

# Node information
{
    echo "=== Nodes Summary ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get nodes -o wide
    echo ""
    echo "=== Node Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe nodes
    echo ""
} > "${OUTPUT_DIR}/kubernetes/nodes.txt"

# Node resource usage
{
    echo "=== Node Resource Usage ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" top nodes 2>/dev/null || echo "Metrics not available (metrics-server may not be installed)"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/node_metrics.txt"

# Namespaces
{
    echo "=== All Namespaces ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get namespaces
    echo ""
} > "${OUTPUT_DIR}/kubernetes/namespaces.txt"

# Pods in target namespace
{
    echo "=== Pods in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -o wide
    echo ""
    echo "=== Pod Resource Usage ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" top pods -n "${NAMESPACE}" --containers 2>/dev/null || echo "Metrics not available"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/pods_${NAMESPACE}.txt"

# All pods across cluster
{
    echo "=== All Pods Across Cluster ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods --all-namespaces -o wide
    echo ""
} > "${OUTPUT_DIR}/kubernetes/all_pods.txt"

# Pod details and descriptions
{
    echo "=== Detailed Pod Descriptions in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe pods -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/pod_descriptions.txt"

# Services
{
    echo "=== Services in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get svc -n "${NAMESPACE}" -o wide
    echo ""
    echo "=== Service Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe svc -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/services.txt"

# Endpoints
{
    echo "=== Endpoints in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get endpoints -n "${NAMESPACE}"
    echo ""
    echo "=== Endpoint Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe endpoints -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/endpoints.txt"

# Deployments
{
    echo "=== Deployments in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get deployments -n "${NAMESPACE}" -o wide
    echo ""
    echo "=== Deployment Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe deployments -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/deployments.txt"

# StatefulSets
{
    echo "=== StatefulSets in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get statefulsets -n "${NAMESPACE}" -o wide
    echo ""
    echo "=== StatefulSet Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe statefulsets -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/statefulsets.txt"

# DaemonSets
{
    echo "=== DaemonSets in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get daemonsets -n "${NAMESPACE}" -o wide
    echo ""
} > "${OUTPUT_DIR}/kubernetes/daemonsets.txt"

# Jobs
{
    echo "=== Jobs in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get jobs -n "${NAMESPACE}" -o wide
    echo ""
    echo "=== Job Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe jobs -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/jobs.txt"

# ConfigMaps
{
    echo "=== ConfigMaps in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get configmaps -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/configmaps.txt"

# Secrets (names only, not content)
{
    echo "=== Secrets in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get secrets -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/secrets.txt"

# PersistentVolumes and PersistentVolumeClaims
{
    echo "=== PersistentVolumes ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pv -o wide
    echo ""
    echo "=== PersistentVolume Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe pv
    echo ""
    echo "=== PersistentVolumeClaims in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pvc -n "${NAMESPACE}" -o wide
    echo ""
    echo "=== PersistentVolumeClaim Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe pvc -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/storage.txt"

# Events
{
    echo "=== Recent Events in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get events -n "${NAMESPACE}" --sort-by='.lastTimestamp'
    echo ""
    echo "=== All Recent Events (Cluster-wide) ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get events --all-namespaces --sort-by='.lastTimestamp' | tail -500
    echo ""
} > "${OUTPUT_DIR}/kubernetes/events.txt"

# Custom Resources
{
    echo "=== Zenko Custom Resources ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get zenko -n "${NAMESPACE}" -o yaml 2>/dev/null || echo "No Zenko CRs found"
    echo ""
    echo "=== Zenko Custom Resource Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe zenko -n "${NAMESPACE}" 2>/dev/null || echo "No Zenko CRs found"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/zenko_cr.txt"

# Ingresses
{
    echo "=== Ingresses in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get ingress -n "${NAMESPACE}" -o wide
    echo ""
    echo "=== Ingress Details ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" describe ingress -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/ingresses.txt"

# Network Policies
{
    echo "=== Network Policies in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get networkpolicies -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/network_policies.txt"

# Resource Quotas and Limit Ranges
{
    echo "=== Resource Quotas in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get resourcequotas -n "${NAMESPACE}"
    echo ""
    echo "=== Limit Ranges in ${NAMESPACE} ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get limitranges -n "${NAMESPACE}"
    echo ""
} > "${OUTPUT_DIR}/kubernetes/resource_limits.txt"

# ==============================================================================
# APPLICATION-SPECIFIC DIAGNOSTICS (ZENKO)
# ==============================================================================
echo ""
echo "=== Collecting Application-Specific Diagnostics ==="

# Zenko instance status
if kubectl --kubeconfig "${KUBECONFIG_FILE}" get zenko "${INSTANCE_ID}" -n "${NAMESPACE}" &>/dev/null; then
    {
        echo "=== Zenko Instance Status ==="
        kubectl --kubeconfig "${KUBECONFIG_FILE}" get zenko "${INSTANCE_ID}" -n "${NAMESPACE}" -o yaml
        echo ""
    } > "${OUTPUT_DIR}/applications/zenko_instance.yaml"
fi

# Kafka information
{
    echo "=== Kafka Pods ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -l app=kafka -o wide
    echo ""
    
    KAFKA_POD=$(kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -l "brokerId=0,app=kafka" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "${KAFKA_POD}" ]; then
        echo "=== Kafka Topics ==="
        kubectl --kubeconfig "${KUBECONFIG_FILE}" exec -n "${NAMESPACE}" "${KAFKA_POD}" -- bash -lc "export KAFKA_OPTS='' && kafka-topics.sh --bootstrap-server localhost:9092 --list" 2>/dev/null || echo "Failed to list Kafka topics"
        echo ""
        
        echo "=== Kafka Consumer Groups ==="
        kubectl --kubeconfig "${KUBECONFIG_FILE}" exec -n "${NAMESPACE}" "${KAFKA_POD}" -- bash -lc "export KAFKA_OPTS='' && kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list" 2>/dev/null || echo "Failed to list consumer groups"
        echo ""
    fi
} > "${OUTPUT_DIR}/applications/kafka_info.txt"

# MongoDB information
{
    echo "=== MongoDB Pods ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=mongodb-sharded -o wide
    echo ""
    
    MONGO_POD=$(kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=mongodb-sharded,app.kubernetes.io/component=mongos -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "${MONGO_POD}" ]; then
        echo "=== MongoDB Server Status ==="
        kubectl --kubeconfig "${KUBECONFIG_FILE}" exec -n "${NAMESPACE}" "${MONGO_POD}" -- mongosh --quiet --eval "db.serverStatus()" 2>/dev/null || echo "Failed to get MongoDB status"
        echo ""
        
        echo "=== MongoDB Databases ==="
        kubectl --kubeconfig "${KUBECONFIG_FILE}" exec -n "${NAMESPACE}" "${MONGO_POD}" -- mongosh --quiet --eval "db.adminCommand('listDatabases')" 2>/dev/null || echo "Failed to list databases"
        echo ""
    fi
} > "${OUTPUT_DIR}/applications/mongodb_info.txt"

# Backbeat information
{
    echo "=== Backbeat Pods ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=backbeat -o wide
    echo ""
} > "${OUTPUT_DIR}/applications/backbeat_info.txt"

# Cloudserver/S3 API information
{
    echo "=== S3 API Pods ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=connector-cloudserver -o wide
    echo ""
} > "${OUTPUT_DIR}/applications/s3api_info.txt"

# Sorbet (cold storage) information
{
    echo "=== Sorbet Pods ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" | grep -i sorbet
    echo ""
    
    echo "=== Cold Storage PVC Status ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pvc -n "${NAMESPACE}" | grep -i sorbet
    echo ""
} > "${OUTPUT_DIR}/applications/sorbet_info.txt"

# ==============================================================================
# POD LOGS COLLECTION
# ==============================================================================
echo ""
echo "=== Collecting Pod Logs ==="

# Collect logs from all pods in namespace
for pod in $(kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -o jsonpath='{.items[*].metadata.name}'); do
    echo "Collecting logs for pod: ${pod}"
    
    # Current logs
    kubectl --kubeconfig "${KUBECONFIG_FILE}" logs "${pod}" -n "${NAMESPACE}" --all-containers=true --tail=500 > "${OUTPUT_DIR}/logs/${pod}_current.log" 2>&1 || echo "Failed to get current logs"
    
    # Previous logs (if pod restarted)
    kubectl --kubeconfig "${KUBECONFIG_FILE}" logs "${pod}" -n "${NAMESPACE}" --previous --all-containers=true --tail=500 > "${OUTPUT_DIR}/logs/${pod}_previous.log" 2>&1 || true
done

# Collect logs from specific critical components with more lines
echo "Collecting extended logs for critical components..."

# Backbeat lifecycle logs
for pod in $(kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -l app=backbeat-lifecycle-transition -o jsonpath='{.items[*].metadata.name}' 2>/dev/null); do
    kubectl --kubeconfig "${KUBECONFIG_FILE}" logs "${pod}" -n "${NAMESPACE}" --tail=1000 > "${OUTPUT_DIR}/logs/extended_${pod}.log" 2>&1 || true
done

# Sorbet forwarder logs
for pod in $(kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" | grep -i "sorbet-fwd" | awk '{print $1}'); do
    kubectl --kubeconfig "${KUBECONFIG_FILE}" logs "${pod}" -n "${NAMESPACE}" --tail=1000 > "${OUTPUT_DIR}/logs/extended_${pod}.log" 2>&1 || true
done

# ==============================================================================
# METRICS AND PERFORMANCE DATA
# ==============================================================================
echo ""
echo "=== Collecting Metrics and Performance Data ==="

# Resource usage snapshot
{
    echo "=== Cluster Resource Usage Summary ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" top nodes 2>/dev/null || echo "Node metrics not available"
    echo ""
    kubectl --kubeconfig "${KUBECONFIG_FILE}" top pods -n "${NAMESPACE}" --containers 2>/dev/null || echo "Pod metrics not available"
    echo ""
} > "${OUTPUT_DIR}/metrics/resource_usage_snapshot.txt"

# API server metrics (if accessible)
{
    echo "=== API Server Metrics ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get --raw /metrics 2>/dev/null | head -1000 || echo "API metrics not accessible"
    echo ""
} > "${OUTPUT_DIR}/metrics/apiserver_metrics.txt"

# ==============================================================================
# NETWORK DIAGNOSTICS
# ==============================================================================
echo ""
echo "=== Collecting Network Diagnostics ==="

{
    echo "=== CoreDNS Pods ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n kube-system -l k8s-app=kube-dns -o wide
    echo ""
    
    echo "=== CoreDNS ConfigMap ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get configmap coredns -n kube-system -o yaml
    echo ""
    
    echo "=== Service DNS Endpoints ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get svc -n "${NAMESPACE}" -o custom-columns=NAME:.metadata.name,CLUSTER-IP:.spec.clusterIP,TYPE:.spec.type
    echo ""
} > "${OUTPUT_DIR}/kubernetes/network_diagnostics.txt"

# ==============================================================================
# TIMING INFORMATION
# ==============================================================================
{
    echo "=== Pod Creation Times ==="
    kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -n "${NAMESPACE}" -o custom-columns=NAME:.metadata.name,CREATED:.metadata.creationTimestamp,STATUS:.status.phase
    echo ""
} > "${OUTPUT_DIR}/kubernetes/timing_info.txt"

# End of Kubernetes diagnostics conditional block
fi # end of [ "${SKIP_KUBERNETES}" = "false" ]

# ==============================================================================
# SUMMARY AND TARBALL
# ==============================================================================
echo ""
echo "=== Creating Summary ==="

{
    echo "Diagnostic Collection Summary"
    echo "=============================="
    echo "Collection Time: $(date -Iseconds)"
    echo "Hostname: $(hostname 2>/dev/null || echo 'unknown')"
    echo "Namespace: ${NAMESPACE}"
    echo "Instance ID: ${INSTANCE_ID}"
    echo ""
    echo "Files Collected:"
    find "${OUTPUT_DIR}" -type f -exec echo "  - {}" \; 2>/dev/null | sort || echo "  (unable to list files)"
    echo ""
    echo "Total Size:"
    du -sh "${OUTPUT_DIR}" 2>/dev/null || echo "  (unable to calculate size)"
} > "${OUTPUT_DIR}/SUMMARY.txt" 2>&1 || echo "Warning: Could not create summary file"

# Create tarball (optional - if this fails, we still have the directory)
TARBALL="${OUTPUT_DIR}.tar.gz"
echo ""
echo "Creating tarball: ${TARBALL}"
if tar -czf "${TARBALL}" "${OUTPUT_DIR}" 2>/dev/null; then
    TARBALL_SIZE=$(du -sh "${TARBALL}" 2>/dev/null | cut -f1 || echo "unknown")
    echo "✓ Tarball created successfully"
else
    echo "Warning: Tarball creation failed, but diagnostics are available in ${OUTPUT_DIR}"
    TARBALL="(not created)"
    TARBALL_SIZE="n/a"
fi

echo ""
echo "=========================================="
echo "Diagnostic Collection Complete"
echo "Output Directory: ${OUTPUT_DIR}"
echo "Tarball: ${TARBALL}"
echo "Total Size: ${TARBALL_SIZE}"
echo "=========================================="

# Always exit successfully - we want the CI step to continue
exit 0

