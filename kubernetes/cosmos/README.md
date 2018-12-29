# Cosmos Helm Chart

Cosmos is a storage backend for Cloudserver that lets you manage data stored on a filesystem and other storage platforms.

## Introduction

This chart bootstraps a Cosmos deployment on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

## Prerequisites

Before installing this chart, you must either have a Zenko or a standalone Cloudserver instance running.

## Installing the Chart

To install the chart with the release name `my-release`:

```console
$ helm install --name my-release ./cosmos
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
| `pfsd.image.tag` | Pfsd image tag | `8.1.4` |
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
| `rclone.schedule` | rclone CronJob schedule | `*/10 * * * *` |
| `rclone.successfulJobsHistory` | rclone CronJob successful job history | `1` |
| `rclone.remote.accessKey` | Remote backendj access key | `my-access-key` |
| `rclone.remote.secretKey` | Remote backend secret key | `my-secret-key` |
| `rclone.remote.endpoint` | Remote endpoint | `http://cloudserver.local` |
| `rclone.remote.region` | Remote region | `us-east-1` |
| `rclone.resources` | rclone resource requests and limits | `{}` |
| `rclone.nodeSelector` | Node labels for rclone pod assignment | `{}` |
| `rclone.tolerations` | Node taints to tolerate | `[]` |
| `rclone.affinity` | rclone pod affinity | `{}` |
| `persistentVolume.enabled` | If true, enable persistentVolume | `true` |
| `persistentVolume.accessModes` | Persistent Volume access modes | `ReadWriteMany` |
| `persistentVolume.existingClaim` | Exsisting clame name | `""` |
| `persistentVolume.storageClass` | Persistent Volume storage class | `cosmos` |
| `persistentVolume.size` | Persistent Volume size | `1Gi` |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```console
$ helm install ./cosmos --name my-release \
    --set pfsd.replicaCount=3
```

Alternatively, a YAML file that specifies the values for the above parameters can be provided while installing the chart. For example,

```console
$ helm install ./cosmos --name my-release -f values.yaml
```

> **Tip**: You can use the default [values.yaml](values.yaml)

## Installing the Chart with a Cloudserver instance

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

4. Configure the Cosmos rclone's remote values.

```bash
$ cat << EOF > remoteValues.yaml
rclone:
  remote:
    accessKey: my-access-key
    secretKey: my-secret-key
    endpoint: http://cloudserver
    region: ${NFS_LOCATION}
    bucket: my-nfs-bucket # Bucket will be created if not present

persistentVolume:
  server: 10.100.1.42 # IP of your NFS server
  path: /data # NFS export
EOF
```

5. Install cosmos.

```bash
$ helm install --name ${COSMOS_RELEASE_NAME} . -f remoteValues.yaml
```

## Rclone CronJob

This chart deploys a Kubernetes CronJob which will periodically launch rclone jobs with the
purpose of syncing metadata. The time at which this job runs can be configured through the
`rclone.schedule` field in the `values.yaml` file. Additionally, you can manually create a
jobs at will with the following command:

```sh
kubectl create my-job-name --from=cronjob/my-release-cosmos-rclone
```
