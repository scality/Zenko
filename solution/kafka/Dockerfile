ARG scala_version=2.13
ARG kafka_version=3.9.1

FROM ghcr.io/adobe/koperator/kafka:${scala_version}-${kafka_version}

ENV KAFKA_GC_LOG_OPTS=-Dnogclog
COPY log4j.properties ${KAFKA_HOME}/config/
