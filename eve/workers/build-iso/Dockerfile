FROM centos:7
WORKDIR /workdir

ENV PATH=$PATH:/usr/local/go/bin
ENV GO_VERSION 1.14.3
ENV HELM_VERSION v3.2.3
ENV YQ_VERSION v4.6.3
ENV YQ_BINARY yq_linux_amd64
ENV KUSTOMIZE_VERSION v4.4.1
ENV GO_VERSION 1.16.12
ENV SKOPEO_VERSION v1.5.2

RUN yum install -y yum-utils gettext epel-release && \
    yum-config-manager \
        --add-repo \
        https://download.docker.com/linux/centos/docker-ce.repo
RUN yum install -y python3 make wget mkisofs git docker-ce docker-ce-cli isomd5sum jq
RUN curl --fail -LO https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz
RUN tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
RUN curl --fail -sSL https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz | \
    tar -xvz && install linux-amd64/helm /usr/local/bin
RUN curl --fail -L https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/${YQ_BINARY} -o /usr/bin/yq && \
    chmod +x /usr/bin/yq
RUN curl -sSL https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${KUSTOMIZE_VERSION}/kustomize_${KUSTOMIZE_VERSION}_linux_amd64.tar.gz | \
    tar xzvf - && mv kustomize /usr/local/bin
RUN yum install -y gcc gpgme-devel libassuan-devel btrfs-progs-devel device-mapper-devel
RUN git clone --depth 1 --branch ${SKOPEO_VERSION} https://github.com/containers/skopeo $GOPATH/src/github.com/containers/skopeo && \
    cd  $GOPATH/src/github.com/containers/skopeo && \
    DISABLE_DOCS=1 make bin/skopeo && \
    DISABLE_DOCS=1 make install

# install python + buildbot worker
RUN pip3 install buildbot-worker
CMD buildbot-worker create-worker . "$BUILDMASTER:$BUILDMASTER_PORT" "$WORKERNAME" "$WORKERPASS" \
    && buildbot-worker start --nodaemon
