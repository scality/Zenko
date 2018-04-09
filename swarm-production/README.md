# Zenko Swarm Stack

Note: this stack has switched metadata engine to mongodb, updating from a previous
version will initialize and use a new database instead of using your existing data.

This docker service stack describes a simple Zenko production setup, including:

* Load balancer (nginx-based) on all nodes of the swarm
* Multi-tiered networks (user-facing, DMZ and backend services)
* Thanks to Docker Swarm and its overlay network, virtual ips and scheduler,
  high availability and service resiliency (storage node excluded).

## Preparing

### Swarm

Swarm mode needs to be enabled on the local docker daemon. See
[this tutorial](https://docs.docker.com/engine/swarm/swarm-tutorial/)
for more information on Swarm mode.

### Storage Node Selection

Since we are using direct filesystem storage, no replication of the actual data
happens, so one specific node in the swarm needs to be selected for storage.

This storage node will be responsible for the data so the storage directories
should be placed on fast, reliable disks. A backup/restore policy is also highly
recommended.

From a manager node, locate the node that will host the data and metadata:

```shell
$ docker node ls
ID                           HOSTNAME                                STATUS  AVAILABILITY  MANAGER STATUS
emuws4813jejap6a22n2sk10n    s3-node-zenko-swarm-4.na.scality.cloud  Ready   Active
gz2cs88bmpdi4pe1scbs6iqqz    s3-node-zenko-swarm-3.na.scality.cloud  Ready   Active
n5vcd4tqyo443sh4n82gcewqx    s3-node-zenko-swarm-2.na.scality.cloud  Ready   Active
ng8quztnef0r1x90le4d6lssj    s3-node-zenko-swarm-1.na.scality.cloud  Ready   Active
w43z9jeujmolyoic5ivd5tft4 *  s3-node-zenko-swarm-0.na.scality.cloud  Ready   Active        Leader
```

Here we will choose the host `s3-node-zenko-swarm-1.na.scality.cloud` with ID
`ng8quztnef0r1x90le4d6lssj`. Then to ensure that Docker Swarm only schedules the
persistent containers to this particular node, assign label `io.zenko.type` with
value `storage` to the node:

```shell
$ docker node update --label-add io.zenko.type=storage ng8quztnef0r1x90le4d6lssj
ng8quztnef0r1x90le4d6lssj
```

Check that the label has been applied:

```shell
$ docker node inspect ng8quztnef0r1x90le4d6lssj -f '{{ .Spec.Labels }}'
map[io.zenko.type:storage]
```

Note that if this step is not performed, some services in the stack will stay
pending and will never be scheduled.

### Storage Volumes

Volumes are automatically created by Docker Swarm as needed. Be aware that
deleting the stack from the swarm will also delete the data.

### Zenko Orbit

Note that by default the stack will register itself at the
[Zenko Orbit](https://www.zenko.io/admin) portal
and upload anonymous stats. Zenko Orbit allows easy configuration of users,
remote storage locations, replication and more, as well as instance monitoring.

If you would like to opt out of the remote management and monitoring, before
deploying you can export this environment variable:

```shell
$ export REMOTE_MANAGEMENT_DISABLE=1
$ docker stack deploy -c docker-stack.yml zenko-prod
[...]
```

### Access and Secret Keys

SKIP THIS STEP IF YOU ARE USING ZENKO ORBIT

The default access and secret key pair is `deployment-specific-access-key` /
`deployment-specific-secret-key`. Changing them is a must, and can be done by
updating the `SCALITY_ACCESS_KEY_ID` and `SCALITY_SECRET_ACCESS_KEY` environment
variables in the `secrets.txt` file.

### Endpoint Name

SKIP THIS STEP IF YOU ARE USING ZENKO ORBIT

By default the endpoint name is `zenko`, you may change this to the host name
presented to your clients (for example `s3.mydomain.com`) by exporting the
`ENDPOINT` environment variable prior to deploying:

```shell
$ export ENDPOINT=s3.mydomain.com
```

## Deploying

Deploy the stack:

```shell
$ docker stack deploy -c docker-stack.yml zenko-prod
Creating network zenko-prod_frontend
Creating network zenko-prod_backend
Creating network zenko-prod_frontend-dmz
Creating secret zenko-prod_s3-credentials
Creating service zenko-prod_quorum
Creating service zenko-prod_mongodb
Creating service zenko-prod_queue
Creating service zenko-prod_s3-front
Creating service zenko-prod_lb
Creating service zenko-prod_backbeat-consumer
Creating service zenko-prod_backbeat-api
Creating service zenko-prod_s3-data
Creating service zenko-prod_backbeat-producer
Creating service zenko-prod_cache
Creating service zenko-prod_mongodb-init
```

Check that the services are up:

```shell
$ docker stack services zenko-prod
ID                  NAME                           MODE                REPLICAS            IMAGE                          PORTS
1j8jb41llhtm        zenko-prod_s3-data             replicated          1/1                 zenko/cloudserver:pensieve-3   *:30010->9991/tcp
3y7vayna97bt        zenko-prod_s3-front            replicated          1/1                 zenko/cloudserver:pensieve-3   *:30009->8000/tcp
957xksl0cbge        zenko-prod_mongodb-init        replicated          0/1                 mongo:3.6.3-jessie
cn0v7cf2jxkb        zenko-prod_queue               replicated          1/1                 wurstmeister/kafka:1.0.0       *:30008->9092/tcp
jjx9oabeugx1        zenko-prod_mongodb             replicated          1/1                 mongo:3.6.3-jessie             *:30007->27017/tcp
o530bkuognu5        zenko-prod_lb                  global              1/1                 zenko/loadbalancer:latest      *:80->80/tcp
r69lgbue0o3o        zenko-prod_backbeat-api        replicated          1/1                 zenko/backbeat:pensieve-4
ut0ssvmi10tx        zenko-prod_backbeat-consumer   replicated          1/1                 zenko/backbeat:pensieve-4
vj2fr90qviho        zenko-prod_cache               replicated          1/1                 redis:alpine                   *:30011->6379/tcp
vqmkxu7yo859        zenko-prod_quorum              replicated          1/1                 zookeeper:3.4.11               *:30006->2181/tcp
y7tt98x7jdl9        zenko-prod_backbeat-producer   replicated          1/1                 zenko/backbeat:pensieve-4
[...]
```

Note that having 0 replicas of the mongodb-init service is fine, since it is
expected to execute successfully only once to initialize the mongodb replicaset.

## USING ZENKO ORBIT

To get your instance's Zenko Orbit identifier and claim it in the portal, issue this command:
```shell
$ docker service logs zenko-prod_s3-front | grep -i instance
zenko-prod_s3-front.1.khz73ag06k2k@moby    | {"name":"S3","time":1512424260154,"req_id":"115779d9564e960048a5","level":"info","message":"this deployment's Instance ID is ce1bcdb7-8e30-4e3f-b7a2-9424078c9159","hostname":"843d31bf15f0","pid":28}
```

Go to [Zenko Orbit](https://www.zenko.io/admin) to manage your deployment through a nifty UI.

## Testing

To use the `tests` folder, update the credentiasl in `Zenko/tests/utils/s3SDK.js`
with credentials generated in Zenko Orbit.
Install node modules with `npm install`
Then, simply run `npm test`.

Using [awscli](https://aws.amazon.com/cli/), we can perform S3 operations
on our Zenko stack. Since the load balancer container is deployed in `global`
mode, we can use any of the swarm nodes as the endpoint.

Note that here we are using the default `zenko` host name, you should use
the `ENDPOINT` variable configured above if applicable, or whatever the
`hostname -f` command returns.
 > IMPORTANT: when using default port 80, it should never be specified after the
 > endpoint address. If using a custom port, it must be specified.

```shell
$ export AWS_ACCESS_KEY_ID=deployment-specific-access-key
$ export AWS_SECRET_ACCESS_KEY=deployment-specific-secret-key
$ aws s3 --endpoint http://zenko mb s3://bucket1 --region=us-east-1
make_bucket: bucket1
$ aws s3 --endpoint http://zenko ls
2017-06-20 00:12:14 bucket1
$ aws s3 --endpoint http://zenko cp README.md s3://bucket1
upload: ./README.md to s3://bucket1/README.md
$ aws s3 --endpoint http://zenko ls s3://bucket1
2017-06-20 00:12:53       5052 README.md
```

### Clueso Search
Clueso search can be tested from within the S3-frontend container.

First, from your machine (not within the S3 Docker), create some objects:

```shell
$ aws s3api put-object --bucket bucket1 --key findme1 --endpoint-url http://127.0.0.1 --metadata "color=blue"
$ aws s3api put-object --bucket bucket1 --key leaveMeAlone2 --endpoint-url http://127.0.0.1 --metadata "color=red"
$ aws s3api put-object --bucket bucket1 --key findme2 --endpoint-url http://127.0.0.1 --metadata "color=blue"
```

From within the S3-frontend container:

```shell
$ bin/search_bucket.js -a accessKey1 -k verySecretKey1 -b bucket1 -q "userMd.\`x-amz-meta-color\`=\"blue\"" -h 127.0.0.1 -p 8000
```

You can see the Spark Master UI at port 8080
Check out the Livy UI at port 8998

## Further improvements

* Allow using an external environment vars file
* Include a log collection and visualization component
* Include healthchecks in the `zenko/cloudserverserver` image
* Explain how to scale/troubleshoot services and replace the storage node
