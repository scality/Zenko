# Cosmos Scheduler

The Cosmos Scheduler is a daemon that creates and deletes Cosmos `CRs` based on
operations performed in the `PENSIEVE` and `__metastore` collections found in
Zenko's MongoDB replicaset. For example, if a bucket is created within an NFS
location (mirror mode), the Scheduler will create a Cosmos CR with
the appropiate values configured for that location.

## Running the Scheduler

To run the scheduler you just need to build and execute the binary.

```sh
go build . && ./scheduler
```

If running the scheduler outside a Kubernetes cluster, you will need to specify
the path to your kube config as an environment variable.

```sh
KUBECONFIG="/home/.kube/config" ./scheduler
```

> Note: The Cosmos Scheduler is deployed as part of the Zenko chart when
`cosmos.enabled` is set to `true`.

## Environment Variables

The following environment variables can be set to customize the Scheduler's behavior:

| Environment Variable   | Description                             | Default                      |
| ---------------------- | --------------------------------------- | ---------------------------- |
`KUBECONFIG` | `""` | Path to the kube config file |
`NAMESPACE` | `default` | The Kubernetes namespace to create resources |
`MONGODB_HOSTS` | `localhost:27017` | The MongoDB hosts Url to connect to |
`CLOUDSERVER_ENDPOINT` | `localhost:8000` | The Cloudserver service endpoint |
`STORAGE_CLASS` | `my-storage-class` | The Storage Class to use for Cosmos PVs |
`INGESTION_SCHEDULE` | `* */12 * * *` | The Cosmos CronJob default ingestion schedule |

## Development

In a typical development environment running the schdeuler locally and
controlling a remote Zenko is most likely. This setup is the easiest to iterate,
develop, and debug with.

```sh
export RELEASE=<zenko release name>
# Export your kube config otherwise the scheduler will try to run in-cluster mode
export KUBECONFIG="/${HOME}/.kube/config"
export CLOUDSERVER_ENDPOINT=${RELEASE}-cloudserver
# Remove any scheduler pods in the cluster allowing the local process to take over
kubectl scale --replicas=0 deploy ${RELEASE}-cosmos-scheduler
# Port forward one of your mongodb pods
kubectl port-forward ${RELEASE_NAME}-mongodb-replicaset-0
# Compile and run
go build && ./scheduler
```

### API cURL examples

GET /healthcheck
```sh
curl localhost:8080/healthcheck
```

GET /suspend/<location-name>
```sh
curl localhost:8080/suspend/<location-name>
{"suspend":true,"triggerIngestion":true}
```
POST /suspend/<location-name>
```sh
curl -d '{"suspend":true,"triggerIngestion":false}' -X POST -H "Content-Type: application/json" localhost:8080/suspend/<location-name>
```

Makefile help:
```sh
make help
```
