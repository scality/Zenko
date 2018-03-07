#!/bin/bash
set -euf -o pipefail
mv env/cloud env/source
# remove the used terraform nodes from /tmp/terraform.env
# so that the destination installs on different machine
for ip in $( ../repo/venv/bin/ansible -i ./env/source/inventory  --list-host all | tail -n +2) ; do 
 echo "Removing $ip from /tmp/terraform.env"
 sudo -E sed  -i "s/$ip,//g" /tmp/terraform.env
done
exit 0 
