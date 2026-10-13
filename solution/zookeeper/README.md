# Apache ZooKeeper Docker Image

Docker file for building [Apache ZooKeeper](https://zookeeper.apache.org) from the official
distribution, with the additions zookeeper-operator expects, running on Eclipse Temurin.

We build it ourselves because `ghcr.io/adobe/zookeeper-operator/zookeeper` ships Oracle JDK under the
No-Fee Terms and Conditions, which does not allow redistribution as part of a commercial product.

This flattens Adobe's two images into one: upstream builds a base image (JDK plus the ZooKeeper
distribution), then layers `zu.jar` and the operator's scripts on top of it.

The operator never uses the entrypoint: it sets the container command to
`/usr/local/bin/zookeeperStart.sh`, and its probes exec the other `zookeeper*.sh` scripts, which need
`socat`, `hostname`, `curl` and `ps`. The entrypoint is kept to match upstream for standalone use.

Ubuntu ships a default `ubuntu` user on uid/gid 1000, which is the uid ZooKeeper runs as upstream, so
it is deleted to free the uid. Moving ZooKeeper to another uid instead would change data ownership.

## Bumping

Update `zookeeper.tag` in `solution/deps.yaml` -- it is `<zookeeper version>-<operator version>`, and
both halves are passed to the build -- and `ZK_OPERATOR_COMMIT` in the Dockerfile to the commit that
operator tag points at. The build asserts the two agree, so a mismatch fails loudly.
