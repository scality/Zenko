#!/bin/sh

set -exu

. "$(dirname $0)/common.sh"

# create a separate namespace for metadata
kubectl create namespace metadata --dry-run=client -o yaml | kubectl apply -f -

# clone the metadata repository
git init metadata
cd metadata
git fetch --depth 1 --no-tags "https://git:${GIT_ACCESS_TOKEN}@github.com/scality/metadata.git" refs/tags/9.9.0
git checkout FETCH_HEAD

# install metadata chart in a separate namespace
cd helm
helm dependency update cloudserver/
helm install -n metadata \
    --set metadata.persistentVolume.storageClass='' \
    --set metadata.sproxyd.persistentVolume.storageClass='' \
    s3c cloudserver/

# wait for the repds to be created
kubectl -n metadata rollout status --watch --timeout=300s statefulset/s3c-metadata-repd
# wait for all repd pods to start serving admin API ports
wait_for_all_pods_behind_services metadata-repd metadata "91*" 60

# current chart uses an old version of bucketd that has issues reconnecting to the repd
# when bucketd is started first. Restarting bucketd after repd is ready.
kubectl -n metadata rollout restart deployment/s3c-metadata-bucketd
# wait for the bucketd pods to be created
kubectl -n metadata rollout status --watch --timeout=300s deploy/s3c-metadata-bucketd
# wait for all bucketd pods to start serving port 9000
wait_for_all_pods_behind_services metadata-bucketd metadata 9000 60

# manually add "s3c.local" to the rest endpoints list as it's not configurable in the chart
current_config=$(kubectl get configmap/s3c-cloudserver-config-json -n metadata -o jsonpath='{.data.config\.json}')
updated_config=$(echo "$current_config" | jq '.restEndpoints["s3c.local"] = "us-east-1"')
kubectl patch configmap/s3c-cloudserver-config-json -n metadata --type='merge' -p="$(jq -n --arg v "$updated_config" '{"data": {"config.json": $v}}')"

# restarting cloudserver to take the new configmap changes into account
kubectl -n metadata rollout restart deployment/s3c-cloudserver
# wait for the cloudserver pods to be created
kubectl -n metadata rollout status --watch --timeout=300s deployment/s3c-cloudserver
# wait for the cloudserver pods to start serving port 8000
wait_for_all_pods_behind_services cloudserver metadata 8000 60
