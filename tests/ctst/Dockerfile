ARG CTST_TAG
FROM registry.scality.com/cli-testing-dev/cli-testing:6876899237c6faab215885e0ea87d225afecdac7

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
