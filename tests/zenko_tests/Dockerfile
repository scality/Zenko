FROM node:22.19.0-bookworm-slim

ENV MOCHA_TAGS=not:flaky
ENV LANG=C.UTF-8

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libffi-dev \
    musl-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && mkdir -p /usr/local/bin/tests/node_tests

ENV PATH=/opt/venv/bin:$PATH

COPY ./node_tests/package.json ./node_tests/yarn.lock /usr/local/bin/tests/node_tests/
COPY ./requirements.txt /tmp

RUN python3 -m venv /opt/venv && \
    pip install --no-cache-dir -U pip setuptools wheel && \
    pip install --no-cache-dir -r /tmp/requirements.txt tox && \
    cd /usr/local/bin/tests/node_tests && \
    yarn cache clean && \
    yarn install --frozen-lockfile

# Copy Tests
COPY . /usr/local/bin/tests/

WORKDIR /usr/local/bin/tests
