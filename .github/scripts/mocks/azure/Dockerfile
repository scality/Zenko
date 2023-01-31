FROM mcr.microsoft.com/azure-storage/azurite:3.21.0

RUN apk add -U --no-cache python3 py3-pip ca-certificates \
    && apk add -U --no-cache --virtual .build-deps \
        python3-dev \
        linux-headers \
        musl-dev \
        libffi-dev \
        gcc \
        make \
        openssl-dev \
    && python3 -m pip install --upgrade pip \
    && python3 -m pip install azure-cli \
    && apk del .build-deps \
    && mkdir -p /usr/src/app

ADD docker-entrypoint.sh /

ENTRYPOINT [ "/docker-entrypoint.sh" ]
