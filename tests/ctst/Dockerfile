ARG SORBET_TAG=latest
ARG CTST_TAG=latest
ARG DRCTL_TAG=latest
ARG GIT_ACCESS_TOKEN=

FROM ghcr.io/scality/sorbet:$SORBET_TAG AS sorbet
FROM ghcr.io/scality/zenko-drctl:$DRCTL_TAG AS drctl
FROM ghcr.io/scality/cli-testing:$CTST_TAG

COPY package.json /tmp/package.json

USER root
RUN npm install typescript@5.9.2 -g

# Configure git to use the access token for private repositories
RUN git config --global url.https://x-access-token:${GIT_ACCESS_TOKEN}@github.com/.insteadOf https://github.com/ && \
    git config --global url.https://x-access-token:${GIT_ACCESS_TOKEN}@github.com/.insteadOf github.com: && \
    git config --global url.https://x-access-token:${GIT_ACCESS_TOKEN}@github.com/.insteadOf ssh://git@github.com/

# CTST does it if needed, but better to merge dependencies
# here so we benefit from Docker layer caching
WORKDIR /ctst
RUN merge-packages /tmp/package.json package.json --output package.json && \
    jq 'del(.devDependencies)' package.json > package.json.tmp && \
    mv package.json.tmp package.json && \
    echo "Merged package.json:" && cat package.json && \
    yarn install --prod --network-concurrency=1 && \
    yarn cache clean && \
    echo "Dependencies pre-installed at build time - runtime will skip installation" && \
    touch .init

COPY ./features /ctst/features
COPY ./common /ctst/common
COPY ./steps /ctst/steps
COPY ./world /ctst/world

RUN chmod 0777 -R /tmp/
RUN chmod 0777 -R /ctst/

ENV SDK=true

COPY --from=sorbet /sorbetctl .
COPY --from=drctl /zenko-drctl .

CMD ["./run"]
