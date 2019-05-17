#!/bin/sh

# This script is needed because RADOS Gateway
# will open the port before beginning to serve traffic
# causing wait_for_local_port.bash to exit immediately

EP="zenko-ceph-ceph-in-a-box"
echo "Waiting for ceph at $EP"
while [ -z "$(curl $EP 2>/dev/null)" ]; do
    sleep 1
done
