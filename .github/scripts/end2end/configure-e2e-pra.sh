#!/bin/sh

set -exu

. "$(dirname $0)/common.sh"

INSTANCE_ID=$(kubectl get zenko end2end-pra -o jsonpath='{.status.instanceID}')
TOKEN=$(get_token)

LOCATION_PARAMS='{"name":"e2e-cold","locationType":"location-dmf-v1","details":{"endpoint":"ws://mock-sorbet:5001/session","username":"user1","password":"pass1","repoId":["233aead6-1d7b-4647-a7cf-0d3280b5d1d7","81e78de8-df11-4acd-8ad1-577ff05a68db"],"nsId":"65f9fd61-42fe-4a68-9ac0-6ba25311cc85"}}'

curl -k -X POST \
-H "X-Authentication-Token: $TOKEN" \
-H "Content-Type: application/json" \
-d "$LOCATION_PARAMS" \
"https://management.dr.zenko.local/api/v1/config/$INSTANCE_ID/location"