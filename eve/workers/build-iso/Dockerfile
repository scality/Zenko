FROM centos:7
WORKDIR /workdir

ENV PATH=$PATH:/usr/local/go/bin
ENV HELM_VERSION v3.2.3

RUN yum install -y yum-utils gettext && \
    yum-config-manager \
        --add-repo \
        https://download.docker.com/linux/centos/docker-ce.repo
RUN yum install -y python3 make skopeo wget mkisofs git docker-ce docker-ce-cli
RUN wget https://dl.google.com/go/go1.14.3.linux-amd64.tar.gz
RUN curl -sSL https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz | \
    tar -xvz && install linux-amd64/helm /usr/local/bin
RUN tar -C /usr/local -xzf go1.14.3.linux-amd64.tar.gz

# install python + buildbot worker
RUN pip3 install --no-cache-dir buildbot-worker
CMD buildbot-worker create-worker . "$BUILDMASTER:$BUILDMASTER_PORT" "$WORKERNAME" "$WORKERPASS" \
    && buildbot-worker start --nodaemon
