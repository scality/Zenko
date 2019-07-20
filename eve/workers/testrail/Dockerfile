FROM ubuntu:bionic

RUN apt-get update \
    && apt-get install -y python3-buildbot-worker \
    git \
    python-pip \
    wget \
    && rm -rf /var/cache/apt

CMD buildbot-worker create-worker . "$BUILDMASTER:$BUILDMASTER_PORT" "$WORKERNAME" "$WORKERPASS" \
    && buildbot-worker start --nodaemon
