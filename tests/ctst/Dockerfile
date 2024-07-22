ARG CTST_TAG
ARG DRCTL_TAG
ARG HOME

FROM ghcr.io/scality/zenko-drctl:$DRCTL_TAG as drctl
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

COPY --from=drctl /zenko-drctl .
COPY $HOME/.kube/config /ctst/kubeconfig

CMD ["./run"]
