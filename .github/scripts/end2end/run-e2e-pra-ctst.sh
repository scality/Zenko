#!/bin/bash
set -exu

ZENKO_NAME=${1:-end2end}
COMMAND=${2:-"premerge"}
PARALLEL_RUNS=${PARALLEL_RUNS:-$(( ( $(nproc) + 1 ) / 2 ))}
RETRIES=${4:-3}
JUNIT_REPORT_PATH=${JUNIT_REPORT_PATH:-"ctst-junit.xml"}

# Zenko Version
VERSION=$(cat ../../../VERSION | grep -Po 'VERSION="\K[^"]*')

# Zenko Environment
ZENKO_ACCOUNT_NAME="zenko-ctst"
ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)
DR_ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-pra-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
DR_ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-pra-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)
STORAGE_MANAGER_USER_NAME="ctst_storage_manager"
STORAGE_ACCOUNT_OWNER_USER_NAME="ctst_storage_account_owner"
DATA_CONSUMER_USER_NAME="ctst_data_consumer"
VAULT_AUTH_HOST="${ZENKO_NAME}-connector-vault-auth-api.default.svc.cluster.local"
ZENKO_PORT="80"
KEYCLOAK_TEST_PASSWORD=${OIDC_PASSWORD}
KEYCLOAK_TEST_HOST=${OIDC_HOST}
KEYCLOAK_TEST_PORT="80"
KEYCLOAK_TEST_REALM_NAME=${OIDC_REALM}
KEYCLOAK_TEST_CLIENT_ID=${OIDC_CLIENT_ID}
KEYCLOAK_TEST_GRANT_TYPE="password"

# get Zenko service users credentials
BACKBEAT_LCBP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcbp-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-bp-1\.json}' | base64 -d)
BACKBEAT_LCC_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcc-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-conductor-1\.json}' | base64 -d)
BACKBEAT_LCOP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcop-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-op-1\.json}' | base64 -d)
BACKBEAT_QP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-qp-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-qp-1\.json}' | base64 -d)
SORBET_FWD_2_ACCESSKEY=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.accessKey}' | base64 -d)
SORBET_FWD_2_SECRETKEY=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.secretKey}' | base64 -d)
SERVICE_USERS_CREDENTIALS=$(echo '{"backbeat-lifecycle-bp-1":'${BACKBEAT_LCBP_1_CREDS}',"backbeat-lifecycle-conductor-1":'${BACKBEAT_LCC_1_CREDS}',"backbeat-lifecycle-op-1":'${BACKBEAT_LCOP_1_CREDS}',"backbeat-qp-1":'${BACKBEAT_QP_1_CREDS}',"sorbet-fwd-2":{"accessKey":"'${SORBET_FWD_2_ACCESSKEY}'","secretKey":"'${SORBET_FWD_2_SECRETKEY}'"}}' | jq -R)

# Extracting kafka host from bacbeat's config
KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .kafka.hosts)
KAFKA_HOST_PORT=${KAFKA_HOST_PORT:1:-1}

INSTANCE_ID=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.status.instanceID}')

KAFKA_CLEANER_INTERVAL=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.spec.kafkaCleaner.interval}')

kubectl --dry-run=client create secret generic drctl-s3-creds \
        --from-literal=accessKey=${ADMIN_ACCESS_KEY_ID} \
        --from-literal=secretAccessKey=${ADMIN_SECRET_ACCESS_KEY} \
        -o yaml |
        kubectl apply -f -

