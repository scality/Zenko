#!/bin/bash

set +ex

image_ref="$1"

# On macOS, resolve to amd64-specific digest if avoid to avoid multi-platform issues
if [[ "$(uname -o -m)" == "Darwin arm64" ]]; then
    # Get amd64 digest only if there's no arm64 support
    amd64_digest=$(docker buildx imagetools inspect "$image_ref" --raw | \
        jq -r 'if any(.manifests[]; .platform.architecture == "arm64" and .platform.os == "linux")
                then empty
                else (.manifests[] | select(.platform.architecture == "amd64" and .platform.os == "linux") | .digest) end')

    if [ -n "$amd64_digest" ]; then
        # Replace tag with digest
        image_base=$(cut -d: -f1 <<< "$image_ref")
        echo "${image_base}@${amd64_digest}"
        exit
    fi
fi

echo "$image_ref"
