#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-default}"
INSTANCE_ID="${INSTANCE_ID:-end2end}"
SUBDOMAIN="${SUBDOMAIN:-zenko.local}"
E2E_IMAGE="${E2E_IMAGE:-ghcr.io/scality/zenko/zenko-e2e:latest}"
E2E_CTST_IMAGE="${E2E_CTST_IMAGE:-ghcr.io/scality/zenko/zenko-e2e-ctst:latest}"
JOB_TIMEOUT="${JOB_TIMEOUT:-3600}"

PARALLEL_RUNS="${PARALLEL_RUNS:-$(( ( $(nproc || echo 2) + 1 ) / 2 ))}"
JUNIT_REPORT_PATH="${JUNIT_REPORT_PATH:-/reports/ctst-junit.xml}"

MANAGED_BY_LABEL="zenko-run-tests-script"
CLUSTER_ROLE_BINDING_NAME="ctst-cluster-admin-for-${NAMESPACE}"

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] [-- ADDITIONAL_TEST_ARGS]

Options:
  --type <type>        Required. The type of test to run (e2e, smoke, ctst).
  --kubeconfig <path>  Path to the kubeconfig file. Defaults to ~/.kube/config.
  --cleanup            Remove all resources created by this script and exit.
  --help               Display this help message and exit.

ADDITIONAL_TEST_ARGS:
  Any arguments placed after '--' will be passed directly to the test command.
  Example for ctst: -- --tags @PRA --tags ~@Flaky
EOF
    exit 1
}

check_deps() {
    echo "Checking for required dependencies..."
    command -v kubectl >/dev/null || { echo "Error: kubectl is not installed. Please install it to continue." >&2; exit 1; }
    command -v jq >/dev/null || { echo "Error: jq is not installed. Please install it to continue." >&2; exit 1; }
    echo "All dependencies are satisfied."
}

cleanup() {
    echo "Starting cleanup of script-managed resources..."
    echo "Deleting ClusterRoleBinding '${CLUSTER_ROLE_BINDING_NAME}'..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete clusterrolebinding "${CLUSTER_ROLE_BINDING_NAME}" --ignore-not-found=true

    echo "Deleting test Jobs in namespace '${NAMESPACE}' with label 'managed-by=${MANAGED_BY_LABEL}'..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete job -n "${NAMESPACE}" -l "managed-by=${MANAGED_BY_LABEL}" --ignore-not-found=true
    echo "Cleanup complete."
}

run_checks() {
    echo "Performing prerequisite checks..."
    [[ -f "${KUBECONFIG_FILE}" ]] || { echo "Error: Kubeconfig file not found: ${KUBECONFIG_FILE}" >&2; exit 1; }
    
    echo "Testing cluster connectivity..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" cluster-info >/dev/null || { echo "Error: Cannot connect to Kubernetes cluster." >&2; exit 1; }
    
    echo "Checking for Zenko instance '${INSTANCE_ID}' in namespace '${NAMESPACE}'..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" get zenko "${INSTANCE_ID}" -n "${NAMESPACE}" >/dev/null || \
        { echo "Error: Zenko instance not found. Please ensure Zenko is deployed." >&2; exit 1; }
    echo "All checks passed."
}

setup_ctst_permissions() {
    echo "Applying CTST cluster-admin permissions for ServiceAccount 'default' in namespace '${NAMESPACE}'..."
    cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ${CLUSTER_ROLE_BINDING_NAME}
  labels:
    managed-by: ${MANAGED_BY_LABEL}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: default
  namespace: ${NAMESPACE}
EOF
}

array_to_yaml_list() {
    local -n arr=$1
    for item in "${arr[@]}"; do
        echo "        - \"${item}\""
    done
}

show_failure_details() {
    local job_name="$1"
    echo "Job Description"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}" || true
    echo "Pod Status"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" get pods -l job-name="${job_name}" -n "${NAMESPACE}" -o wide || true
    echo "Pod Logs (last 100 lines)"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs -l job-name="${job_name}" -n "${NAMESPACE}" --tail=100 || true
}

