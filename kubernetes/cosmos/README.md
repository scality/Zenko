# Cosmos Helm Chart

Cosmos is a storage backend for Cloudserver that lets you manage data stored on a filesystem and other storage platforms.

## Introduction

This chart bootstraps a Cosmos deployment on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

## Prerequisites

Before installing this chart, you must either have a Zenko or a standalone Cloudserver instance running.

## Installing the Chart

To install the chart with the release name `my-release`:

```console
$ helm install --name my-release .
```

The command deploys Cosmos on the Kubernetes cluster in the default configuration. The [configuration](#configuration) section lists the parameters that can be configured during installation.

> **Tip**: List all releases using `helm list`

## Uninstalling the Chart

To uninstall/delete the `my-release` deployment:

```console
$ helm delete my-release
```

The command removes all the Kubernetes components associated with the chart and deletes the release.

## Configuration

The following table lists the configurable parameters of the Cosmos chart and their default values.

| Parameter              | Description                             | Default                      |
| ---------------------- | --------------------------------------- | ---------------------------- |
| `pfsd.name` | Name of the pfsd component | `pfsd` |
| `pfsd.replicaCount` | Number of pfsd replicas| `1` |
| `pfsd.image.repository` | Pfsd image repository  | `zenko/cloudserver` |
| `pfsd.image.tag` | Pfsd image tag | `8.1.5` |
| `pfsd.image.pullPolicy` | Pfsd image pull policy | `IfNotPresent` |
| `pfsd.service.type` | Pfsd service type | `ClusterIP` |
| `pfsd.service.port` | Pfsd service port | `80` |
| `pfsd.resources` | Pfsd resource requests and limits | `{}` |
| `pfsd.nodeSelector` | Node labels for Pfsd pod assignment | `{}` |
| `pfsd.tolerations` | Node taints to tolerate | `[[` |
| `pfsd.affinity` | Pfsd pod affinity | `{}` |
| `rclone.name` | Name of the rclone component | `rclone` |
| `rclone.image.repository` | rclone image repository | `zenko/rclone` |
| `rclone.image.tag` | rclone image tag | `1.45` |
| `rclone.image.pullPolicy` | rclone image pull policy | `IfNotPresent` |
| `rclone.initialIngestion` | launches a post-install job to begin ingestion | `true` |
| `rclone.suspend` | Enables/disables the cronjob | `false` |
| `rclone.schedule` | rclone CronJob schedule | `*/10 * * * *` |
| `rclone.successfulJobsHistory` | rclone CronJob successful job history | `1` |
| `rclone.destination.exisitingSecret` | Specify an existing secret to use for credentials | `{}` |
| `rclone.destination.accessKey` | Remote backend access key | `my-access-key` |
| `rclone.destination.secretKey` | Remote backend secret key | `my-secret-key` |
| `rclone.destination.endpoint` | Remote endpoint | `http://cloudserver.local` |
| `rclone.destination.region` | Remote region | `us-east-1` |
| `rclone.options` | rclone cli options as key:value pair | `see values.yaml` |
| `rclone.resources` | rclone resource requests and limits | `{}` |
| `rclone.nodeSelector` | Node labels for rclone pod assignment | `{}` |
| `rclone.tolerations` | Node taints to tolerate | `[]` |
| `rclone.affinity` | rclone pod affinity | `{}` |
| `persistentVolume.enabled` | If true, enable persistentVolume | `false` |
| `persistentVolume.accessModes` | Persistent Volume access modes | `ReadWriteMany` |
| `persistentVolume.existingClaim` | Existing claim name | `""` |
| `persistentVolume.storageClass` | Persistent Volume storage class | `cosmos` |
| `persistentVolume.size` | Persistent Volume size | `1Gi` |
| `persistentVolume.readOnly` | If true, the Persistent Volume will be read-only | `false` |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```console
$ helm install . --name my-release \
    --set pfsd.replicaCount=3
```

Alternatively, a YAML file that specifies the values for the above parameters can be provided while installing the chart. For example,

```console
$ helm install . --name my-release -f values.yaml
```

> **Tip**: You can use the default [values.yaml](values.yaml)

## Installing the chart with a Zenko instance

In order to configure Cosmos with a Zenko instance, you will need to perform the following steps in [Orbit](https://admin.zenko.io):

1. Create a storage location of type "NFS Mount".

2. Create a bucket within this location constraint.

3. Create a user for Cosmos.

4. Use information from the previous steps to configure instance-specific Cosmos values. Export the following variables with appropriate values entered:

```bash
# Values from Orbit
export ACCESS_KEY=<your-cosmos-user-access-key>
export SECRET_KEY=<your-cosmos-user-secret-key>
export NFS_BUCKET=<your-cosmos-bucket-name>
export NFS_LOCATION=<your-nfs-mount-location-name>

# Values of your NFS mount point
export NFS_HOST=<your-nfs-server-host>
export NFS_EXPORT_PATH=<your-nfs-server-path>

# Cloudserver endpoint (assuming it's running on the same namespace)
export CLOUDSERVER_ENDPOINT="http://$(kubectl get svc -l app=cloudserver -o jsonpath='{.items[*].metadata.name}')"
```

5. Create a proper Cosmos configuration file.

```bash
$ cat << EOF > custom-values.yaml
rclone:
  destination:
    accessKey: ${ACCESS_KEY}
    secretKey: ${SECRET_KEY}
    endpoint: ${CLOUDSERVER_ENDPOINT}
    region: ${NFS_LOCATION}
    bucket: ${NFS_BUCKET}

persistentVolume:
  enabled: true
  volumeConfig:
    nfs:
      server: ${NFS_HOST}
      path: ${NFS_EXPORT_PATH}
      readOnly: false
    # Any valid nfs mount option can be listed here
    mountOptions: "nfsvers=3,rw"
EOF
```

6. Install Cosmos.

```bash
$ helm install --name ${NFS_LOCATION} . -f custom-values.yaml
```

> **Note**: The release name of your Cosmos installation *must* be the same as your *NFS Mount* location name.
Also, your release name (and location name) should NOT be named "cosmos".

## Installing the chart with a standalone Cloudserver instance

> **Note**: For the purpose of this example, it is assumed that the Cloudserver installation release is `cloudserver`.
Also, step 1 can be skipped. It is only there to prevent mistyping common variable names.

1. Export common variables between both charts.

```bash
export COSMOS_RELEASE_NAME=blue-sky
export NFS_LOCATION=nfs-1
```

2. Configure the Cosmos location constraint in `locationValues.yaml` file

``` bash
$ cat << EOF > locationValues.yaml
api:
  locationConstraints:
    # Required default location
    us-east-1:
      type: file
      objectId: us-east-1
      legacyAwsBehavior: true
      details: {}
    # New Location
    ${NFS_LOCATION}:
      type: pfs
      objectId: nfs-1
      legacyAwsBehavior: true
      details:
        bucketMatch: true
        pfsDaemonEndpoint:
          host: ${COSMOS_RELEASE_NAME}-cosmos-pfsd
          port: 80
EOF
```

3. Upgrade the cloudserver chart using the `locationValues.yaml` file.

```bash
helm upgrade cloudserver . -f locationValues.yaml
```

4. Configure the Cosmos values.

```bash
$ cat << EOF > remoteValues.yaml
rclone:
  destination:
    accessKey: my-access-key
    secretKey: my-secret-key
    endpoint: http://cloudserver
    region: ${NFS_LOCATION}
    bucket: my-nfs-bucket # Bucket will be created if not present

persistentVolume:
  enabled: true
  volueConfig:
    nfs:
      server: 10.100.1.42 # IP of your NFS server
      path: /data # NFS export
    # Any valid nfs mount option can be listed here
    mountOptions: "nfsvers=3,rw"
EOF
```

5. Install cosmos.

```bash
$ helm install --name ${COSMOS_RELEASE_NAME} . -f remoteValues.yaml
```

## Rclone CronJob

This chart deploys a Kubernetes Job at install to immediately begin a metadata
sync. Additionally, a Kubernetes CronJob is deployed, which periodically
launches rclone jobs to sync any additional metadata changes. The job schedule
can be configured with the ``rclone.schedule`` field in the ``values.yaml``
file. However, to manually trigger the job run the following command:

```sh
kubectl create job my-job-name --from=cronjob/my-release-cosmos-rclone
```
