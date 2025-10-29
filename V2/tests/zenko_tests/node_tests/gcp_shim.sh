#!/bin/sh

GCP_BACKEND_SERVICE_KEY="$(echo $GCP_BACKEND_SERVICE_KEY | tr -d '\n')"

cat >gcp_key.json <<EOF
{
  "private_key": "${GCP_BACKEND_SERVICE_KEY}",
  "client_email": "${GCP_BACKEND_SERVICE_EMAIL}"
}
EOF
