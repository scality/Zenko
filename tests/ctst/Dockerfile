ARG CTST_TAG
FROM ghcr.io/scality/cli-testing:$CTST_TAG

COPY package.json /tmp/package.json
COPY ./features /ctst/features
COPY ./common /ctst/common
COPY ./steps /ctst/steps
COPY ./world /ctst/world

USER root

RUN chmod 0777 -R /tmp/
RUN chmod 0777 -R /ctst/

ENV SDK=true

WORKDIR /ctst

CMD ["./run"]
