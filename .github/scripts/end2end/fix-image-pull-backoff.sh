#!/bin/bash

set -eu
set +x

NAMESPACE=${1:-default}
DIR=$(dirname "$0")

# Find pods with ImagePullBackOff errors due to missing manifest
pods=$(kubectl get pods -n ${NAMESPACE} -o json | \
    jq -r '.items[] | select(
        (.status.containerStatuses[]?.state.waiting.reason == "ImagePullBackOff" and 
         (.status.containerStatuses[]?.state.waiting.message | contains("no matching manifest"))) or
        (.status.initContainerStatuses[]?.state.waiting.reason == "ImagePullBackOff" and 
         (.status.initContainerStatuses[]?.state.waiting.message | contains("no matching manifest")))
    ) | .metadata.name')

for pod in $pods; do
    # Get all containers (init and regular) with ImagePullBackOff errors
    container_list=$(kubectl get pod $pod -n ${NAMESPACE} -o json | \
        jq -r '(.status.initContainerStatuses // []) + (.status.containerStatuses // []) | 
               .[] | select(.state.waiting.reason == "ImagePullBackOff") | 
               select(.state.waiting.message | contains("no matching manifest")) | 
               "\(.name) \(.image)"')
    
    if [ -z "$container_list" ]; then
        continue
    fi
    
    # Get the owner once for the pod
    owner=$(kubectl get pod $pod -n ${NAMESPACE} -o json | \
        jq -r '.metadata.ownerReferences[0] | "\(.kind)/\(.name)"')
    [[ $owner == "null/null" ]] && owner="Pod/$pod"

    # Resolve ReplicaSet to Deployment if needed
    if [[ $owner == ReplicaSet/* ]]; then
        deployment=$(kubectl get ${owner} -n ${NAMESPACE} -o json | \
            jq -r '.metadata.ownerReferences[0] | "\(.kind)/\(.name)"')
        if [[ $deployment == Deployment/* ]]; then
            owner=$deployment
        fi
    fi
    
    # Resolve Job to CronJob if needed
    if [[ $owner == Job/* ]]; then
        cronjob=$(kubectl get ${owner} -n ${NAMESPACE} -o json 2>/dev/null | \
            jq -r '.metadata.ownerReferences[0] | "\(.kind)/\(.name)"' || echo "")
        if [[ $cronjob == CronJob/* ]]; then
            owner=$cronjob
        fi
    fi

    echo "Fixing image architecture for $owner"
    
    # Process each container
    while IFS= read -r container_info; do
        container_name=$(echo "$container_info" | awk '{print $1}')
        image=$(echo "$container_info" | awk '{print $2}')
        
        if [ -z "$image" ]; then
            continue
        fi
        
        echo "  Resolving digest for container '$container_name' with image: $image"
        resolved_image=$(bash ${DIR}/resolve-digest.sh "$image")
        
        if [ "$image" != "$resolved_image" ]; then
            echo "  Resolved to: $resolved_image"
            
            if [[ $owner == Job/* ]]; then
                # For Jobs, we need to patch the spec directly
                container_idx=$(kubectl get ${owner} -n ${NAMESPACE} -o json | jq ".spec.template.spec.containers | map(.name) | index(\"${container_name}\")")
                kubectl patch ${owner} -n ${NAMESPACE} --type='json' -p="[{
                        \"op\": \"replace\",
                        \"path\": \"/spec/template/spec/containers/${container_idx}/image\",
                        \"value\": \"${resolved_image}\"
                    }]" 2>/dev/null
            # elif [[ $owner == CronJob/* ]]; then
            #     # For CronJobs, we need to patch the job template
            #     container_idx=$(kubectl get ${owner} -n ${NAMESPACE} -o json | jq ".spec.jobTemplate.spec.template.spec.containers | map(.name) | index(\"${container_name}\")")
            #     kubectl patch ${owner} -n ${NAMESPACE} --type='json' -p="[{
            #             \"op\": \"replace\",
            #             \"path\": \"/spec/jobTemplate/spec/template/spec/containers/${container_idx}/image\",
            #             \"value\": \"${resolved_image}\"
            #         }]" 2>/dev/null
            else
                kubectl set image -n ${NAMESPACE} $owner "${container_name}=${resolved_image}"
            fi
        fi
    done <<< "$container_list"
done
