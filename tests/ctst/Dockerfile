ARG CTST_TAG
FROM registry.scality.com/cli-testing-dev/cli-testing:f02aaed861baea25424453b6eb92771916c6a68f

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
