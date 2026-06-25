CREATE DATABASE IF NOT EXISTS logs;

-- Shared ingest entry point (Null engine): the CloudServer Fluent Bit sidecar
-- posts every S3 access-log line here over HTTP. The Null engine stores nothing
-- itself; attached materialized views transform and route the data. This table
-- is a superset of fields so downstream views can project what they need.
CREATE TABLE IF NOT EXISTS logs.access_logs_ingest
(
    timestamp              DateTime DEFAULT now(),
    insertedAt             DateTime DEFAULT now(),
    hostname               LowCardinality(Nullable(String)),
    action                 LowCardinality(Nullable(String)),
    accountName            Nullable(String),
    userName               Nullable(String),
    httpMethod             LowCardinality(Nullable(String)),
    bytesDeleted           Nullable(UInt64),
    bytesReceived          Nullable(UInt64),
    bodyLength             Nullable(UInt64),
    contentLength          Nullable(UInt64),
    elapsed_ms             Nullable(Float32),
    rateLimited            Nullable(Bool),
    rateLimitSource        LowCardinality(Nullable(String)),
    startTime              Nullable(DateTime64(3)),
    requester              Nullable(String),
    operation              Nullable(String),
    requestURI             Nullable(String),
    errorCode              Nullable(String),
    objectSize             Nullable(UInt64),
    totalTime              Nullable(Float32),
    turnAroundTime         Nullable(Float32),
    referer                Nullable(String),
    userAgent              Nullable(String),
    versionId              Nullable(String),
    signatureVersion       LowCardinality(Nullable(String)),
    cipherSuite            LowCardinality(Nullable(String)),
    authenticationType     LowCardinality(Nullable(String)),
    hostHeader             Nullable(String),
    tlsVersion             LowCardinality(Nullable(String)),
    aclRequired            LowCardinality(Nullable(String)),
    bucketOwner            Nullable(String),
    bucketName             String DEFAULT '',
    req_id                 String DEFAULT '',
    bytesSent              Nullable(UInt64),
    clientIP               Nullable(String),
    httpCode               Nullable(UInt16),
    objectKey              Nullable(String),
    logFormatVersion       LowCardinality(Nullable(String)),
    loggingEnabled         Bool DEFAULT false,
    loggingTargetBucket    String DEFAULT '',
    loggingTargetPrefix    String DEFAULT '',
    awsAccessKeyID         Nullable(String),
    raftSessionID          UInt16 DEFAULT 0
)
Engine = Null();

-- Aggregated S3 analytics rollup: this is the supported Artesca analytics table.
-- SummingMergeTree collapses per-request rows into per-(account, bucket, method,
-- code, action, user, host, time) counters, keeping storage and query cost low.
-- TTL downsamples old data: per-minute after 14d, per-hour after 60d, drop at 360d.
CREATE TABLE IF NOT EXISTS logs.cloudserver_aggregated
(
    timestamp          DateTime,
    hostname           LowCardinality(String),
    action             LowCardinality(String),
    accountName        String,
    bucketName         String,
    httpMethod         LowCardinality(String),
    httpCode           UInt16,
    userName           String,

    bytesDeleted       UInt64,
    bytesReceived      UInt64,
    bytesSent          UInt64,
    bodyLength         UInt64,
    contentLength      UInt64,
    total_elapsed_ms   Float64,

    number_of_op       UInt64,

    rate_limited_count        UInt64 DEFAULT 0,
    rate_limited_global_count UInt64 DEFAULT 0,
    rate_limited_bucket_count UInt64 DEFAULT 0
)
Engine = SummingMergeTree()
PARTITION BY toStartOfDay(timestamp)
ORDER BY (accountName,
          bucketName,
          httpCode,
          httpMethod,
          action,
          userName,
          hostname,
          toStartOfHour(timestamp),
          toStartOfMinute(timestamp),
          timestamp)
