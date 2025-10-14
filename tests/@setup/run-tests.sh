#!/bin/bash
set -euo pipefail

# User-configurable variables
NAMESPACE="${NAMESPACE:-default}"
INSTANCE_ID="${INSTANCE_ID:-end2end}"
SUBDOMAIN="${SUBDOMAIN:-zenko.local}"
E2E_IMAGE="${E2E_IMAGE:-ghcr.io/scality/zenko/zenko-e2e:latest}"
E2E_CTST_IMAGE="${E2E_CTST_IMAGE:-ghcr.io/scality/zenko/zenko-e2e-ctst:latest}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-${HOME}/.kube/config}"

# CTST environment variables
DR_SUBDOMAIN="${DR_SUBDOMAIN:-dr.zenko.local}"
OIDC_USERNAME="${OIDC_USERNAME:-storage_manager}"
OIDC_PASSWORD="${OIDC_PASSWORD:-123}"
OIDC_HOST="${OIDC_HOST:-keycloak.zenko.local}"
OIDC_REALM="${OIDC_REALM:-zenko}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-zenko-ui}"
PARALLEL_RUNS="${PARALLEL_RUNS:-}"

# Script-internal variables
MANAGED_BY_LABEL="zenko-run-tests-script"
CLUSTER_ROLE_BINDING_NAME="ctst-cluster-admin-for-${NAMESPACE}"

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] [-- ADDITIONAL_TEST_ARGS]

Runs Zenko integration tests as a Kubernetes Job.

Options:
  --type <type>        Required. Test type to run (e2e, smoke, ctst).
  --kubeconfig <path>  Path to the kubeconfig file.
  --cleanup            Remove resources created by this script and exit.
  --help               Display this help message and exit.

ADDITIONAL_TEST_ARGS:
  Arguments after '--' are passed directly to the test command.
EOF
    exit 1
}

check_deps() {
    command -v kubectl >/dev/null || { echo "Error: kubectl is not installed." >&2; exit 1; }
    command -v jq >/dev/null || { echo "Error: jq is not installed." >&2; exit 1; }
}

cleanup() {
    echo "Cleaning up script-managed resources..."
    kubectl --kubeconfig "${KUBECONFIG_FILE}" delete \
        clusterrolebinding "${CLUSTER_ROLE_BINDING_NAME}" \
        --ignore-not-found=true
    kubectl --kubeconfig "${KUBECONFIG_FILE}" delete job \
        -n "${NAMESPACE}" \
        -l "managed-by=${MANAGED_BY_LABEL}" \
        --ignore-not-found=true
    echo "Cleanup complete."
}

run_prerequisite_checks() {
    echo "Performing prerequisite checks..."
    if ! [[ -f "${KUBECONFIG_FILE}" ]]; then
        echo "Error: Kubeconfig file not found: ${KUBECONFIG_FILE}" >&2
        exit 1
    fi
    if ! kubectl --kubeconfig "${KUBECONFIG_FILE}" cluster-info >/dev/null; then
        echo "Error: Cannot connect to Kubernetes cluster." >&2
        exit 1
    fi
    if ! kubectl --kubeconfig "${KUBECONFIG_FILE}" get zenko "${INSTANCE_ID}" -n "${NAMESPACE}" >/dev/null; then
        echo "Error: Zenko instance '${INSTANCE_ID}' not found in namespace '${NAMESPACE}'." >&2
        exit 1
    fi
    echo "All checks passed."
}

