ARG CTST_TAG
FROM registry.scality.com/cli-testing-dev/cli-testing:592fbad0173032ab2960c38c64cee83bdb3f25b7

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