# Setting CTST world params
WORLD_PARAMETERS="$(jq -c <<EOF
{
  "subdomain":"${SUBDOMAIN}",
  "DRSubdomain":"${DR_SUBDOMAIN}",
  "ssl":false,
  "port":"${ZENKO_PORT}",
  "AccountName":"${ZENKO_ACCOUNT_NAME}",
  "AdminAccessKey":"${ADMIN_ACCESS_KEY_ID}",
  "AdminSecretKey":"${ADMIN_SECRET_ACCESS_KEY}",
  "DRAccountAccessKey":"${DR_ADMIN_ACCESS_KEY_ID}",
  "DRAccountSecretKey":"${DR_ADMIN_SECRET_ACCESS_KEY}",
  "VaultAuthHost":"${VAULT_AUTH_HOST}",
  "KafkaHosts":"${KAFKA_HOST_PORT}",
  "StorageManagerUsername":"${STORAGE_MANAGER_USER_NAME}",
  "StorageAccountOwnerUsername":"${STORAGE_ACCOUNT_OWNER_USER_NAME}",
  "DataConsumerUsername":"${DATA_CONSUMER_USER_NAME}",
  "ServiceUsersCredentials":${SERVICE_USERS_CREDENTIALS},
  "InstanceID":"${INSTANCE_ID}",
  "KafkaCleanerInterval":"${KAFKA_CLEANER_INTERVAL}"
}
EOF
)"

# Set up environment variables for testing
kubectl set env deployment end2end-connector-cloudserver SCUBA_HEALTHCHECK_FREQUENCY=100
kubectl rollout status deployment end2end-connector-cloudserver

# disable moniroting of count-items
kubectl set env cronjob end2end-ops-count-items PROMETHEUS_POLLING_ATTEMPTS=1
kubectl set env cronjob end2end-ops-count-items PROMETHEUS_POLLING_PERIOD=1

E2E_IMAGE=$E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG
POD_NAME="${ZENKO_NAME}-ctst-tests"

CTST_VERSION=$(sed 's/.*"cli-testing": ".*#\(.*\)".*/\1/;t;d' ../../../tests/ctst/package.json)
# Configure keycloak
docker run \
    --rm \
    --network=host \
    "${E2E_IMAGE}" /bin/bash \
    -c "SUBDOMAIN=${SUBDOMAIN} CONTROL_PLANE_INGRESS_ENDPOINT=${OIDC_ENDPOINT} ACCOUNT=${ZENKO_ACCOUNT_NAME} KEYCLOAK_REALM=${KEYCLOAK_TEST_REALM_NAME} STORAGE_MANAGER=${STORAGE_MANAGER_USER_NAME} STORAGE_ACCOUNT_OWNER=${STORAGE_ACCOUNT_OWNER_USER_NAME} DATA_CONSUMER=${DATA_CONSUMER_USER_NAME} /ctst/bin/seedKeycloak.sh"; [[ $? -eq 1 ]] && exit 1 || echo 'Keycloak Configured!'

# Grant access to Kube API (insecure, only for testing)
kubectl create clusterrolebinding serviceaccounts-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:serviceaccounts

# Running end2end ctst tests
kubectl run $POD_NAME \
        --pod-running-timeout=5m \
        --image=$E2E_IMAGE \
        --restart=Never \
        --rm \
        --attach=True \
        --image-pull-policy=IfNotPresent \
        --env=TARGET_VERSION=$VERSION  \
        --env=VERBOSE=1 \
        --override-type strategic \
        --overrides='
{
  "apiVersion": "v1",
  "kind": "Pod",
  "spec": {
    "containers": [
      {
        "name": "'$POD_NAME'",
        "volumeMounts": [
          {
            "name": "cold-data",
            "mountPath": "/cold-data"
          },
          {
            "name": "reports",
            "mountPath": "/reports"
          }
        ]
      }
    ],
    "volumes": [
      {
        "name": "cold-data",
        "persistentVolumeClaim": {
          "claimName": "sorbet-data"
        }
      },
      {
        "name": "reports",
        "hostPath": {
          "path": "/data/reports",
          "type": "DirectoryOrCreate"
        }
      }
    ]
  }
}' -- ./run "$COMMAND" $WORLD_PARAMETERS --parallel $PARALLEL_RUNS --retry $RETRIES --tags @PRA --retry-tag-filter @Flaky --format junit:$JUNIT_REPORT_PATH