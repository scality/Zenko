ARG CTST_TAG
FROM registry.scality.com/cli-testing-dev/cli-testing:4cd50bd8139508e2e7b7164bf357866ceffa420f

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
