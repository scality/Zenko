# syntax=docker/dockerfile:1

ARG JMX_JAVAAGENT_IMAGE
ARG JMX_JAVAAGENT_TAG
ARG KAFKA_IMAGE
ARG KAFKA_TAG

# Get prometheus jmx exporter from the jmx-javaagent image
FROM ${JMX_JAVAAGENT_IMAGE}:${JMX_JAVAAGENT_TAG} AS jmx-exporter

# Get mongodb connector
FROM library/alpine:3.15 AS mongodb-connector
RUN apk update && apk upgrade && apk add --no-cache curl zip

ARG MONGODB_CONNECTOR_TAG
WORKDIR /tmp
RUN curl -LO https://repo1.maven.org/maven2/org/mongodb/kafka/mongo-kafka-connect/${MONGODB_CONNECTOR_TAG}/mongo-kafka-connect-${MONGODB_CONNECTOR_TAG}-all.jar && \
    mv /tmp/mongo-kafka-connect-${MONGODB_CONNECTOR_TAG}-all.jar /tmp/mongo-kafka-connect.jar

# Build Scality SMT plugin
FROM maven:3.9-eclipse-temurin-17 AS smt-build
ARG KAFKA_VERSION
WORKDIR /build
COPY smt/ ./
RUN mvn -B -Dkafka.version=${KAFKA_VERSION} package

# Use Kafka base image
FROM ${KAFKA_IMAGE}:${KAFKA_TAG}

ARG JMX_JAVAAGENT_TAG
COPY kafka-connect.yaml /etc/jmx-exporter/config.yaml
COPY --from=jmx-exporter /opt/jmx_exporter/jmx_prometheus_javaagent-${JMX_JAVAAGENT_TAG}.jar \
     /opt/jmx-exporter/jmx_prometheus.jar

COPY connect-log4j.properties ${KAFKA_HOME}/config/
ENV KAFKA_OPTS=-javaagent:/opt/jmx-exporter/jmx_prometheus.jar=9020:/etc/jmx-exporter/config.yaml

# mongodb ingestor
COPY --from=mongodb-connector /tmp/mongo-kafka-connect.jar /usr/local/share/kafka/plugins/

# scality smt plugin
COPY --from=smt-build /build/target/scality-kafka-connect-transforms-*.jar \
     /usr/local/share/kafka/plugins/
