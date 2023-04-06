ARG CTST_TAG
FROM registry.scality.com/cli-testing-dev/cli-testing:024620d3dd73e64982dab2d7ca349d4289c45d29

COPY package.json /tmp/package.json
COPY ./features /ctst/features
COPY ./common /ctst/common
COPY ./steps /ctst/steps
COPY ./world /ctst/world

USER root

RUN chmod 0777 -R /tmp/
RUN chmod 0777 -R /ctst/

WORKDIR /ctst

CMD ["./run"]
