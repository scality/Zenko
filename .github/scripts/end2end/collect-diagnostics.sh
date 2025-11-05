#!/bin/bash
# Comprehensive diagnostic collection script for Kubernetes clusters
# Collects host and cluster information even if tests fail

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-default}"
INSTANCE_ID="${INSTANCE_ID:-end2end}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-${HOME}/.kube/config}"
OUTPUT_DIR="${OUTPUT_DIR:-diagnostics-$(date +%Y%m%d-%H%M%S)}"

echo "=========================================="
echo "Starting Comprehensive Diagnostic Collection"
echo "Timestamp: $(date -Iseconds)"
echo "Output Directory: ${OUTPUT_DIR}"
echo "=========================================="

mkdir -p "${OUTPUT_DIR}"/{host,kubernetes,applications,logs,metrics}

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
    lscpu 2>/dev/null || echo "lscpu not available"
    echo ""
    echo "=== CPU Usage ==="
    top -bn1 | head -20
    echo ""
    echo "=== Load Average ==="
    cat /proc/loadavg
    echo ""
} > "${OUTPUT_DIR}/host/cpu_info.txt"

# Memory information
{
    echo "=== Memory Information ==="
    free -h
    echo ""
    echo "=== Detailed Memory ==="
    cat /proc/meminfo
    echo ""
    echo "=== Memory Top Consumers ==="
    ps aux --sort=-%mem | head -20
    echo ""
} > "${OUTPUT_DIR}/host/memory_info.txt"

# Disk information
{
    echo "=== Disk Usage ==="
    df -h
    echo ""
    echo "=== Disk I/O Stats ==="
    iostat -x 1 3 2>/dev/null || echo "iostat not available"
    echo ""
    echo "=== Mount Points ==="
    mount | column -t
    echo ""
    echo "=== Inode Usage ==="
    df -i
    echo ""
} > "${OUTPUT_DIR}/host/disk_info.txt"

# Network information
{
    echo "=== Network Interfaces ==="
    ip addr show
    echo ""
    echo "=== Network Statistics ==="
    netstat -s 2>/dev/null || ss -s
    echo ""
    echo "=== Active Connections ==="
    netstat -tulpn 2>/dev/null || ss -tulpn
    echo ""
    echo "=== Routing Table ==="
    ip route show
    echo ""
    echo "=== DNS Configuration ==="
    cat /etc/resolv.conf
    echo ""
} > "${OUTPUT_DIR}/host/network_info.txt"

# Process information
{
    echo "=== Top Processes by CPU ==="
    ps aux --sort=-%cpu | head -30
    echo ""
    echo "=== Top Processes by Memory ==="
    ps aux --sort=-%mem | head -30
    echo ""
    echo "=== Process Tree ==="
    pstree -p 2>/dev/null || ps auxf
    echo ""
} > "${OUTPUT_DIR}/host/process_info.txt"

# Docker/containerd information
{
    echo "=== Docker Info ==="
    docker info 2>/dev/null || echo "Docker not available"
    echo ""
    echo "=== Docker Stats ==="
    docker stats --no-stream 2>/dev/null || echo "Docker not available"
    echo ""
    echo "=== Containerd Info ==="
    ctr version 2>/dev/null || echo "containerd not available"
    echo ""
} > "${OUTPUT_DIR}/host/container_runtime.txt"

# Kernel and system logs
{
    echo "=== Recent Kernel Messages (last 200 lines) ==="
    dmesg | tail -200
    echo ""
} > "${OUTPUT_DIR}/host/dmesg.txt"

# Systemd journal for kubelet
{
    echo "=== Kubelet Logs (last 500 lines) ==="
    journalctl -u kubelet -n 500 --no-pager 2>/dev/null || echo "journalctl not available"
    echo ""
} > "${OUTPUT_DIR}/host/kubelet_logs.txt"

# ==============================================================================
# KUBERNETES CLUSTER DIAGNOSTICS
# ==============================================================================
echo ""
echo "=== Collecting Kubernetes Cluster Diagnostics ==="

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

# ==============================================================================
# SUMMARY AND TARBALL
# ==============================================================================
echo ""
echo "=== Creating Summary ==="

{
    echo "Diagnostic Collection Summary"
    echo "=============================="
    echo "Collection Time: $(date -Iseconds)"
    echo "Hostname: $(hostname)"
    echo "Namespace: ${NAMESPACE}"
    echo "Instance ID: ${INSTANCE_ID}"
    echo ""
    echo "Files Collected:"
    find "${OUTPUT_DIR}" -type f -exec echo "  - {}" \; | sort
    echo ""
    echo "Total Size:"
    du -sh "${OUTPUT_DIR}"
} > "${OUTPUT_DIR}/SUMMARY.txt"

# Create tarball
TARBALL="${OUTPUT_DIR}.tar.gz"
echo ""
echo "Creating tarball: ${TARBALL}"
tar -czf "${TARBALL}" "${OUTPUT_DIR}"

echo ""
echo "=========================================="
echo "Diagnostic Collection Complete"
echo "Output Directory: ${OUTPUT_DIR}"
echo "Tarball: ${TARBALL}"
echo "Total Size: $(du -sh "${TARBALL}" | cut -f1)"
echo "=========================================="

