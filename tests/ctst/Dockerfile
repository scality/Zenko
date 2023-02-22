ARG CTST_TAG
# TODO remove dev once done testing
FROM registry.scality.com/cli-testing/cli-testing:$CTST_TAG

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
