# Zenko Analytics Bootstrap

This image owns the ClickHouse schema bootstrap for the Zenko S3 access-log
analytics pipeline.

The Kubernetes operator is expected to create a Job from this image and provide
ClickHouse connection settings through environment variables:

- `CLICKHOUSE_HOST`
- `CLICKHOUSE_PORT`
- `CLICKHOUSE_USER`
- `CLICKHOUSE_PASSWORD`

At startup, the entrypoint waits for ClickHouse to become reachable, then applies
all `*.sql` files from `/opt/zenko-analytics-bootstrap/sql` in lexical order.

Keeping the SQL here mirrors the S3C/Federation deployment model, where the
analytics deployment package owns ClickHouse schema files and migrations while
the deployment orchestrator only wires and runs them.
