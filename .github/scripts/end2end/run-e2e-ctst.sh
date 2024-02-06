#!/bin/bash
set -exu

ZENKO_NAME=${1:-end2end}
COMMAND=${2:-"premerge"}
# Get the current number of vCPUs
VCPU_COUNT=$(nproc)
# Calculate the number of parallel runs based on the vCPU count
# - If there are only 1 vCPU set parallel runs to 1.
# - If there are between 1 and 4 vCPUs, use 0.5 parallel runs per vCPU.
# - If there are more than 4 vCPUs, use 0.5 parallel runs for the first 4 vCPUs and 1 parallel run for
#   each additional vCPU, as Zenko is not CPU bound.
PARALLEL_RUNS=$(awk -v vcpu=$VCPU_COUNT 'BEGIN {
  if (vcpu <= 0) {
    print 1
  } else if (vcpu >= 1 && vcpu <= 4) {
    print int(vcpu * 0.5)
  } else {
    print (4 * 0.5) + ((vcpu - 4) * 1)
  }
}')
RETRIES=${4:-3}

# Zenko Version
VERSION=$(cat ../../../VERSION | grep -Po 'VERSION="\K[^"]*')

# Zenko Environment
ZENKO_ACCOUNT_NAME="zenko-ctst"
ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)
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

# Get KAFKA topics for sorbet
KAFKA_DEAD_LETTER_TOPIC=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq '."kafka-dead-letter-topic"' | cut -d "\"" -f 2)

KAFKA_OBJECT_TASK_TOPIC=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq '."kafka-object-task-topic"' | cut -d "\"" -f 2)

KAFKA_ARCHIVE_REQUEST_TOPIC=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq '."kafka-archive-request-topic"' | cut -d "\"" -f 2)

KAFKA_RESTORE_REQUEST_TOPIC=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq '."kafka-restore-request-topic"' | cut -d "\"" -f 2)

# Extracting kafka host from bacbeat's config
KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .kafka.hosts)
KAFKA_HOST_PORT=${KAFKA_HOST_PORT:1:-1}

# Azure archive tests
AZURE_ARCHIVE_ACCESS_TIER="Hot"
AZURE_ARCHIVE_MANIFEST_ACCESS_TIER="Hot"

INSTANCE_ID=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.status.instanceID}')

# Setting CTST world params
WORLD_PARAMETERS='{"subdomain":"'${SUBDOMAIN}'","ssl":false,"port":"'${ZENKO_PORT}'","AccountName":"'${ZENKO_ACCOUNT_NAME}'","AdminAccessKey":"'${ADMIN_ACCESS_KEY_ID}'","AdminSecretKey":"'${ADMIN_SECRET_ACCESS_KEY}'","VaultAuthHost":"'${VAULT_AUTH_HOST}'","NotificationDestination":"'${NOTIF_DEST_NAME}'","NotificationDestinationTopic":"'${NOTIF_DEST_TOPIC}'","NotificationDestinationAlt":"'${NOTIF_ALT_DEST_NAME}'","NotificationDestinationTopicAlt":"'${NOTIF_ALT_DEST_TOPIC}'","KafkaHosts":"'${KAFKA_HOST_PORT}'","KeycloakPassword":"'${KEYCLOAK_TEST_PASSWORD}'","KeycloakHost":"'${KEYCLOAK_TEST_HOST}'","KeycloakPort":"'${KEYCLOAK_TEST_PORT}'","keycloakRealm":"'${KEYCLOAK_TEST_REALM_NAME}'","keycloakClientId":"'${KEYCLOAK_TEST_CLIENT_ID}'","keycloakGrantType":"'${KEYCLOAK_TEST_GRANT_TYPE}'","StorageManagerUsername":"'${STORAGE_MANAGER_USER_NAME}'","StorageAccountOwnerUsername":"'${STORAGE_ACCOUNT_OWNER_USER_NAME}'","DataConsumerUsername":"'${DATA_CONSUMER_USER_NAME}'","ServiceUsersCredentials":'${SERVICE_USERS_CREDENTIALS}',"azureAccountName":"'${AZURE_ACCOUNT_NAME}'","azureAccountKey":"'${AZURE_SECRET_KEY}'","azureArchiveContainer":"'${AZURE_ARCHIVE_BUCKET_NAME}'","AzureArchiveAccessTier":"'${AZURE_ARCHIVE_ACCESS_TIER}'","azureArchiveManifestTier":"'${AZURE_ARCHIVE_MANIFEST_ACCESS_TIER}'","azureArchiveQueue":"'${AZURE_ARCHIVE_QUEUE_NAME}'","kafkaObjectTaskTopic":"'${KAFKA_OBJECT_TASK_TOPIC}'","kafkaDeadLetterQueueTopic":"'${KAFKA_DEAD_LETTER_TOPIC}'","kafkaArchiveRequestTopic":"'${KAFKA_ARCHIVE_REQUEST_TOPIC}'","InstanceID":"'${INSTANCE_ID}'"}'

E2E_IMAGE=$E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG
POD_NAME="${ZENKO_NAME}-ctst-tests"

CTST_VERSION=$(sed 's/.*"cli-testing": ".*#\(.*\)".*/\1/;t;d' ../../../tests/ctst/package.json)
# Configure keycloak
docker run \
    --rm \
    --network=host \
    "${E2E_IMAGE}" /bin/bash \
    -c "SUBDOMAIN=${SUBDOMAIN} CONTROL_PLANE_INGRESS_ENDPOINT=${OIDC_ENDPOINT} ACCOUNT=${ZENKO_ACCOUNT_NAME} KEYCLOAK_REALM=${KEYCLOAK_TEST_REALM_NAME} STORAGE_MANAGER=${STORAGE_MANAGER_USER_NAME} STORAGE_ACCOUNT_OWNER=${STORAGE_ACCOUNT_OWNER_USER_NAME} DATA_CONSUMER=${DATA_CONSUMER_USER_NAME} /ctst/bin/seedKeycloak.sh"; [[ $? -eq 1 ]] && exit 1 || echo 'Keycloak Configured!'

# Running end2end ctst tests
# Using overrides as we need to attach a local folder to the pod
kubectl run $POD_NAME \
        --pod-running-timeout=5m \
        --image=$E2E_IMAGE \
        --restart=Never \
        --rm \
        --attach=True \
        --image-pull-policy=Always \
        --env=TARGET_VERSION=$VERSION  \
        --env=AZURE_BLOB_URL=$AZURE_BACKEND_ENDPOINT  \
        --env=AZURE_QUEUE_URL=$AZURE_BACKEND_QUEUE_ENDPOINT \
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
      }
    ]
  }
}' -- ./run "$COMMAND" $WORLD_PARAMETERS "--parallel $PARALLEL_RUNS --retry $RETRIES --retry-tag-filter @Flaky"
