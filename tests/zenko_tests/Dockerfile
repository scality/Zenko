FROM ubuntu:18.04

ENV MOCHA_TAGS not:flaky
ENV LANG C.UTF-8

# Install dependencies
RUN apt-get -y update
RUN apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    node-gyp \
    nodejs-dev \
    npm \
    python3-pip \
    gcc \
    libffi-dev \
    musl-dev \
    curl \
    libssl1.0-dev && \
    mkdir -p /usr/local/bin/tests/node_tests

COPY ./node_tests/package.json ./node_tests/package-lock.json /usr/local/bin/tests/node_tests/
COPY ./python_tests/requirements.txt /tmp

RUN python3 -m pip install -r /tmp/requirements.txt tox && \
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
