# Zenko Swarm Stack

This docker service stack describes a simple Zenko production setup, including:

* Host filesystem-based, easy to back up volumes for data and metadata
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

### Storage Directories On The Storage Node

Once the node has been selected and configured with the `io.zenko.type` label,
we need to create the directories that will hold the data and metadata for the
s3 service.

```shell
$ ssh root@s3-node-zenko-swarm-1.na.scality.cloud mkdir /data /metadata
```

The metadata and data containers will fail to start if this step is not
performed.

This could be done automatically on stack deployment using traditional docker
volumes, but we chose to make it a manual step with regular directories instead
of docker stack-managed volumes. The main reasons for this choice are:

* To make backup with traditional (non container-aware) backup tools easier.
* To avoid scheduling mistakes (such as the `io.zenko.type` node label ending
  up on the wrong node) causing buckets and data being written to the wrong
  node host.
* To avoid any risk of stack deletion/renaming removing the data at the same
  time.

#### (Optional) Customizing where data is stored

Alternatively, if you wish to store the data and metadata in another directory
(say `/tank` where your SSD array is mounted for example), the `volumes`
section of the `docker-stack.yml` file can be updated to look something like:

```yaml
volumes:
  s3-data:
      ...
      device: /tank/zenko/data
  s3-metadata:
      ...
      device: /tank/zenko/metadata
```

Again, these directories should be created before deploying the stack.

NFS exports can also be used as volumes. See [Volume creation
docs](https://docs.docker.com/engine/reference/commandline/volume_create/#driver-specific-options)
and [Volume Configuration
Reference](https://docs.docker.com/compose/compose-file/#volume-configuration-reference)
for more information.

### Access and Secret Keys

The default access and secret key pair is `deploy-specific-access-key` /
`deploy-specific-secret-key`. Changing them is a must, and can be done by
updating the `SCALITY_ACCESS_KEY_ID` and `SCALITY_SECRET_ACCESS_KEY` environment
variables in the `docker-stack.yml` file.

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
jf5fv54vqda2  zenko-prod_lb           global      5/5       scality/nginx-lb:latest
pc23nsleqpme  zenko-prod_cache        replicated  1/1       redis:alpine
w47r55ja7k4d  zenko-prod_s3-metadata  replicated  1/1       scality/s3server:latest
wa7aqx3n1ytq  zenko-prod_s3-data      replicated  1/1       scality/s3server:latest
wo0jej0s18m8  zenko-prod_s3-front     replicated  4/4       scality/s3server:latest
```

## Testing

Using [awscli](https://aws.amazon.com/cli/), we can perform S3 operations
on our Zenko stack. Since the load balancer container is deployed in `global`
mode, we can use any of the swarm nodes as the endpoint.

Note that because of how endpoint host name matching works, at the moment the
`Host` header for the http requests needs to match the configured hostname
`zenko`. An easy way of doing this is to add it to the `/etc/hosts` file as
shown below.

```shell
$ export AWS_ACCESS_KEY_ID=deploy-specific-access-key
$ export AWS_SECRET_ACCESS_KEY=deploy-specific-secret-key
$ echo $(docker node inspect -f '{{ .Status.Addr }}' s3-node-zenko-swarm-3.na.scality.cloud) zenko >> /etc/hosts
$ aws s3 --endpoint http://zenko mb s3://bucket1 --region=us-east-1
make_bucket: bucket1
$ aws s3 --endpoint http://zenko ls
2017-06-20 00:12:14 bucket1
$ aws s3 --endpoint http://zenko cp README.md s3://bucket1
upload: ./README.md to s3://bucket1/README.md
$ aws s3 --endpoint http://zenko ls s3://bucket1
2017-06-20 00:12:53       6712 README.md
```

## Further improvements

* Use docker secrets for access/secret keys, and require docker 1.13
* Make endpoint name configurable (HOST_MAME env var)
* Allow using an external environment vars file
* Include a log collection and visualization component
* Include healthchecks in the `scality/s3server` image
* Explain how to scale/troubleshoot services and replace the storage node
