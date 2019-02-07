#!/bin/sh

CONNSTR='DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:81/devstoreaccount1;'

makebkt()
{
    python3 -m azure.cli storage container create --name "$1" --connection-string "$CONNSTR"
}

echo -n "Starting Azurite..."
node bin/blob -l /opt/azurite/folder --blobPort 81 &
AZURE_PID="$!"
echo "Done!"

sleep 2 # sleep for good measure

echo -n "Creating buckets..."
makebkt 'ci-zenko-azure-target-bucket'
makebkt 'ci-zenko-azure-crr-target-bucket'
echo "Done!"

# Start HAProxy
echo -n "Starting HAProxy..."
/usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg -p /var/run/haproxy.pid -D
echo "Done!"
sleep 1
wait $AZURE_PID
