FROM ubuntu:22.04

ENV MOCHA_TAGS=not:flaky
ENV LANG=C.UTF-8

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

COPY ./node_tests/package.json ./node_tests/yarn.lock /usr/local/bin/tests/node_tests/

# Install dependencies
RUN npm install --global yarn
RUN yarn install

# Copy Tests
COPY . /usr/local/bin/tests/

WORKDIR /usr/local/bin/tests
