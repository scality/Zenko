ARG IMAGE_VER=3.4.11

FROM zookeeper:${IMAGE_VER}

ARG VERSION=0.2.0
ARG PROMETHEUS_AGENT_FILENAME=jmx_prometheus_javaagent-${VERSION}.jar
ARG MD5SUM=5aed7dd0f6ed8bdf62a303db5d18410d

RUN set -x \
    && echo "${MD5SUM}  ${PROMETHEUS_AGENT_FILENAME}" > MD5SUM \
    && wget -q "https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.2.0/jmx_prometheus_javaagent-0.2.0.jar" \
    && md5sum -c MD5SUM \
    && mkdir -p /opt/jmx_prometheus_javaagent/ \
    && mv ${PROMETHEUS_AGENT_FILENAME} /opt/jmx_prometheus_javaagent/

COPY zkOk.sh zkMetrics.sh /usr/local/bin/
COPY prometheus_agent.yml /etc/prometheus_agent.yml
COPY kubernetes-entrypoint.sh /

ENV PROMETHEUS_PORT=9141

ENTRYPOINT ["/kubernetes-entrypoint.sh"]
