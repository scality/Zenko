#!/bin/sh

CONNSTR='DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:80/devstoreaccount1;'

makebkt()
{
    python3 -m azure.cli storage container create --name "$1" --connection-string "$CONNSTR"
}

echo "Starting Azurite..."
azurite -l /data --blobHost 0.0.0.0 --blobPort 80 &
AZURE_PID="$!"
echo "Done!"

sleep 2 # sleep for good measure

echo "Creating buckets..."
makebkt 'ci-zenko-azure-target-bucket'
makebkt 'ci-zenko-azure-crr-target-bucket'
echo "Done!"

wait $AZURE_PID
