FROM python:3.7-alpine

ENV MODE standalone
ENV SFKO_CONF_DIR /config

ADD https://github.com/just-containers/s6-overlay/releases/download/v1.21.7.0/s6-overlay-amd64.tar.gz /tmp/
RUN tar xzf /tmp/s6-overlay-amd64.tar.gz -C /

ADD ./requirements.txt /tmp/

RUN apk add -U --no-cache openssl libffi coreutils su-exec && \
    apk add -U --no-cache --virtual .build-deps g++ musl-dev libffi-dev openssl-dev && \
    pip install -r /tmp/requirements.txt && \
    apk del .build-deps && \
    addgroup -S sfko && adduser -S -G sfko sfko && \
    mkdir -p /config

VOLUME [ "/config" ]

EXPOSE 8080 8081

ADD ./s6 /etc

ADD . /usr/bin/sfko

CMD ["/init"]
