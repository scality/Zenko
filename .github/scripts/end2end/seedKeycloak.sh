#!/bin/bash

SUBDOMAIN=${SUBDOMAIN:-"my-company.com"}
CONTROL_PLANE_INGRESS_ENDPOINT=${CONTROL_PLANE_INGRESS_ENDPOINT:-"https://ui.${SUBDOMAIN}"}
ACCOUNT=${ACCOUNT:-"AccountTest"}
URI="${CONTROL_PLANE_INGRESS_ENDPOINT}/auth/admin/realms/${KEYCLOAK_REALM:-"artesca"}"
HEADER="Content-Type: application/json"
STORAGE_MANAGER=${STORAGE_MANAGER:-"storage_manager"}
STORAGE_ACCOUNT_OWNER=${STORAGE_ACCOUNT_OWNER:-"storage_account_owner"}
DATA_CONSUMER=${DATA_CONSUMER:-"data_consumer"}
DATA_ACCESSOR=${DATA_ACCESSOR:-"data_accessor"}
PASSWORD_CONFIGURATION='[{"type":"password","value":"123","temporary":"false"}]'

echo "Request for authorization"
RESULT=`curl -k \
    --data "username=${KEYCLOAK_USERNAME:-"admin"}&password=${KEYCLOAK_PASSWORD:-"password"}&grant_type=password&client_id=${KEYCLOAK_CLIENT_ID:-"admin-cli"}" \
    ${CONTROL_PLANE_INGRESS_ENDPOINT}/auth/realms/master/protocol/openid-connect/token`
[ -z "$RESULT" ] && exit 1

echo "Recovery of the token"
TOKEN=`echo $RESULT | sed 's/.*access_token":"//g' | sed 's/".*//g'`

echo "Display token"
echo $TOKEN

echo "- Group creation"

curl -k "${URI}/groups" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data '{"name":"'${ACCOUNT}'::StorageAccountOwner"}' || exit 1
curl -k "${URI}/groups" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data '{"name":"'${ACCOUNT}'::DataConsumer"}' || exit 1
curl -k "${URI}/groups" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data '{"name":"'${ACCOUNT}'::DataAccessor"}' || exit 1

echo "- Role creation"

curl -k "${URI}/roles" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data '{"name":"'${ACCOUNT}'::StorageAccountOwner"}' || exit 1
curl -k "${URI}/roles" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data '{"name":"'${ACCOUNT}'::DataConsumer"}' || exit 1
curl -k "${URI}/roles" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data '{"name":"'${ACCOUNT}'::DataAccessor"}' || exit 1

echo "Done"

echo "- User creation"

curl -k "${URI}/users" \
    -H "${HEADER}" \
    -H "Authorization: bearer $TOKEN" \
    --data "{\
        \"username\":\"${STORAGE_MANAGER}\",\
        \"firstName\":\"${STORAGE_MANAGER}\",\
        \"lastName\":\"${STORAGE_MANAGER}\",\
        \"email\":\"${STORAGE_MANAGER}@scality.com\",\
        \"enabled\":\"true\",\
        \"credentials\":${PASSWORD_CONFIGURATION},\
        \"realmRoles\":[\"StorageManager\"]}" || exit 1

curl -k "${URI}/users" \
    -H "${HEADER}" \
    -H "Authorization: bearer $TOKEN" \
    --data "{\
        \"username\":\"${STORAGE_ACCOUNT_OWNER}\",\
        \"firstName\":\"${STORAGE_ACCOUNT_OWNER}\",\
        \"lastName\":\"${STORAGE_ACCOUNT_OWNER}\",\
        \"email\":\"${STORAGE_ACCOUNT_OWNER}@scality.com\",\
        \"enabled\":\"true\",\
        \"credentials\":${PASSWORD_CONFIGURATION},\
        \"groups\":[\"${ACCOUNT}::StorageAccountOwner\"]}" || exit 1

curl -k "${URI}/users" \
    -H "${HEADER}" \
    -H "Authorization: bearer $TOKEN" \
    --data "{\
        \"username\":\"${DATA_CONSUMER}\",\
        \"firstName\":\"${DATA_CONSUMER}\",\
        \"lastName\":\"${DATA_CONSUMER}\",\
        \"email\":\"${DATA_CONSUMER}@scality.com\",\
        \"enabled\":\"true\",\
        \"credentials\":${PASSWORD_CONFIGURATION},\
        \"groups\":[\"${ACCOUNT}::DataConsumer\"]}" || exit 1

curl -k "${URI}/users" \
    -H "${HEADER}" \
    -H "Authorization: bearer $TOKEN" \
    --data "{\
        \"username\":\"${DATA_ACCESSOR}\",\
        \"firstName\":\"${DATA_ACCESSOR}\",\
        \"lastName\":\"${DATA_ACCESSOR}\",\
        \"email\":\"${DATA_ACCESSOR}@scality.com\",\
        \"enabled\":\"true\",\
        \"credentials\":${PASSWORD_CONFIGURATION},\
        \"groups\":[\"${ACCOUNT}::DataAccessor\"]}" || exit 1

echo "Done"

echo "- Attach the Storage Manager"

ID=`curl -k "${URI}/users?username=${STORAGE_MANAGER}" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | sed 's/.*id":"//g' | sed 's/".*//g'`
[ -z "$ID" ] && exit 1

ROLE=`curl -k "${URI}/roles" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | jq -r '.[] | select(.. | .name? == "StorageManager")'`
[ -z "$ROLE" ] && exit 1

curl -k -X POST "${URI}/users/${ID}/role-mappings/realm" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data "[$ROLE]" || exit 1

echo "- Attach the Storage Account Owner"

ID=`curl -k "${URI}/users?username=${STORAGE_ACCOUNT_OWNER}" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | sed 's/.*id":"//g' | sed 's/".*//g'`
[ -z "$ID" ] && exit 1

ROLE=`curl -k "${URI}/roles" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | jq -r '.[] | select(.. | .name? == "'"${ACCOUNT}"'::StorageAccountOwner")'`
[ -z "$ROLE" ] && exit 1

curl -k -X POST "${URI}/users/${ID}/role-mappings/realm" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data "[$ROLE]" || exit 1

echo "- Attach the Data Consumer"

ID=`curl -k "${URI}/users?username=${DATA_CONSUMER}" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | sed 's/.*id":"//g' | sed 's/".*//g'`
[ -z "$ID" ] && exit 1

ROLE=`curl -k "${URI}/roles" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | jq -r '.[] | select(.. | .name? == "'"${ACCOUNT}"'::DataConsumer")'`
[ -z "$ROLE" ] && exit 1

curl -k -X POST "${URI}/users/${ID}/role-mappings/realm" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data "[$ROLE]" || exit 1

echo "- Attach the Data Accessor"

ID=`curl -k "${URI}/users?username=${DATA_ACCESSOR}" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | sed 's/.*id":"//g' | sed 's/".*//g'`
[ -z "$ID" ] && exit 1

ROLE=`curl -k "${URI}/roles" -H "${HEADER}" -H "Authorization: bearer $TOKEN" \
    | jq -r '.[] | select(.. | .name? == "'"${ACCOUNT}"'::DataAccessor")'`
[ -z "$ROLE" ] && exit 1

curl -k -X POST "${URI}/users/${ID}/role-mappings/realm" -H "${HEADER}" -H "Authorization: bearer $TOKEN" --data "[$ROLE]" || exit 1

echo "Done"