monitor_job_and_stream_logs() {
    local job_name="$1"
    local timeout="$2"
    
    echo "Waiting for job '${job_name}' to start... (timeout: ${timeout}s)"

    local pod_name=""
    local pod_find_start_time=$(date +%s)
    while [[ -z "$pod_name" ]]; do
        if (( $(date +%s) - pod_find_start_time > 60 )); then
            echo "Error: Timed out waiting for pod to be created for job ${job_name}" >&2
            return 1
        fi
        pod_name=$(kubectl --kubeconfig="${KUBECONFIG_FILE}" get pods -l "job-name=${job_name}" -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        sleep 2
    done

    echo "Pod '${pod_name}' found. Waiting for it to become ready..."
    if ! kubectl --kubeconfig="${KUBECONFIG_FILE}" wait --for=condition=Ready "pod/${pod_name}" -n "${NAMESPACE}" --timeout=180s; then
        echo "Error: Pod '${pod_name}' did not become ready in time." >&2
        return 1
    fi

    echo "Streaming logs from pod: ${pod_name}"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs -f "${pod_name}" -c "test" -n "${NAMESPACE}" &
    local log_pid=$!

    trap "kill ${log_pid} 2>/dev/null || true" RETURN

    local start_time=$(date +%s)
    while true; do
        local current_time=$(date +%s)
        if (( current_time - start_time > timeout )); then
            echo "Error: Test job '${job_name}' timed out after ${timeout} seconds!" >&2
            return 1
        fi

        local succeeded=$(kubectl --kubeconfig="${KUBECONFIG_FILE}" get job "${job_name}" -n "${NAMESPACE}" -o jsonpath='{.status.succeeded}' 2>/dev/null || echo "0")
        if [[ "$succeeded" -ge 1 ]]; then
            echo "Test job '${job_name}' completed successfully."
            sleep 2
            return 0
        fi

        local failed=$(kubectl --kubeconfig="${KUBECONFIG_FILE}" get job "${job_name}" -n "${NAMESPACE}" -o jsonpath='{.status.failed}' 2>/dev/null || echo "0")
        if [[ "$failed" -ge 1 ]]; then
            echo "Error: Test job '${job_name}' failed!" >&2
            sleep 2
            return 1
        fi

        sleep 5
    done
}

create_job() {
    local test_type="$1"
    local job_name="zenko-${test_type}-test-$(date +%s)"
    local test_image=""
    local -a test_command
    local env_vars_yaml=""
    local volumes_yaml=""
    local volume_mounts_yaml=""
    
    echo "Configuring Job for test type: ${test_type}"

    case "${test_type}" in
        ctst)
            local version
            version=$(grep -Po 'VERSION="\K[^"]*' ../../../VERSION 2>/dev/null || echo "unknown")
            
            test_image="${E2E_CTST_IMAGE}"
            
            local world_parameters
            world_parameters=$(jq -cn \
                --arg namespace "${NAMESPACE}" \
                --arg subdomain "${SUBDOMAIN}" \
                --arg dr_subdomain "${DR_SUBDOMAIN:-dr.zenko.local}" \
                --arg keycloak_username "${OIDC_USERNAME:-storage_manager}" \
                --arg keycloak_password "${OIDC_PASSWORD:-123}" \
                --arg keycloak_host "${OIDC_HOST:-keycloak.zenko.local}" \
                --arg keycloak_realm "${OIDC_REALM:-zenko}" \
                --arg keycloak_client_id "${OIDC_CLIENT_ID:-zenko-ui}" \
                '{ "Namespace": $namespace, "subdomain": $subdomain, "DRSubdomain": $dr_subdomain, "KeycloakUsername": $keycloak_username, "KeycloakPassword": $keycloak_password, "KeycloakHost": $keycloak_host, "KeycloakRealm": $keycloak_realm, "KeycloakClientId": $keycloak_client_id }')

            test_command=(
                "./run" "premerge" "${world_parameters}"
                "--parallel" "${PARALLEL_RUNS}"
                "--retry" "${RETRIES:-3}"
                "--retry-tag-filter" "@Flaky"
                "--format" "junit:${JUNIT_REPORT_PATH}"
            )
            test_command+=("${ADDITIONAL_ARGS[@]}")

            env_vars_yaml=$(cat <<EOF
        - name: TARGET_VERSION
          value: "${version}"
        - name: SEED_KEYCLOAK_DEFAULT_ROLES
          value: "true"
        - name: VERBOSE
          value: "1"
EOF
)
            volume_mounts_yaml=$(cat <<EOF
        - name: reports
          mountPath: /reports
EOF
)
            volumes_yaml=$(cat <<EOF
      - name: reports
        hostPath:
          path: /tmp/zenko-test-reports
          type: DirectoryOrCreate
EOF
)
            ;;
        e2e|smoke)
            test_image="${E2E_IMAGE}"
            test_command=("npm" "run" "test:${test_type}")
            test_command+=("${ADDITIONAL_ARGS[@]}")
            
            env_vars_yaml=$(cat <<EOF
        - name: NAMESPACE
          value: "${NAMESPACE}"
        - name: S3_ENDPOINT
          value: "http://cloudserver.${NAMESPACE}.svc.cluster.local:80"
        - name: MANAGEMENT_ENDPOINT
          value: "http://zenko-connector.${NAMESPACE}.svc.cluster.local:8000/api/v1"
        # Add other common env vars here if needed
EOF
)
            ;;
        *)
            echo "Error: Unknown test type '${test_type}' specified." >&2
            exit 1
            ;;
    esac

    local command_yaml
    command_yaml=$(array_to_yaml_list test_command)

    echo "Creating test job: ${job_name}"
    echo "Test Image: ${test_image}"
    echo "Test Command: ${test_command[*]}"

    cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${job_name}
  namespace: ${NAMESPACE}
  labels:
    app: zenko-test
    test-type: ${test_type}
    managed-by: ${MANAGED_BY_LABEL}
