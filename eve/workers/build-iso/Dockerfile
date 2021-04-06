FROM centos:7
WORKDIR /workdir

ENV PATH=$PATH:/usr/local/go/bin
ENV HELM_VERSION v3.2.3
ENV YQ_VERSION v4.6.3
ENV YQ_BINARY yq_linux_amd64
ENV KUSTOMIZE_VERSION v4.0.5

RUN yum install -y yum-utils gettext && \
    yum-config-manager \
        --add-repo \
        https://download.docker.com/linux/centos/docker-ce.repo
RUN yum install -y python3 make skopeo wget mkisofs git docker-ce docker-ce-cli
RUN wget https://dl.google.com/go/go1.14.3.linux-amd64.tar.gz
RUN curl -sSL https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz | \
    tar -xvz && install linux-amd64/helm /usr/local/bin
RUN tar -C /usr/local -xzf go1.14.3.linux-amd64.tar.gz
RUN wget https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/${YQ_BINARY} -O /usr/bin/yq && \
    chmod +x /usr/bin/yq
RUN curl -sSL https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${KUSTOMIZE_VERSION}/kustomize_${KUSTOMIZE_VERSION}_linux_amd64.tar.gz | \
    tar -xvz && chmod +x kustomize && mv kustomize /usr/local/bin

# install python + buildbot worker
RUN pip3 install buildbot-worker
CMD buildbot-worker create-worker . "$BUILDMASTER:$BUILDMASTER_PORT" "$WORKERNAME" "$WORKERPASS" \
    && buildbot-worker start --nodaemon
