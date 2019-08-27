# Usage

# mgob

MGOB is a MongoDB backup automation tool built with golang.

#### Features

- schedule backups
- local backups retention
- upload to S3 Object Storage (Minio, AWS, Google Cloud, Azure)
- upload to gcloud storage
- upload to SFTP (under testing)
- notifications (Email, Slack)

#### Install

MGOB is available on Docker Hub at [stefanprodan/mgob](https://hub.docker.com/r/stefanprodan/mgob/).

#### Configure

Define a backup plan (yaml format) in the values file under configMap.
This can be done either in the values.yaml file for mgob or vaules.yaml
file of Zenko.

_Backup plan_

```yaml
scheduler:
  # run every day at 6:00 and 18:00 UTC
  cron: "0 6,18 */1 * *"
  # number of backups to keep locally
  retention: 14
  # backup operation timeout in minutes
  timeout: 60
target:
  # mongod IP or host name
  host: "<mongoDB replica set>"
  # mongodb port
  port: 27017
  # mongodb database name, leave blank to backup all databases
  database: "test"
  # leave blank or comment out if auth is not enabled
  username: "admin"
  password: "secret"
  # add custom params to mongodump (eg. Auth or SSL support), leave blank if not needed
  params: "--ssl --authenticationDatabase admin"
# S3 upload (optional)
s3:
  url: "https://s3.amazonaws.com"
  bucket: "backup"
  accessKey: "Q3AM3UQ867SPQQA43P2F"
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
  # For Minio and AWS use S3v4 for GCP use S3v2
  api: "S3v4"
# GCloud upload (optional)
gcloud:
  bucket: "backup"
  keyFilePath: /path/to/service-account.json
# Azure blob storage upload (optional)
azure:
  containerName: "backup"
  connectionString: "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
# SFTP upload (optional - under testing)
sftp:
  host: sftp.company.com
  port: 2022
  username: user
  password: secret
  # dir must exist on the SFTP server
  dir: backup
# Email notifications (optional - under testing)
smtp:
  server: smtp.company.com
  port: 465
  username: user
  password: secret
  from: mgob@company.com
  to:
    - devops@company.com
    - alerts@company.com
# Slack notifications (optional  - under testing)
slack:
  url: https://hooks.slack.com/services/xxxx/xxx/xx
  channel: devops-alerts
  username: mgob
  # 'true' to notify only on failures
  warnOnly: false
```

ReplicaSet example:

```yaml
target:
  host: "zenko-mongodb-replicaset-0.zenko-mongodb-replicaset,zenko-mongodb-replicaset-1.zenko-mongodb-replicaset,zenko-mongodb-replicaset-2.zenko-mongodb-replicaset"
  port: 27017
  database: "test"
```

Sharded cluster with authentication and SSL example:

```yaml
target:
  host: "zenko-mongodb-replicaset-0.zenko-mongodb-replicaset,zenko-mongodb-replicaset-1.zenko-mongodb-replicaset,zenko-mongodb-replicaset-2.zenko-mongodb-replicaset"
  port: 27017
  database: "test"
  username: "admin"
  password: "secret"
  params: "--ssl --authenticationDatabase admin"
```

#### Web API

NOTE: Considering `zenko` is the release name, the service name will be `zenko-mgob`.

```sh
kubectl get svc zenko-mgob
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
zenko-mgob   ClusterIP   None         <none>        8090/TCP   3d
```

- `zenko-mgob:8090/storage` file server
- `zenko-mgob:8090/status` backup jobs status
- `zenko-mgob:8090/metrics` Prometheus endpoint
- `zenko-mgob:8090/version` mgob version and runtime info
- `zenko-mgob:8090/debug` pprof endpoint

On demand backup:

- HTTP POST `zenko-mgob:8090/backup/:planID`

```bash
curl -X POST http://zenko-mgob:8090/backup/metadata
```

```json
{
  "plan": "metadata",
  "file": "metadata-1567721706.gz",
  "duration": "1.264375987s",
  "size": "4.9 kB",
  "timestamp": "2019-09-05T22:15:06.529181117Z"
}
```

Scheduler status:

- HTTP GET `zenko-mgob:8090/status`
- HTTP GET `zenko-mgob:8090/status/:planID`

```bash
curl -X GET http://zenko-mgob:8090/status/metadata
```

```json
{
  "plan": "metadata",
  "next_run": "2019-09-06T05:00:00Z"
  "last_run": "2017-09-05T21:49:00.000622589Z",
  "last_run_status": "200",
  "last_run_log": "Backup finished in 2.339055539s archive metadata-1567720190.gz size 4.7 kB"
}
```

#### Logs

View scheduler logs with `kubectl logs {{ release-name }}-mgob-0`:

```bash
time="2019-09-05T21:49:38Z" level=info msg="Next tmp cleanup run at 2019-09-05 22:00:00 +0000 UTC"
time="2019-09-05T21:49:38Z" level=info msg="Next run at 2019-09-06 05:00:00 +0000 UTC" plan=metadata
time="2019-09-05T21:49:38Z" level=info msg="starting http server on port 8090"
time="2019-09-05T21:49:50Z" level=info msg="On demand backup started" plan=metadata
time="2019-09-05T21:49:50Z" level=info msg="new dump" archive="/tmp/metadata-1567720190.gz" err=<nil> mlog="/tmp/metadata-1567720190.log" planDir="/storage/metadata"
time="2019-09-05T21:49:51Z" level=info msg="S3 upload finished `/storage/metadata/metadata-1567720190.gz` -> `metadata/anurag-west-1/metadata-1567720190.gz` Total: 4.74 KiB, Transferred: 4.74 KiB, Speed: 30.07 KiB/s " plan=metadata
time="2019-09-05T21:49:51Z" level=info msg="On demand backup finished in 1.222549426s archive metadata-1567720190.gz size 4.9 kB" plan=metadata
```

The success/fail logs will be sent via SMTP and/or Slack if notifications are enabled(under testing).

The mongodump log is stored along with the backup data (gzip archive) in the `/storage/metadata` dir:

```bash
bash-4.4# ls -lh /storage/metadata/
total 48
-rw-r--r--    1 root     1000        4.7K Sep  5 21:45 metadata-1567719906.gz
-rw-r--r--    1 root     1000         521 Sep  5 21:45 metadata-1567719906.log
-rw-r--r--    1 root     1000        4.7K Sep  5 21:49 metadata-1567720190.gz
-rw-r--r--    1 root     1000         521 Sep  5 21:49 metadata-1567720190.log
-rw-r--r--    1 root     1000        4.8K Sep  5 21:51 metadata-1567720275.gz
-rw-r--r--    1 root     1000         521 Sep  5 21:51 metadata-1567720275.log
-rw-r--r--    1 root     1000        4.8K Sep  5 22:15 metadata-1567721706.gz
-rw-r--r--    1 root     1000         522 Sep  5 22:15 metadata-1567721706.log
```

#### Metrics

Successful backups counter

```bash
mgob_scheduler_backup_total{plan="metadata",status="200"} 8
```

Successful backups duration

```bash
mgob_scheduler_backup_latency{plan="metadata",status="200",quantile="0.5"} 2.149668417
mgob_scheduler_backup_latency{plan="metadata",status="200",quantile="0.9"} 2.39848413
mgob_scheduler_backup_latency{plan="metadata",status="200",quantile="0.99"} 2.39848413
mgob_scheduler_backup_latency_sum{plan="metadata",status="200"} 17.580484907
mgob_scheduler_backup_latency_count{plan="metadata",status="200"} 8
```

Failed jobs count and duration (status 500)

```bash
mgob_scheduler_backup_latency{plan="mongo-test",status="500",quantile="0.5"} 2.4180213
mgob_scheduler_backup_latency{plan="mongo-test",status="500",quantile="0.9"} 2.438254775
mgob_scheduler_backup_latency{plan="mongo-test",status="500",quantile="0.99"} 2.438254775
mgob_scheduler_backup_latency_sum{plan="mongo-test",status="500"} 9.679809477
mgob_scheduler_backup_latency_count{plan="mongo-test",status="500"} 4
```

#### Restore

In order to restore from a local backup you have two options:

Browse `{{ release-name }}-mgob-0:8090/storage` to identify the backup you want to restore.
Login to your MongoDB server and download the archive using `curl` and restore the backup with `mongorestore` command line.

```bash
curl -o /tmp/metadata-1567719906.gz http://zenko-mgob:8090/storage/metadata/ metadata-1567719906.gz
mongorestore --gzip --archive=/tmp/mongo-test-1494056760.gz --drop
```

You can also restore a backup from within mgob container.
Exec into mgob, identify the backup you want to restore and use `mongorestore` to connect to your MongoDB server.

```bash
kubectl exec -it {{release-name}}-mgob-0 bash
ls /storage/meatadata
mongorestore --gzip --archive=/storage/metadata/metadata-1567719906.gz --host mongohost:27017 --drop
```