spec:
  ttlSecondsAfterFinished: 600
  backoffLimit: 0
  activeDeadlineSeconds: ${JOB_TIMEOUT}
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: test
        image: ${test_image}
        command:
${command_yaml}
        env:
${env_vars_yaml}
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2"
        volumeMounts:
${volume_mounts_yaml:-""}
      volumes:
${volumes_yaml:-""}
EOF

    if ! monitor_job_and_stream_logs "${job_name}" "${JOB_TIMEOUT}"; then
        show_failure_details "${job_name}"
        echo "Error: Test run failed for job '${job_name}'." >&2
        exit 1
    fi
}

main() {
    KUBECONFIG_FILE="${HOME}/.kube/config"
    TEST_TYPE=""
    ACTION="run"
    ADDITIONAL_ARGS=()

    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                TEST_TYPE="$2"
                shift 2
                ;;
            --kubeconfig)
                KUBECONFIG_FILE="$2"
                shift 2
                ;;
            --cleanup)
                ACTION="cleanup"
                shift 1
                ;;
            --help)
                usage
                ;;
            --)
                shift
                ADDITIONAL_ARGS=("$@")
                break
                ;;
            *)
                echo "Error: Unknown option: $1" >&2
                exit 1
                ;;
        esac
    done

    if [[ "${ACTION}" == "cleanup" ]]; then
        cleanup
        exit 0
    fi
    
    if [[ -z "${TEST_TYPE}" ]]; then
        echo "Error: Test type is required. Use --type <e2e|smoke|ctst>." >&2
        exit 1
    fi

    check_deps
    run_checks

    if [[ "${TEST_TYPE}" == "ctst" ]]; then
        setup_ctst_permissions
    fi

    create_job "${TEST_TYPE}"

    echo "Test run completed successfully."
}

main "$@"
