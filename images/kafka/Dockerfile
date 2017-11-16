FROM java:openjdk-8-jre
MAINTAINER Vianney Rancurel <vr@scality.com>

ENV KAFKA_VERSION="0.10.2.1"
ENV SCALA_VERSION="2.12"
ENV KAFKA_DIR="/opt/kafka_${SCALA_VERSION}-${KAFKA_VERSION}"

RUN apt-get update \
    && apt-get install -y supervisor curl --no-install-recommends \
    && mkdir -p /var/log/supervisor \
    && curl --retry 6 \
    -Ls "http://www-us.apache.org/dist/kafka/${KAFKA_VERSION}/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz" > /tmp/kafka.tgz && \
    mkdir -p /opt && \
    cd /opt && \
    tar zxvf /tmp/kafka.tgz && \
    rm /tmp/kafka.tgz

WORKDIR ${KAFKA_DIR}

COPY server.properties.backbeat ${KAFKA_DIR}/config
COPY zookeeper.properties.backbeat ${KAFKA_DIR}/config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

VOLUME ["/data"]

# 2181 is zookeeper, 9092 is kafka
EXPOSE 2181 9092

CMD supervisord -c /etc/supervisor/supervisord.conf -n
