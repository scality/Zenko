FROM clickhouse/clickhouse-server:25.3

COPY entrypoint.sh /usr/local/bin/zenko-analytics-bootstrap
COPY sql/ /opt/zenko-analytics-bootstrap/sql/

RUN chmod 0755 /usr/local/bin/zenko-analytics-bootstrap

ENTRYPOINT ["/usr/local/bin/zenko-analytics-bootstrap"]
