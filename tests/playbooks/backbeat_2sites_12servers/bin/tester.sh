#!/bin/bash
set -euf -o pipefail

# This script implements some functional tests for backbeat.
# Backbeast is a feature where two different buckets
# located into two differents federation deployments
# are syncing. 

# Create an access/secret key on the source Federation env
unbuffer ./ansible-playbook -i ./env/source/inventory \
            ./tooling-playbooks/generate-account-access-key.yml \
            -s -e "s3cfg_file=~/.s3cfg.source"

# this is because we want the scality user to run s3cmd
sudo cp /root/.s3cfg.source /home/scality/.s3cfg.source
sudo chown scality:scality /home/scality/.s3cfg.source

# Create an access/secret key on the destination Federation env
unbuffer ./ansible-playbook -i ./env/destination/inventory \
            ./tooling-playbooks/generate-account-access-key.yml \
            -s -e "s3cfg_file=~/.s3cfg.destination"

# this is because we want the scality user to run s3cmd
sudo cp /root/.s3cfg.destination /home/scality/.s3cfg.destination
sudo chown scality:scality /home/scality/.s3cfg.destination

# install python dependencies so that replication.py can run
sudo pip install -r /tmp/bin/requirements.txt
sudo chmod a+x  /tmp/bin/replication.py

# setup replication between 2 buckets named source and destination
# ansible is essentially used below to parse the generated s3cfg files
../repo/venv/bin/ansible localhost -m shell -a \
  "export SAK={{lookup('ini','access_key section=default file=~/.s3cfg.source')}}; \
   export SSK={{lookup('ini','secret_key section=default file=~/.s3cfg.source')}}; \
   export DAK={{lookup('ini','access_key section=default file=~/.s3cfg.destination')}}; \
   export DSK={{lookup('ini','secret_key section=default file=~/.s3cfg.destination')}}; \
   /tmp/bin/replication.py --source_access_key \$SAK --source_secret_key \$SSK \
      --source_s3_endpoint 'http://node1:8000' --source_iam_endpoint 'http://node1:8600' \
      --destination_access_key \$DAK --destination_secret_key \$DSK \
      --destination_s3_endpoint 'http://node6:8000' \
      --destination_iam_endpoint 'http://node6:8600'\
      --destination_bucket 'destination' --source_bucket 'source'"       

# install pytest
sudo pip install -U pytest

# it seems this sleep is needed to ensure that the test pass
sleep 30s

# Run the pytest suite 
pytest -s -v /tmp/bin/functional.py --s3cfg-source=~/.s3cfg.source \
             --s3cfg-destination=~/.s3cfg.destination --bucket-source source \
             --bucket-destination destination --machine-destination node6 \
             --machine-source node1 --sample-size 10

echo "Test completed"

exit 0 
