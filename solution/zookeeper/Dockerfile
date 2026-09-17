# syntax=docker/dockerfile:1

# Apache ZooKeeper for zookeeper-operator, built on a GPL-licensed JDK.
#
# We build this rather than consume ghcr.io/adobe/zookeeper-operator/zookeeper because that
# image ships Oracle JDK under the No-Fee Terms and Conditions, whose redistribution clause
# does not allow bundling it in a commercial product.
#
# Packaging follows adobe/zookeeper-operator's docker/ images, flattened into one: upstream
# builds a base image (JDK + ZooKeeper distribution), then layers zu.jar and the operator's
# scripts on top:
# https://github.com/adobe/zookeeper-operator/tree/master/docker

ARG ZK_VERSION=3.8.4
ARG ZK_OPERATOR_REPO=https://github.com/adobe/zookeeper-operator.git
ARG ZK_OPERATOR_VERSION=0.2.15-adobe-20260818
ARG ZK_OPERATOR_COMMIT=d7e40433c0bf1adba43236604c6ae1b379f4ebd9

# ZooKeeper distribution, PGP-verified
FROM alpine:3.21 AS zk_dist

ARG ZK_VERSION
WORKDIR /var/tmp
RUN set -eux; \
    apk add --no-cache gnupg wget; \
    distro="apache-zookeeper-${ZK_VERSION}-bin"; \
    base="https://archive.apache.org/dist/zookeeper/zookeeper-${ZK_VERSION}"; \
    wget -q "${base}/${distro}.tar.gz"; \
    wget -q "${base}/${distro}.tar.gz.asc"; \
    wget -q https://archive.apache.org/dist/zookeeper/KEYS; \
    gpg --import KEYS; \
    gpg --batch --verify "${distro}.tar.gz.asc" "${distro}.tar.gz"; \
    tar -zxf "${distro}.tar.gz"; \
    rm -rf "${distro}/docs" "${distro}.tar.gz" "${distro}.tar.gz.asc" KEYS; \
    mv "${distro}/conf" /var/tmp/conf

####################################################################################################
# zu.jar, plus the operator's scripts. The JDK only here: the build drives Gradle
# through the project's own wrapper.
FROM eclipse-temurin:21.0.12_8-jdk-noble AS zu_build

ARG ZK_OPERATOR_REPO
ARG ZK_OPERATOR_VERSION
ARG ZK_OPERATOR_COMMIT

RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Cloned by tag so that the version tracked in deps.yaml is what actually gets fetched; the
# commit assertion pins it, and fails the build loudly should the tag ever move.
RUN git clone --depth 1 --branch "${ZK_OPERATOR_VERSION}" "${ZK_OPERATOR_REPO}" /src && \
    test "$(git -C /src rev-parse HEAD)" = "${ZK_OPERATOR_COMMIT}"

WORKDIR /src/docker/zu
RUN ./gradlew --console=plain --no-daemon shadowJar

####################################################################################################
# runtime
FROM eclipse-temurin:21.0.12_8-jre-noble

ARG ZK_VERSION

ENV ZOO_CONF_DIR=/conf \
    ZOO_DATA_DIR=/data \
    ZOO_DATA_LOG_DIR=/datalog \
    ZOO_LOG_DIR=/logs \
    ZOO_TICK_TIME=2000 \
    ZOO_INIT_LIMIT=5 \
    ZOO_SYNC_LIMIT=2 \
    ZOO_AUTOPURGE_PURGEINTERVAL=0 \
    ZOO_AUTOPURGE_SNAPRETAINCOUNT=3 \
    ZOO_MAX_CLIENT_CNXNS=60 \
    ZOO_STANDALONE_ENABLED=true \
    ZOO_ADMINSERVER_ENABLED=true

# socat, hostname, curl and ps are used by the operator's zookeeper*.sh probe scripts; gosu
# only by docker-entrypoint.sh, which the operator bypasses by setting an explicit command.
# Upstream also installs netcat, but nothing here calls it.
RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        dnsutils \
        gosu \
        hostname \
        procps \
        socat; \
    rm -rf /var/lib/apt/lists/*; \
    gosu nobody true

# Ubuntu ships a default `ubuntu` user on uid/gid 1000, which is the uid ZooKeeper runs as
# upstream. Reclaim it rather than picking another, so data directory ownership is unchanged.
RUN set -eux; \
    userdel -r ubuntu; \
    groupadd -r zookeeper --gid=1000; \
    useradd -r -g zookeeper --uid=1000 zookeeper; \
    mkdir -p "$ZOO_DATA_DIR" "$ZOO_DATA_LOG_DIR" "$ZOO_CONF_DIR" "$ZOO_LOG_DIR" /opt/libs; \
    chown zookeeper:zookeeper "$ZOO_DATA_DIR" "$ZOO_DATA_LOG_DIR" "$ZOO_CONF_DIR" "$ZOO_LOG_DIR"

COPY --chown=zookeeper:zookeeper --from=zk_dist \
     /var/tmp/apache-zookeeper-${ZK_VERSION}-bin /apache-zookeeper-${ZK_VERSION}-bin
COPY --chown=zookeeper:zookeeper --from=zk_dist /var/tmp/conf ${ZOO_CONF_DIR}

# Adobe patch zkEnv.sh, so take theirs over the one in the Apache distribution.
COPY --from=zu_build /src/docker/zookeeper-image/opt/zkEnv.sh \
                     /apache-zookeeper-${ZK_VERSION}-bin/bin/zkEnv.sh
COPY --chmod=0755 --from=zu_build /src/docker/zookeeper-image/docker-entrypoint.sh /docker-entrypoint.sh
COPY --chmod=0755 --from=zu_build /src/docker/bin/ /usr/local/bin/
COPY --from=zu_build /src/docker/zu/build/libs/zu.jar /opt/libs/

ENV PATH=$PATH:/apache-zookeeper-${ZK_VERSION}-bin/bin \
    ZOOCFGDIR=/conf
WORKDIR /apache-zookeeper-${ZK_VERSION}-bin

VOLUME ["/data", "/datalog", "/logs"]
EXPOSE 2181 2888 3888 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["zkServer.sh", "start-foreground"]
