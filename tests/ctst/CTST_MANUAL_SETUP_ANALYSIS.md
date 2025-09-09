# CTST Manual Setup Requirements Analysis

This document contains a comprehensive analysis of all manual setup requirements for CTST tests, excluding Zenko deployment itself.

## **COMPLETE LIST OF MANUAL CTST SETUP REQUIREMENTS**

### **1. ENVIRONMENT VARIABLES SETUP**
These are currently set via shell scripts and need to be extracted from Kubernetes secrets:

#### **Admin Credentials**
```bash
ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.secretKey}' | base64 -d)
ADMIN_PRA_ACCESS_KEY_ID=$(kubectl get secret end2end-pra-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_PRA_SECRET_ACCESS_KEY=$(kubectl get secret end2end-pra-management-vault-admin-creds.v1 -o jsonpath='{.data.secretKey}' | base64 -d)
```

#### **Service User Credentials**
```bash
BACKBEAT_LCBP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcbp-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-bp-1\.json}' | base64 -d)
BACKBEAT_LCC_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcc-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-conductor-1\.json}' | base64 -d)
BACKBEAT_LCOP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcop-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-op-1\.json}' | base64 -d)
BACKBEAT_QP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-qp-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-qp-1\.json}' | base64 -d)
SORBET_FWD_2_ACCESSKEY=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.accessKey}' | base64 -d)
SORBET_FWD_2_SECRETKEY=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.secretKey}' | base64 -d)
```

#### **Kafka Topics and Configuration**
```bash
KAFKA_DEAD_LETTER_TOPIC=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq '."kafka-dead-letter-topic"' | cut -d "\"" -f 2)
KAFKA_OBJECT_TASK_TOPIC=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq '."kafka-object-task-topic"' | cut -d "\"" -f 2)
KAFKA_GC_REQUEST_TOPIC=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq '."kafka-gc-request-topic"' | cut -d "\"" -f 2)
KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .kafka.hosts)
```

#### **Backbeat API Configuration**
```bash
BACKBEAT_API_HOST=$(kubectl get secret -l app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .backbeat.host)
BACKBEAT_API_PORT=$(kubectl get secret -l app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .backbeat.port)
```

#### **Zenko Instance Configuration**
```bash
TIME_PROGRESSION_FACTOR=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath="{.metadata.annotations.zenko\.io/time-progression-factor}")
INSTANCE_ID=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.status.instanceID}')
KAFKA_CLEANER_INTERVAL=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.spec.kafkaCleaner.interval}')
SORBETD_RESTORE_TIMEOUT=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.spec.sorbet.server.azure.restoreTimeout}')
UTILIZATION_SERVICE_HOST=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.spec.scuba.api.ingress.hostname}')
```

### **2. KUBERNETES RBAC SETUP**
**Critical Security Risk - Currently Grants Cluster Admin to ALL Service Accounts:**
```bash
kubectl create clusterrolebinding serviceaccounts-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:serviceaccounts
```

### **3. DEPLOYMENT ENVIRONMENT MODIFICATIONS**
```bash
kubectl set env deployment end2end-connector-cloudserver SCUBA_HEALTHCHECK_FREQUENCY=100
kubectl rollout status deployment end2end-connector-cloudserver
```

### **4. HOST NETWORK CONFIGURATION**
**Requires sudo access to modify /etc/hosts:**
```bash
echo "127.0.0.1 iam.zenko.local ui.zenko.local s3-local-file.zenko.local keycloak.zenko.local \
    sts.zenko.local management.zenko.local s3.zenko.local website.mywebsite.com utilization.zenko.local" | sudo tee -a /etc/hosts
```

### **5. KEYCLOAK SETUP AND CONFIGURATION**
#### **Keycloak Realm and User Creation via Docker Container:**
```bash
docker run \
    --rm \
    --network=host \
    "${E2E_IMAGE}" /bin/bash \
    -c "SUBDOMAIN=${SUBDOMAIN} CONTROL_PLANE_INGRESS_ENDPOINT=${OIDC_ENDPOINT} ACCOUNT=${ZENKO_ACCOUNT_NAME} KEYCLOAK_REALM=${KEYCLOAK_TEST_REALM_NAME} STORAGE_MANAGER=${STORAGE_MANAGER_USER_NAME} STORAGE_ACCOUNT_OWNER=${STORAGE_ACCOUNT_OWNER_USER_NAME} DATA_CONSUMER=${DATA_CONSUMER_USER_NAME} DATA_ACCESSOR=${DATA_ACCESSOR_USER_NAME} /ctst/bin/seedKeycloak.sh"
```

#### **Keycloak Configuration Requirements:**
- **Realm creation** with specific roles: `StorageManager`, `AccountTest::DataAccessor`, `AccountTest::DataConsumer`, `AccountTest::StorageAccountOwner`
- **User creation** with instance IDs and roles
- **Client configuration** for OIDC integration

