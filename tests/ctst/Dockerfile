ARG CTST_TAG
FROM registry.scality.com/cli-testing/cli-testing:$CTST_TAG

COPY package.json /tmp/package.json
COPY ./features /ctst/features
COPY ./common /ctst/common
COPY ./steps /ctst/steps
COPY ./world /ctst/world

WORKDIR /ctst

CMD ["./run"]
