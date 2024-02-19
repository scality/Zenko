export PRA_NAMESPACE="${PRA_NAMESPACE:-default}"

export MONGODB_PRA_USERNAME="${MONGODB_PRA_USERNAME:-'pra'}"
export MONGODB_PRA_PASSWORD="${MONGODB_PRA_PASSWORD:-'prapass'}"
export MONGODB_PRA_DATABASE="${MONGODB_PRA_DATABASE:-'pradb'}"
export ZENKO_MONGODB_DATABASE="${MONGODB_PRA_DATABASE}"
export ZENKO_MONGODB_SECRET_NAME="mongodb-db-creds-pra"

echo 'ZENKO_MONGODB_DATABASE="pradb"' >> "$GITHUB_ENV"
echo 'ZENKO_MONGODB_SECRET_NAME="mongodb-db-creds-pra"' >> "$GITHUB_ENV"

echo 'ZENKO_IAM_INGRESS="iam.dr.zenko.local"' >> "$GITHUB_ENV"
echo 'ZENKO_STS_INGRESS="sts.dr.zenko.local"' >> "$GITHUB_ENV"
echo 'ZENKO_MANAGEMENT_INGRESS="management.dr.zenko.local"' >> "$GITHUB_ENV"
echo 'ZENKO_S3_INGRESS="s3.dr.zenko.local"' >> "$GITHUB_ENV"
echo 'ZENKO_UI_INGRESS="ui.dr.zenko.local"' >> "$GITHUB_ENV"

MONGODB_ROOT_USERNAME="${MONGODB_ROOT_USERNAME:-'root'}"
MONGODB_ROOT_PASSWORD="${MONGODB_ROOT_PASSWORD:-'rootpass'}"

kubectl exec -it data-db-mongodb-sharded-mongos-0 -- mongosh "admin" \
    -u "root" \
    -p "rootpass" \
    --eval "db.createUser({user:$MONGODB_PRA_USERNAME,pwd:$MONGODB_PRA_PASSWORD,roles:[{role:'enableSharding',db:$MONGODB_PRA_DATABASE },{role:'readWrite',db:$MONGODB_PRA_DATABASE },{role:'read',db:'local'}]})"


kubectl -n ${PRA_NAMESPACE} apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: ${ZENKO_MONGODB_SECRET_NAME}
stringData:
  mongodb-root-username: $MONGODB_ROOT_USERNAME
  mongodb-root-password: $MONGODB_ROOT_PASSWORD 
  mongodb-username: $MONGODB_PRA_USERNAME
  mongodb-password: $MONGODB_PRA_PASSWORD 
  mongodb-database: $MONGODB_PRA_DATABASE
EOF

# Pre-create volume, to ensure it ends up on first node (dev-worker)
KAFKA_NODE="${CLUSTER_NAME:-kind}-worker"
kubectl -n ${PRA_NAMESPACE} apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: zenko-dr-kafka-broker0
  labels:
    brokerId: '0'
    app: kafka-dr-sink
spec:
  persistentVolumeReclaimPolicy: Recycle
  capacity:
    storage: 1Gi
  accessModes:
  - ReadWriteOnce
  hostPath:
    path: /data/kafka-dr-broker0
    type: DirectoryOrCreate
  storageClassName: ""
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - "${KAFKA_NODE}"
EOF

KAFKA_EXTERNAL_IP=$(kubectl get node "${KAFKA_NODE}" -o yaml | yq '.status.addresses.[] | select(.type == "InternalIP") | .address')
echo "KAFKA_EXTERNAL_IP=${KAFKA_EXTERNAL_IP}" >> "$GITHUB_ENV"