### **6. KAFKA TOPIC CREATION**
**Multiple Kafka topics need to be created:**
```bash
kubectl run kafka-topics \
    --image=$KAFKA_IMAGE \
    --pod-running-timeout=5m \
    --rm \
    --restart=Never \
    --attach=True \
    --command -- bash -c \
    "kafka-topics.sh --create --topic $NOTIF_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $NOTIF_ALT_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC_2_NV --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC_2_V --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC_2_S --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists"
```

### **7. KUBERNETES CUSTOM RESOURCES**
#### **ZenkoNotificationTarget Resources:**
```yaml
apiVersion: zenko.io/v1alpha2
kind: ZenkoNotificationTarget
metadata:
  name: ${NOTIF_DEST_NAME}
  labels:
    app.kubernetes.io/instance: ${ZENKO_NAME}
spec:
  type: kafka
  host: ${NOTIF_KAFKA_HOST}
  port: ${NOTIF_KAFKA_PORT}
  destinationTopic: ${NOTIF_DEST_TOPIC}
```

### **8. MOCK SERVICES DEPLOYMENT**
#### **Azure Mock Service:**
- **Azurite container** for Azure Blob/Queue simulation
- **Ingress configuration** for multiple Azure endpoints
- **TLS certificates** for secure communication

#### **AWS Mock Service:**
- **CloudServer container** with pre-configured metadata
- **ConfigMap** with mock metadata tar.gz
- **Ingress configuration** for AWS endpoints

### **9. EXTERNAL DEPENDENCIES**
#### **Required Environment Variables from External Systems:**
- `SUBDOMAIN`, `DR_SUBDOMAIN`
- `NOTIF_DEST_NAME`, `NOTIF_DEST_TOPIC`, `NOTIF_ALT_DEST_NAME`, `NOTIF_ALT_DEST_TOPIC`
- `KAFKA_EXTERNAL_IP`
- `PROMETHEUS_NAME`
- `OIDC_USERNAME`, `OIDC_PASSWORD`, `OIDC_HOST`, `OIDC_REALM`, `OIDC_CLIENT_ID`, `OIDC_ENDPOINT`
- `AZURE_ACCOUNT_NAME`, `AZURE_SECRET_KEY`, `AZURE_BACKEND_ENDPOINT`, `AZURE_BACKEND_QUEUE_ENDPOINT`
- `AZURE_ARCHIVE_BUCKET_NAME`, `AZURE_ARCHIVE_BUCKET_NAME_2`, `AZURE_ARCHIVE_QUEUE_NAME`

### **10. VOLUME AND STORAGE REQUIREMENTS**
#### **Pod Volume Mounts:**
```yaml
volumeMounts:
  - name: "cold-data"
    mountPath: "/cold-data"
  - name: "reports"  
    mountPath: "/reports"
volumes:
  - name: "cold-data"
    persistentVolumeClaim:
      claimName: "sorbet-data"
  - name: "reports"
    hostPath:
      path: "/data/reports"
      type: "DirectoryOrCreate"
```

### **11. SERVICE ACCOUNT AND RBAC FOR CONFIGURATION**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${SERVICE_ACCOUNT}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ${SERVICE_ACCOUNT}
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["*"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ${SERVICE_ACCOUNT}
subjects:
- kind: ServiceAccount
  name: ${SERVICE_ACCOUNT}
roleRef:
  kind: Role
  name: ${SERVICE_ACCOUNT}
  apiGroup: rbac.authorization.k8s.io
```

### **12. ZENKO STATUS WAITING**
**Wait for Zenko deployment stabilization:**
```bash
kubectl wait --for condition=DeploymentInProgress=true --timeout 10m zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentFailure=false --timeout 10m zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentInProgress=false --timeout 10m zenko/${ZENKO_NAME}
```

---

## **SUMMARY**

This comprehensive analysis reveals **12 major categories** of manual setup requirements that need to be automated in BeforeAll hooks:

1. **Environment Variables Extraction** (from ~30+ kubectl secret/configmap queries)
2. **Kubernetes RBAC Setup** (security-critical cluster-admin binding)
3. **Deployment Modifications** (environment variable injection)
4. **Host Network Configuration** (requires sudo access)
5. **Keycloak Setup** (Docker container execution + realm/user creation)
6. **Kafka Topic Creation** (6+ topics with specific configurations)
7. **Custom Resource Creation** (ZenkoNotificationTarget resources)
8. **Mock Services Deployment** (Azure + AWS mock services)
9. **External Dependencies** (20+ environment variables from CI/external systems)
10. **Volume/Storage Setup** (PVC and hostPath configurations)
11. **Service Account/RBAC** (for configuration pods)
12. **Status Synchronization** (waiting for Zenko stabilization)

**Key Challenge:** The current setup has significant **security implications** (cluster-admin to all service accounts) and **external dependencies** (Docker execution, sudo access, external environment variables) that will need careful handling in the BeforeAll automation.

The goal of moving everything to BeforeAll hooks using the Kubernetes client is achievable, but will require handling these external dependencies and security considerations properly.