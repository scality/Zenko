ARG SORBET_TAG=latest
ARG CTST_TAG=latest
ARG DRCTL_TAG=latest

FROM ghcr.io/scality/sorbet:$SORBET_TAG AS sorbet
FROM ghcr.io/scality/zenko-drctl:$DRCTL_TAG AS drctl
FROM ghcr.io/scality/cli-testing:$CTST_TAG

COPY package.json /tmp/package.json
COPY ./features /ctst/features
COPY ./common /ctst/common
COPY ./steps /ctst/steps
COPY ./world /ctst/world

USER root
RUN npm install typescript@5.8.3 -g

RUN chmod 0777 -R /tmp/
RUN chmod 0777 -R /ctst/

ENV SDK=true

WORKDIR /ctst

COPY --from=sorbet /sorbetctl .
COPY --from=drctl /zenko-drctl .

CMD ["./run"]
