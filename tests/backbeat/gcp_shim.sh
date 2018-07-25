#!/bin/sh

GCP_PRIV_KEY="$(echo $GCP_BACKEND_SERVICE_KEY | base64 -d | awk -f fix_priv_key.awk)"

echo "Converted private key to:"
echo "$GCP_PRIV_KEY"

cat >gcp_key.json <<EOF
{
  "private_key": "${GCP_PRIV_KEY}",
  "client_email": "${GCP_BACKEND_SERVICE_EMAIL}"
}
EOF

exec $@
