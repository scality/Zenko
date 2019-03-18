FROM orbitci

ENV S6_OVERLAY_VERSION 1.21.8.0
ENV DB mongodb
ENV DB_ENDPOINT localhost

ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-amd64.tar.gz /tmp/
RUN tar xzf /tmp/s6-overlay-amd64.tar.gz -C / && \
    apt-get update && \
    apt-get install -y mongodb

ADD ./services /etc/services.d

ENTRYPOINT [ "/init" ]
