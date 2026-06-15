#!/usr/bin/env bash
set -euo pipefail

SQL_DIR="${SQL_DIR:-/opt/zenko-analytics-bootstrap/sql}"
CLICKHOUSE_HOST="${CLICKHOUSE_HOST:?missing CLICKHOUSE_HOST}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-9000}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-analytics}"
CLICKHOUSE_PASSWORD="${CLICKHOUSE_PASSWORD:?missing CLICKHOUSE_PASSWORD}"
CLICKHOUSE_CONNECT_RETRIES="${CLICKHOUSE_CONNECT_RETRIES:-60}"
CLICKHOUSE_CONNECT_SLEEP_SECONDS="${CLICKHOUSE_CONNECT_SLEEP_SECONDS:-5}"

client_args=(
    --host "$CLICKHOUSE_HOST"
    --port "$CLICKHOUSE_PORT"
    --user "$CLICKHOUSE_USER"
    --password "$CLICKHOUSE_PASSWORD"
)

echo "Waiting for ClickHouse at ${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}"
for attempt in $(seq 1 "$CLICKHOUSE_CONNECT_RETRIES"); do
    if clickhouse-client "${client_args[@]}" --query "SELECT 1" >/dev/null 2>&1; then
        echo "ClickHouse is reachable"
        break
    fi

    if [ "$attempt" -eq "$CLICKHOUSE_CONNECT_RETRIES" ]; then
        echo "ClickHouse did not become reachable after ${CLICKHOUSE_CONNECT_RETRIES} attempts" >&2
        exit 1
    fi

    sleep "$CLICKHOUSE_CONNECT_SLEEP_SECONDS"
done

shopt -s nullglob
sql_files=("$SQL_DIR"/*.sql)

if [ "${#sql_files[@]}" -eq 0 ]; then
    echo "No SQL files found in ${SQL_DIR}" >&2
    exit 1
fi

for sql_file in "${sql_files[@]}"; do
    echo "Applying ${sql_file}"
    clickhouse-client "${client_args[@]}" --multiquery --queries-file "$sql_file"
done

echo "Zenko analytics bootstrap completed"
