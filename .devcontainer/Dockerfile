FROM mcr.microsoft.com/devcontainers/base:jammy
ENV YQ_VERSION=v4.27.5
ENV TILT_VERSION=0.23.4
ENV KUSTOMIZE_VERSION=v4.4.1

RUN curl -L "https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64" -o /usr/local/bin/yq && \
    chmod +x /usr/local/bin/yq

RUN curl -L "https://github.com/tilt-dev/tilt/releases/download/v${TILT_VERSION}/tilt.${TILT_VERSION}.linux.x86_64.tar.gz" | tar xzvf - && \
    mv tilt /usr/local/bin && \
    chmod +x /usr/local/bin/tilt

RUN curl -L "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize/${KUSTOMIZE_VERSION}/kustomize_${KUSTOMIZE_VERSION}_linux_amd64.tar.gz" | tar -xvz && \
    install kustomize /usr/local/bin
