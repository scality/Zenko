#!/usr/bin/env bash

set -exu

. "$(dirname $0)/common.sh"

METADATA_CHART_VERSION="${METADATA_CHART_VERSION:-9.11.1-dev.ed12a26}"
METADATA_CHART_REPO="${METADATA_CHART_REPO:-oci://ghcr.io/scality/metadata/charts}"

# create a separate namespace for metadata
kubectl create namespace metadata --dry-run=client -o yaml | kubectl apply -f -

# create pull image secret in the metadata namespace (reuse docker config from CI login)
kubectl create secret generic docker -n metadata --dry-run=client -o yaml \
    --from-file=.dockerconfigjson="$HOME/.docker/config.json" \
    --type=kubernetes.io/dockerconfigjson | kubectl apply -f -

# install metadata chart from GHCR OCI registry
helm install -n metadata \
    --set metadata.persistentVolume.storageClass='' \
    --set metadata.sproxyd.persistentVolume.storageClass='' \
    s3c "${METADATA_CHART_REPO}/cloudserver" --version "${METADATA_CHART_VERSION}"

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
