export PRA_NAMESPACE="${PRA_NAMESPACE:-default}"

export MONGODB_PRA_USERNAME="${MONGODB_PRA_USERNAME:-'pra'}"
export MONGODB_PRA_PASSWORD="${MONGODB_PRA_PASSWORD:-'prapass'}"
export MONGODB_PRA_DATABASE="${MONGODB_PRA_DATABASE:-'pradb'}"
export ZENKO_MONGODB_DATABASE="${MONGODB_PRA_DATABASE}"
export ZENKO_MONGODB_SECRET_NAME="mongodb-db-creds-pra"

echo 'ZENKO_MONGODB_DATABASE="pradb"' >> $GITHUB_ENV
echo 'ZENKO_MONGODB_SECRET_NAME="mongodb-db-creds-pra"' >> $GITHUB_ENV

echo 'ZENKO_IAM_INGRESS="iam.zenko-pra.local"' >> $GITHUB_ENV
echo 'ZENKO_STS_INGRESS="sts.zenko-pra.local"' >> $GITHUB_ENV
echo 'ZENKO_MANAGEMENT_INGRESS="management.zenko-pra.local"' >> $GITHUB_ENV
echo 'ZENKO_S3_INGRESS="s3.zenko-pra.local"' >> $GITHUB_ENV
echo 'ZENKO_UI_INGRESS="ui.zenko-pra.local"' >> $GITHUB_ENV

MONGODB_ROOT_USERNAME="${MONGODB_ROOT_USERNAME:-'root'}"
MONGODB_ROOT_PASSWORD="${MONGODB_ROOT_PASSWORD:-'rootpass'}"

kubectl exec -it data-db-mongodb-sharded-mongos-0 -- mongo "admin" \
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
