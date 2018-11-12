FROM alpine:3.8

ENV MOCHA_TAGS not:flaky
ENV LANG C.UTF-8

# Install dependencies
RUN apk add -U \
    nodejs \
    npm \
    python3 \
    gcc \
    libffi-dev \
    python3-dev \
    musl-dev \
    curl \
    openssl-dev && \
    mkdir -p /usr/local/bin/tests/node_tests

COPY ./node_tests/package.json ./node_tests/package-lock.json /usr/local/bin/tests/node_tests/
COPY ./python_tests/requirements.txt /tmp

RUN python3 -m pip install -r /tmp/requirements.txt tox kubernetes && \
    cd /usr/local/bin/tests/node_tests && \
    npm install && \
    rm -rf /var/cache/apk/* && \
    npm cache clear --force && \
    rm -rf ~/.node-gyp && \
    rm -rf /tmp/npm-* && \
    rm -rf /var/cache/apk/*

COPY ./node_tests/npm_chain.sh ./docker-entrypoint.sh ./wait_for_ceph.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/npm_chain.sh /usr/local/bin/docker-entrypoint.sh /usr/local/bin/wait_for_ceph.sh

# Copy Tests
COPY . /usr/local/bin/tests/

WORKDIR /usr/local/bin/tests

CMD [ "docker-entrypoint.sh" ]
