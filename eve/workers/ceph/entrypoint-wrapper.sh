#!/bin/sh

function get_ip {
    local nic=$1
    # IPv4 is the default unless we specify it
    local ip_version=${2:-4}
    # We should avoid reporting any IPv6 "scope local" interface that would make the ceph bind() call to fail
    ip -"$ip_version" -o a s "$nic" | grep "scope global" | awk '{ sub ("/..", "", $4); print $4 }' || true
}

# Do this manually as the setup script breaks somehow
MON_IP=$(get_ip "eth0" "4")
export MON_IP

# Strip this line from the setup script to prevent vHost style buckets from being used
sed -i -e '/rgw dns name = ${RGW_NAME}/d' /demo.sh

touch /artifacts/ceph.log
mkfifo /tmp/entrypoint_output
# We run this in the background so that we can tail the RGW log after init,
# because entrypoint.sh never returns
bash entrypoint.sh > /tmp/entrypoint_output &
entrypoint_pid="$!"
echo "Starting CEPH...."
while read -r line; do
    echo $line
    # When we find this line server has started
    if [ -n "$(echo $line | grep 'Creating bucket')" ]; then
        break
    fi
done < /tmp/entrypoint_output

# Remove the :8001 from the generated .s3cfg
sed -i -e 's/zenko-ceph-ceph-in-a-box:8001/zenko-ceph-ceph-in-a-box/g' /root/.s3cfg

# Make our buckets - CEPH_DEMO_BUCKET is set to force the "Creating bucket" message, but unused
s3cmd mb s3://ci-zenko-ceph-target-bucket s3://ci-zenko-ceph-crr-target-bucket

mkdir /root/.aws
cat > /root/.aws/credentials <<EOF
[default]
aws_access_key_id = accessKey1
aws_secret_access_key = verySecretKey1
EOF

# Enable versioning on them
for bucket in ci-zenko-ceph-target-bucket ci-zenko-ceph-crr-target-bucket; do
    echo "Enabling versioning for $bucket"
    aws --endpoint http://zenko-ceph-ceph-in-a-box s3api  put-bucket-versioning --bucket $bucket --versioning Status=Enabled
done
tail -f /var/log/ceph/client.rgw.*.log | tee -a /artifacts/ceph.log
wait $entrypoint_pid
