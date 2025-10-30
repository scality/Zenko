FROM node:22-alpine

RUN apk add --no-cache \
    curl \
    git \
    bash \
    jq \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++

RUN yarn global add typescript@5.9.2

RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

RUN curl -fsSL https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar -xzC /tmp && \
    mv /tmp/linux-amd64/helm /usr/local/bin/helm && \
    chmod +x /usr/local/bin/helm

WORKDIR /app

COPY package.json yarn.lock ./

ARG GIT_ACCESS_TOKEN=
RUN git config --global url.https://x-access-token:${GIT_ACCESS_TOKEN}@github.com/.insteadOf https://github.com/ && \
    git config --global url.https://x-access-token:${GIT_ACCESS_TOKEN}@github.com/.insteadOf github.com: && \
    git config --global url.https://x-access-token:${GIT_ACCESS_TOKEN}@github.com/.insteadOf ssh://git@github.com/ && \
    yarn install --network-concurrency=1 && \
    git config --global --unset url.https://x-access-token:${GIT_ACCESS_TOKEN}@github.com/.insteadOf || true

COPY . .

COPY mocks/mock-metadata.tar.gz /setup/mock-metadata.tar.gz

RUN yarn build

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

RUN chown -R nextjs:nodejs /app
USER nextjs

ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]