setup_ctst_permissions() {
    echo "Applying 'ctst' cluster-admin permissions..."
    cat <<EOF | kubectl --kubeconfig "${KUBECONFIG_FILE}" apply -f -
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

wait_for_job() {
    local job_name="$1"
    echo "Waiting for pod to be created by job '${job_name}'..."
    local pod_name=""
    for _ in $(seq 1 60); do
        pod_name=$(kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -l "job-name=${job_name}" -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
        if [[ -n "${pod_name}" ]]; then
            break
        fi
        sleep 1
    done

    if [[ -z "${pod_name}" ]]; then
        echo "Error: Pod for job '${job_name}' was not created in time." >&2
        kubectl --kubeconfig "${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}"
        exit 1
    fi
    echo "Found pod '${pod_name}'."

    echo "Waiting for pod to become ready..."
    if ! kubectl --kubeconfig "${KUBECONFIG_FILE}" wait "pod/${pod_name}" -n "${NAMESPACE}" --for=condition=Ready --timeout=300s; then
        echo "Error: Pod '${pod_name}' did not become ready." >&2
        kubectl --kubeconfig "${KUBECONFIG_FILE}" describe "pod/${pod_name}" -n "${NAMESPACE}"
        exit 1
    fi

    echo "Pod is ready. Streaming logs..."
    kubectl --kubeconfig "${KUBECONFIG_FILE}" logs -f "${pod_name}" -n "${NAMESPACE}"

    echo "Log stream finished. Checking job final status..."
    local succeeded
    succeeded=$(kubectl --kubeconfig "${KUBECONFIG_FILE}" get "job/${job_name}" -n "${NAMESPACE}" -o jsonpath='{.status.succeeded}')

    if [[ "${succeeded}" == "1" ]]; then
        echo "Test job '${job_name}' completed successfully."
    else
        echo "Error: Test job '${job_name}' failed." >&2
        echo "--- Final Job Description ---"
        kubectl --kubeconfig "${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}"
        exit 1
    fi
}

run_test_job() {
    local test_type="$1"
    local -n additional_args_ref=$2
    local job_name="zenko-${test_type}-test-$(date +%s)"

    local test_image=""
    local -a test_command=()

    case "${test_type}" in
        ctst)
            test_image="${E2E_CTST_IMAGE}"
            local world_params
            world_params=$(jq -cn \
                --arg namespace "${NAMESPACE}" \
                --arg subdomain "${SUBDOMAIN}" \
                --arg dr_subdomain "${DR_SUBDOMAIN:-dr.zenko.local}" \
                --arg keycloak_username "${OIDC_USERNAME:-storage_manager}" \
                --arg keycloak_password "${OIDC_PASSWORD:-123}" \
                --arg keycloak_host "${OIDC_HOST:-keycloak.zenko.local}" \
                --arg keycloak_realm "${OIDC_REALM:-zenko}" \
                --arg keycloak_client_id "${OIDC_CLIENT_ID:-zenko-ui}" \
                '{ "Namespace": $namespace, "subdomain": $subdomain, "DRSubdomain": $dr_subdomain, "KeycloakUsername": $keycloak_username, "KeycloakPassword": $keycloak_password, "KeycloakHost": $keycloak_host, "KeycloakRealm": $keycloak_realm, "KeycloakClientId": $keycloak_client_id }')
            local parallel_runs=${PARALLEL_RUNS:-$(( ( $(nproc || echo 2) + 1 ) / 2 ))}
            test_command=(
                "./run" "premerge" "${world_params}" "--parallel" "${parallel_runs}"
                "--retry" "3" "--retry-tag-filter" "@Flaky"
                "--format" "junit:/reports/ctst-junit.xml"
            )
            ;;
        e2e|smoke)
            test_image="${E2E_IMAGE}"
            test_command=("npm" "run" "test:${test_type}")
            ;;
        *)
            echo "Error: Unknown test type '${test_type}'." >&2
            exit 1
            ;;
    esac
    test_command+=("${additional_args_ref[@]}")

    echo "Creating test job: ${job_name}"
    echo "  Image: ${test_image}"
    echo "  Command: ${test_command[*]}"

    cat <<EOF | kubectl --kubeconfig "${KUBECONFIG_FILE}" apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${job_name}
  namespace: ${NAMESPACE}
  labels:
    app: zenko-test
    managed-by: ${MANAGED_BY_LABEL}
spec:
  ttlSecondsAfterFinished: 600
  backoffLimit: 0
  activeDeadlineSeconds: 18000
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: test
        image: ${test_image}
        command:
$(for arg in "${test_command[@]}"; do echo "        - \"${arg//\"/\\\"}\""; done)
        env:
        - name: NAMESPACE
          value: "${NAMESPACE}"
$(if [[ "$test_type" == "ctst" ]]; then
    local version
    version=$(grep -Po 'VERSION="\K[^"]*' ../../VERSION 2>/dev/null || echo "unknown")
cat <<EOT
        - name: TARGET_VERSION
          value: "${version}"
        - name: SEED_KEYCLOAK_DEFAULT_ROLES
          value: "true"
        - name: VERBOSE
          value: "1"
EOT
  else # e2e/smoke
cat <<EOT
        - name: S3_ENDPOINT
          value: "http://cloudserver.${NAMESPACE}.svc.cluster.local:80"
        - name: MANAGEMENT_ENDPOINT
          value: "http://zenko-connector.${NAMESPACE}.svc.cluster.local:8000/api/v1"
EOT
fi)
        volumeMounts:
$(if [[ "$test_type" == "ctst" ]]; then
cat <<'EOT'
        - name: reports
          mountPath: /reports
EOT
fi)
      volumes:
$(if [[ "$test_type" == "ctst" ]]; then
cat <<'EOT'
      - name: reports
        hostPath:
          path: /tmp/zenko-test-reports
          type: DirectoryOrCreate
EOT
fi)
EOF

    wait_for_job "${job_name}"
}

main() {
    local test_type=""
    local action="run"
    local additional_args=()

    while [[ $# -gt 0 ]]; do
        case $1 in
            --type) test_type="$2"; shift 2 ;;
            --kubeconfig) KUBECONFIG_FILE="$2"; shift 2 ;;
            --cleanup) action="cleanup"; shift 1 ;;
            --help) usage ;;
            --) shift; additional_args=("$@"); break ;;
            *) echo "Error: Unknown option: $1" >&2; usage ;;
        esac
    done

    if [[ "${action}" == "cleanup" ]]; then
        cleanup
        exit 0
    fi
    
    if [[ -z "${test_type}" ]]; then
        echo "Error: Test type is required via the --type flag." >&2
        usage
    fi

    check_deps
    run_prerequisite_checks

    if [[ "${test_type}" == "ctst" ]]; then
        setup_ctst_permissions
    fi

    run_test_job "${test_type}" additional_args

    echo "Test run finished."
}

main "$@"
