#!/bin/sh
set -e
# Trigger a cosbench run but uploading workload.xml to the controller

sleep 1

COSBENCH_EP="http://$COSBENCH_IP:19088/controller/cli"
AUTH='username=anonymous&password=cosbench'

echo "Submitting workload..." 1>&2
REPLY="$(curl -F config=@workload.xml $COSBENCH_EP/submit.action?$AUTH)"
WORKLOAD_ID="$(echo $REPLY | sed 's/Accepted with ID: \(.*\)/\1/')"

if [ -z "$WORKLOAD_ID" ]; then
    echo "Failed to submit workload!" 1>&2
else
    echo "Workload submitted with id: $WORKLOAD_ID" 1>&2
fi

echo 'Waiting for workload completion...' 2>&1
while [ "$(curl "$COSBENCH_EP/index.action?$AUTH" 2>&1 | grep -c PROCESSING)" -gt 0 ]; do
    echo 'Still waiting...' 2>&1
    sleep 60
done


# Retrieve the workload id
# Poll until its finished running
