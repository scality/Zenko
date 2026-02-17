FROM ubuntu:22.04

ENV MOCHA_TAGS not:flaky
ENV LANG C.UTF-8

# Add Node.js PPA
RUN apt-get update && apt install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -

# Install dependencies
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    nodejs \
    git \
    python3.11 \
    python3-pip \
    gcc \
    libffi-dev \
    musl-dev \
    libssl-dev && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 0 && \
    mkdir -p /usr/local/bin/tests/node_tests

COPY ./node_tests/package.json ./node_tests/package-lock.json /usr/local/bin/tests/node_tests/
COPY ./requirements.txt /tmp

RUN python3 -m pip install -r /tmp/requirements.txt tox && \
    cd /usr/local/bin/tests/node_tests && \
    npm install && \
    rm -rf /var/cache/apk/* && \
    npm cache clear --force && \
    rm -rf ~/.node-gyp && \
    rm -rf /tmp/npm-* && \
    rm -rf /var/cache/apk/*

# Copy Tests
COPY . /usr/local/bin/tests/

WORKDIR /usr/local/bin/tests
