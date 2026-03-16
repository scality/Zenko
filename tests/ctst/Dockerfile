ARG SORBET_IMAGE=ghcr.io/scality/sorbet
ARG SORBET_TAG=latest
ARG DRCTL_IMAGE=ghcr.io/scality/zenko-drctl
ARG DRCTL_TAG=latest

FROM $SORBET_IMAGE:$SORBET_TAG AS sorbet
FROM $DRCTL_IMAGE:$DRCTL_TAG AS drctl

FROM node:22.19.0-bookworm-slim

ARG AWSCLI_VERSION=2.17.39

# Default to SDK mode (faster than CLI mode)
ENV SDK=true

RUN mkdir -p /ctst

WORKDIR /ctst

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    build-essential \
    ssh \
    git \
    curl \
    unzip \
    jq \
    ca-certificates \
    librdkafka-dev \
    zlib1g-dev \
    libssl-dev \
    libffi-dev \
    libzstd-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-${AWSCLI_VERSION}.zip" -o "awscliv2.zip" -k \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws

COPY package.json ./
COPY yarn.lock ./

RUN --mount=type=secret,id=GIT_AUTH_TOKEN \
    git config --global url."https://x-access-token:$(cat /run/secrets/GIT_AUTH_TOKEN)@github.com/".insteadOf "https://github.com/" && \
    yarn cache clean && \
    yarn install --frozen-lockfile

COPY ./features ./features
COPY ./common ./common
COPY ./steps ./steps
COPY ./world ./world
COPY ./tsconfig.json ./
COPY ./cucumber.config.cjs ./

COPY --from=sorbet /sorbetctl .
COPY --from=drctl /zenko-drctl .