TTL
    timestamp + INTERVAL 14 DAY
        GROUP BY accountName, bucketName, httpCode, httpMethod, action, userName, hostname,
            toStartOfHour(timestamp), toStartOfMinute(timestamp)
        SET
            bytesDeleted = sum(bytesDeleted),
            bytesReceived = sum(bytesReceived),
            bytesSent = sum(bytesSent),
            bodyLength = sum(bodyLength),
            contentLength = sum(contentLength),
            total_elapsed_ms = sum(total_elapsed_ms),
            timestamp = toStartOfMinute(min(timestamp)),
            number_of_op = sum(number_of_op),
            rate_limited_count = sum(rate_limited_count),
            rate_limited_global_count = sum(rate_limited_global_count),
            rate_limited_bucket_count = sum(rate_limited_bucket_count),
    timestamp + INTERVAL 60 DAY
        GROUP BY accountName, bucketName, httpCode, httpMethod, action, userName, hostname,
            toStartOfHour(timestamp)
        SET
            bytesDeleted = sum(bytesDeleted),
            bytesReceived = sum(bytesReceived),
            bytesSent = sum(bytesSent),
            bodyLength = sum(bodyLength),
            contentLength = sum(contentLength),
            total_elapsed_ms = sum(total_elapsed_ms),
            timestamp = toStartOfHour(min(timestamp)),
            number_of_op = sum(number_of_op),
            rate_limited_count = sum(rate_limited_count),
            rate_limited_global_count = sum(rate_limited_global_count),
            rate_limited_bucket_count = sum(rate_limited_bucket_count),
    timestamp + INTERVAL 360 DAY DELETE;

-- Materialized view feeding the rollup from the shared ingest table. Internal
-- sub-operations are excluded so dashboard counts are not inflated.
CREATE MATERIALIZED VIEW IF NOT EXISTS logs.cloudserver_aggregated_from_access_logs_mv
TO logs.cloudserver_aggregated
AS
SELECT
    timestamp,
    coalesce(hostname, '')    AS hostname,
    coalesce(action, '')      AS action,
    coalesce(accountName, '') AS accountName,
    bucketName,
    coalesce(httpMethod, '')  AS httpMethod,
    coalesce(httpCode, 0)     AS httpCode,
    coalesce(userName, '')    AS userName,
    sum(coalesce(bytesDeleted, 0))   AS bytesDeleted,
    sum(coalesce(bytesReceived, 0))  AS bytesReceived,
    sum(coalesce(bytesSent, 0))      AS bytesSent,
    sum(coalesce(bodyLength, 0))     AS bodyLength,
    sum(coalesce(contentLength, 0))  AS contentLength,
    sum(coalesce(elapsed_ms, 0))     AS total_elapsed_ms,
    count()                          AS number_of_op,
    countIf(rateLimited = true)                                   AS rate_limited_count,
    countIf(rateLimited = true AND rateLimitSource = 'global')    AS rate_limited_global_count,
    countIf(rateLimited = true AND rateLimitSource = 'bucket')    AS rate_limited_bucket_count
FROM logs.access_logs_ingest
WHERE operation NOT IN (
    'BATCH.DELETE.OBJECT',  -- per-key sub-operations of a multi-object delete
    'REST.COPY.OBJECT_GET', -- source read of a server-side copy
    'REST.COPY.PART_GET'    -- source read of a server-side copy part
)
GROUP BY
    1, -- timestamp
    2, -- hostname
    3, -- action
    4, -- accountName
    5, -- bucketName
    6, -- httpMethod
    7, -- httpCode
    8; -- userName

-- Cluster-wide read entry point. Consumers (dashboards, read_logs) query this
-- Distributed table rather than the per-node SummingMergeTree.
CREATE TABLE IF NOT EXISTS logs.cloudserver_aggregated_federated
AS logs.cloudserver_aggregated
ENGINE = Distributed(analytics, logs, cloudserver_aggregated);
