# syntax=docker/dockerfile:1

FROM alpine:3.24.2

ARG LOGROTATE_VERSION=3.22.0

RUN apk add --no-cache "logrotate~${LOGROTATE_VERSION}" && \
    mkdir -p /var/lib/logrotate

COPY --chmod=0644 logrotate.conf /etc/logrotate.conf
COPY --chmod=0755 entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
