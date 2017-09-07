FROM java:openjdk-8-jre

ENV KAFKA_VERSION="0.10.2.1"
ENV SCALA_VERSION="2.12"
ENV KAFKA_DIR="/opt/kafka_${SCALA_VERSION}-${KAFKA_VERSION}"

VOLUME /logs
VOLUME /conf
VOLUME /data

RUN curl --retry 6 \
    -Ls "http://www-us.apache.org/dist/kafka/${KAFKA_VERSION}/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz" > /tmp/kafka.tgz && \
    cd /opt && \
    tar zxvf /tmp/kafka.tgz && \
    rm /tmp/kafka.tgz

COPY server.properties.backbeat /conf/server.properties

WORKDIR ${KAFKA_DIR}
CMD bin/kafka-server-start.sh /conf/server.properties
