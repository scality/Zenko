# Zenko Swarm Stack

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

### Access and Secret Keys

The default access and secret key pair is `deployment-specific-access-key` /
`deployment-specific-secret-key`. Changing them is a must, and can be done by
updating the `SCALITY_ACCESS_KEY_ID` and `SCALITY_SECRET_ACCESS_KEY` environment
variables in the `secrets.txt` file.

### Endpoint Name

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
Creating network zenko-prod_backend
Creating network zenko-prod_frontend-dmz
Creating network zenko-prod_frontend
Creating service zenko-prod_lb
Creating service zenko-prod_s3-data
Creating service zenko-prod_s3-metadata
Creating service zenko-prod_s3-front
Creating service zenko-prod_cache
```

Check that the services are up:

```shell
$ docker stack services zenko-prod
ID            NAME                    MODE        REPLICAS  IMAGE
jf5fv54vqda2  zenko-prod_lb           global      5/5       zenko/loadbalancer:latest
pc23nsleqpme  zenko-prod_cache        replicated  1/1       redis:alpine
w47r55ja7k4d  zenko-prod_s3-metadata  replicated  1/1       scality/s3server:latest
wa7aqx3n1ytq  zenko-prod_s3-data      replicated  1/1       scality/s3server:latest
wo0jej0s18m8  zenko-prod_s3-front     replicated  4/4       scality/s3server:latest
```

## Testing

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

## Further improvements

* Allow using an external environment vars file
* Include a log collection and visualization component
* Include healthchecks in the `scality/s3server` image
* Explain how to scale/troubleshoot services and replace the storage node
