# Copyright Broadcom, Inc. All Rights Reserved.
# SPDX-License-Identifier: APACHE-2.0

FROM docker.io/bitnami/minideb:bookworm@sha256:5b4e544f5d0c4669d3dbe4f4de8d3ca221d430e6a1cf3ac60007387abbbd5363

ARG DOWNLOADS_URL="downloads.bitnami.com/files/stacksmith"
ARG TARGETARCH
ARG MONGODB_VERSION
ARG MONGODB_DATABASE_TOOLS_VERSION="100.13.0"
ARG MONGODB_DATABASE_TOOLS_AMD64_SHA256="1c77ab3d8b177410af6e313164e459243bca70794e76c5ca1ad3fa324ae16f14"
ARG MONGODB_DATABASE_TOOLS_ARM64_SHA256="bd404104d7239cc5e88d5ed326870bd851b2012eef92797bfad5c9aa254a364e"

LABEL org.opencontainers.image.base.name="docker.io/bitnami/minideb:bookworm" \
      org.opencontainers.image.created="2025-09-07T01:52:10Z" \
      org.opencontainers.image.description="Application packaged by Broadcom, Inc." \
      org.opencontainers.image.documentation="https://github.com/bitnami/containers/tree/main/bitnami/mongodb-sharded/README.md" \
      org.opencontainers.image.source="https://github.com/bitnami/containers/tree/main/bitnami/mongodb-sharded" \
      org.opencontainers.image.title="mongodb-sharded" \
      org.opencontainers.image.vendor="Broadcom, Inc." \
      org.opencontainers.image.version="${MONGODB_VERSION}"

ENV HOME="/" \
    OS_ARCH="${TARGETARCH:-amd64}" \
    OS_FLAVOUR="debian-12" \
    OS_NAME="linux"

COPY prebuildfs /
SHELL ["/bin/bash", "-o", "errexit", "-o", "nounset", "-o", "pipefail", "-c"]
# Install required system packages and dependencies
RUN /bin/bash /usr/sbin/install_packages ca-certificates curl libbrotli1 libcom-err2 libcurl4 libffi8 libgcc-s1 libgmp10 libgnutls30 libgssapi-krb5-2 libhogweed6 libidn2-0 libk5crypto3 libkeyutils1 libkrb5-3 libkrb5support0 libldap-2.5-0 libnettle8 libnghttp2-14 libp11-kit0 libpsl5 librtmp1 libsasl2-2 libssh2-1 libssl3 libtasn1-6 libunistring2 libzstd1 numactl procps zlib1g
RUN --mount=type=secret,id=downloads_url,env=SECRET_DOWNLOADS_URL \
    DOWNLOADS_URL=${SECRET_DOWNLOADS_URL:-${DOWNLOADS_URL}} ; \
    mkdir -p /tmp/bitnami/pkg/cache/ ; cd /tmp/bitnami/pkg/cache/ || exit 1 ; \
    COMPONENTS=( \
      "yq-4.47.1-3-linux-${OS_ARCH}-debian-12" \
      "wait-for-port-1.0.10-1-linux-${OS_ARCH}-debian-12" \
      "render-template-1.0.9-156-linux-${OS_ARCH}-debian-12" \
      "mongodb-shell-2.5.7-0-linux-${OS_ARCH}-debian-12" \
    ) ; \
    for COMPONENT in "${COMPONENTS[@]}"; do \
      if [ ! -f "${COMPONENT}.tar.gz" ]; then \
        curl -SsLf "https://${DOWNLOADS_URL}/${COMPONENT}.tar.gz" -O ; \
        curl -SsLf "https://${DOWNLOADS_URL}/${COMPONENT}.tar.gz.sha256" -O ; \
      fi ; \
      sha256sum -c "${COMPONENT}.tar.gz.sha256" ; \
      tar -zxf "${COMPONENT}.tar.gz" -C /opt/bitnami --strip-components=2 --no-same-owner ; \
      rm -rf "${COMPONENT}".tar.gz{,.sha256} ; \
    done ; \
    # Download official MongoDB server binary from MongoDB Inc
    # Use debian12 build for amd64 (matches our minideb:bookworm base);
    # arm64 debian12 tarballs are not published, so use ubuntu2204 for arm64.
    if [ "${OS_ARCH}" = "arm64" ]; then \
      MONGODB_TARBALL="mongodb-linux-aarch64-ubuntu2204-${MONGODB_VERSION}.tgz" ; \
      MONGODB_DATABASE_TOOLS_TARBALL="mongodb-database-tools-ubuntu2204-arm64-${MONGODB_DATABASE_TOOLS_VERSION}.tgz" ; \
      MONGODB_DATABASE_TOOLS_SHA256="${MONGODB_DATABASE_TOOLS_ARM64_SHA256}" ; \
    else \
      MONGODB_TARBALL="mongodb-linux-x86_64-debian12-${MONGODB_VERSION}.tgz" ; \
      MONGODB_DATABASE_TOOLS_TARBALL="mongodb-database-tools-debian12-x86_64-${MONGODB_DATABASE_TOOLS_VERSION}.tgz" ; \
      MONGODB_DATABASE_TOOLS_SHA256="${MONGODB_DATABASE_TOOLS_AMD64_SHA256}" ; \
    fi ; \
    curl -SsLf "https://fastdl.mongodb.org/linux/${MONGODB_TARBALL}" -O ; \
    curl -SsLf "https://fastdl.mongodb.org/linux/${MONGODB_TARBALL}.sha256" -O ; \
    sha256sum -c "${MONGODB_TARBALL}.sha256" ; \
    mkdir -p /opt/bitnami/mongodb ; \
    tar -zxf "${MONGODB_TARBALL}" -C /opt/bitnami/mongodb --strip-components=1 --no-same-owner ; \
    rm -rf "${MONGODB_TARBALL}"{,.sha256} ; \
    curl -SsLf "https://fastdl.mongodb.org/tools/db/${MONGODB_DATABASE_TOOLS_TARBALL}" -O ; \
    echo "${MONGODB_DATABASE_TOOLS_SHA256}  ${MONGODB_DATABASE_TOOLS_TARBALL}" | sha256sum -c - ; \
    tar -zxf "${MONGODB_DATABASE_TOOLS_TARBALL}" -C /opt/bitnami/mongodb --strip-components=1 --no-same-owner ; \
    rm -rf "${MONGODB_DATABASE_TOOLS_TARBALL}"
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && rm -rf /var/lib/apt/lists /var/cache/apt/archives
RUN chmod g+rwX /opt/bitnami
RUN find / -perm /6000 -type f -exec chmod a-s {} \; || true
RUN ln -s /opt/bitnami/scripts/mongodb-sharded/entrypoint.sh /entrypoint.sh
RUN ln -s /opt/bitnami/scripts/liblog.sh /liblog.sh
RUN ln -s /opt/bitnami/scripts/mongodb-sharded/run.sh /run.sh

COPY rootfs /
RUN find /opt/bitnami/scripts -name "*.sh" -exec chmod a+x {} +
RUN /bin/bash /opt/bitnami/scripts/mongodb-sharded/postunpack.sh
ENV APP_VERSION="${MONGODB_VERSION}" \
    BITNAMI_APP_NAME="mongodb-sharded" \
    IMAGE_REVISION="1" \
    PATH="/opt/bitnami/common/bin:/opt/bitnami/mongodb/bin:$PATH"

EXPOSE 27017

USER 1001
ENTRYPOINT [ "/opt/bitnami/scripts/mongodb-sharded/entrypoint.sh" ]
CMD [ "/opt/bitnami/scripts/mongodb-sharded/run.sh" ]
