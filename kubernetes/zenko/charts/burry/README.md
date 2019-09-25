Possible targets: storage.googleapis.com, s3, local

# burry

[![Go Report Card](https://goreportcard.com/badge/github.com/mhausenblas/burry.sh)](https://goreportcard.com/report/github.com/mhausenblas/burry.sh)

This is `burry`, the BackUp & RecoveRY tool for cloud native infrastructure services. Use `burry` to back up and restore
critical infrastructure base services such as ZooKeeper.

`burry` currently supports the following infra services and storage targets:

|                | ZooKeeper | etcd | Consul |
| -------------: | --------- | ---- | ------ |
|      Amazon S3 | B/R       | B/R  | B/R    |
| Google Storage | B/R       | B/R  | B/R    |
|          Local | B/R       | B/R  | B/R    |

**Contents:**

- [Install](#install)

## Install

Currently, with Zenko burry is installed as a cronjob in suspended mode.
To enable it upgrade zenko with an options.yaml file:

```sh
burry:
  cronjob:
    suspend: false
    schedule: "5 * * * *"
  configMap:
    destType: "s3"
    destEndpoint: "s3.amazonaws.com"
    accessKey: "accessKey"
    secretKey: "SecretKey"
    bucket: "bucketName"
    ssl: "false
```
