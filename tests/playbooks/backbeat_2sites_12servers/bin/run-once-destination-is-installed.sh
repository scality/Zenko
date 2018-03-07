#!/bin/bash
set -euf -o pipefail

# store the destination env.

mv env/cloud env/destination

# configure the remote endpoint in the source
echo "reconfiguring source with the destination ips"
someDestination=$(../repo/venv/bin/ansible -i ./env/destination/inventory  -m ping -o runners_s3  | head -n1 | cut -d" " -f 1)
echo "someDestination=$someDestination"

sed -i "s/undefined.endpoint/$someDestination/g" ./env/source/group_vars/all

# reconfigure the source

../repo/venv/bin/ansible -i ./env/source/inventory all  -m shell -a "rm -rf /opt/scality/s3-offline-GA7*/*" -s

unbuffer ./ansible-playbook -i ./env/source/inventory  ./run.yml   -e "offline_federation=False" -vv

# it seems changing the destination requires restart the backbeat containers as well
# see https://scality.atlassian.net/browse/S3C-680
../repo/venv/bin/ansible -i ./env/source/inventory  all -m shell -a 'docker ps | grep -o "scality-backbeat-[0-9]" | xargs -r -t -n 1  docker restart ' -s

echo "reconfiguration done"
# execute test code
bash /tmp/bin/tester.sh
exit 0 
