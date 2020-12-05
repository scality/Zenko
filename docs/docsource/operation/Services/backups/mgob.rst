MGOB
====

MGOB is a MongoDB backup automation tool, deployed with |product| 1.2 and later.

MGOB runs as a Kubernetes pod with crontab scheduling to enable backups of
|product|'s MongoDB assets, including object store metadata.

MGOB enables your |product| instance to:

-  Schedule backups
-  Retain (buffer) backups locally
-  Upload backups to S3 object stores (such as AWS, RING/S3 Connector, Wasabi,
   DigitalOcean Spaces, etc.)
-  Upload backups to Google Cloud Platform and Azure Blob storage
-  Upload to SFTP (under testing)
-  Receive notifications using protocols such as email and Slack

Installation
------------

MGOB is installed with |product| 1.2 and later. It imposes no installation overhead.

Configuration
-------------

MGOB runs as a Kubernetes pod operating under rules defined in a Helm chart. To
configure MGOB, edit its configuration in values.yaml, and pass it to |product|
using a Helm command.

Backup Plan
~~~~~~~~~~~

Define your backup plan under configMap in either the mgob values.yaml file or
the vaules.yaml file for |product|.

For example:

.. code:: yaml

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

ReplicaSet Example
~~~~~~~~~~~~~~~~~~

.. code:: yaml

   target:
     host: "zenko-mongodb-replicaset-0.zenko-mongodb-replicaset,zenko-mongodb-replicaset-1.zenko-mongodb-replicaset,zenko-mongodb-replicaset-2.zenko-mongodb-replicaset"
     port: 27017
     database: "test"

Sharded cluster with authentication and SSL example:

.. code:: yaml

   target:
     host: "zenko-mongodb-replicaset-0.zenko-mongodb-replicaset,zenko-mongodb-replicaset-1.zenko-mongodb-replicaset,zenko-mongodb-replicaset-2.zenko-mongodb-replicaset"
     port: 27017
     database: "test"
     username: "admin"
     password: "secret"
     params: "--ssl --authenticationDatabase admin"

