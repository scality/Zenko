from grafanalib.core import (
    ConstantInput,
    DataSourceInput,
    GridPos,
    Heatmap,
    HeatmapColor,
    Repeat,
    RowPanel,
    Template,
    Templating,
    Threshold,
    YAxis,
)
from grafanalib import core
from grafanalib import formatunits as UNITS
from scalgrafanalib import (
    layout,
    metrics,
    Dashboard,
    GaugePanel,
    PieChart,
    Stat,
    Target,
    TimeSeries,
    Tooltip,
    StateTimeline,
)

# Constants
DATASOURCE = "${DS_PROMETHEUS}"

RS_STATE_PRIMARY = "1"
RS_STATE_SECONDARY = "2"

POD_PATTERN = "${jobs}.*"
JOB_PATTERN = "${namespace}/${jobs}"
JOB_FILTER = f'job=~"{JOB_PATTERN}"'
DATABASE_FILTER_USER = 'database!~"admin|config|local"'
DATABASE_FILTER_SYSTEM = 'database=~"admin|config|local"'

# Common thresholds
THRESHOLDS = {
    "green_red": [
        Threshold("green", 0, 0.0),
        Threshold("red", 1, 80.0),
    ],
    "oplog_window": [
        Threshold("red", 0, 0.0),
        Threshold("orange", 1, 600.0),
        Threshold("green", 2, 900.0),
    ],
    "disk_usage": [
        Threshold("green", 0, 0.0),
        Threshold("orange", 1, 70.0),
        Threshold("red", 2, 90.0),
    ],
    "connections": [
        Threshold("green", 0, 0.0),
        Threshold("yellow", 1, 300.0),
        Threshold("orange", 2, 400.0),
        Threshold("red", 3, 500.0),
    ],
    "latency": [
        Threshold("green", 0, 0.0),
        Threshold("yellow", 1, 1000.0),
        Threshold("orange", 2, 5000.0),
        Threshold("red", 3, 100000.0),
    ],
    "queue_ops": [
        Threshold("green", 0, 0.0),
        Threshold("orange", 1, 1.0),
        Threshold("red", 2, 2.0),
    ],
    "query_exec": [
        Threshold("green", 0, 0.0),
        Threshold("green", 1, 1000.0),
        Threshold("yellow", 2, 10000.0),
        Threshold("orange", 3, 100000.0),
        Threshold("red", 4, 1000000.0),
    ],
    "write_conflicts": [
        Threshold("green", 0, 0.0),
        Threshold("orange", 1, 5.0),
        Threshold("red", 2, 10.0),
    ],
    "replication_lag": [
        Threshold("transparent", 0, 0.0),
        Threshold("red", 1, 10.0),
    ],
}

MONGODB_STATES_MAPPINGS = [
    core.StatValueMappings(
        core.StatValueMappingItem(text="STARTUP", mapValue="0", color="", index=11),
        core.StatValueMappingItem(text="PRIMARY", mapValue="1", color="blue", index=4),
        core.StatValueMappingItem(
            text="SECONDARY", mapValue="2", color="purple", index=3
        ),
        core.StatValueMappingItem(text="RECOVERING", mapValue="3", color="", index=10),
        core.StatValueMappingItem(text="STARTUP2", mapValue="4", color="", index=12),
        core.StatValueMappingItem(text="STARTUP2", mapValue="5", color="", index=9),
        core.StatValueMappingItem(text="UNKNOWN", mapValue="6", color="", index=8),
        core.StatValueMappingItem(
            text="ARBITER", mapValue="7", color="#8B8000", index=1
        ),
        core.StatValueMappingItem(text="DOWN", mapValue="8", color="", index=7),
        core.StatValueMappingItem(text="ROLLBACK", mapValue="9", color="", index=6),
        core.StatValueMappingItem(text="REMOVED", mapValue="10", color="", index=5),
        core.StatValueMappingItem(
            text="Exporter is not connected", mapValue="null", color="#FF7383", index=2
        ),
    )
]


class Metrics:
    """MongoDB metrics using structured approach"""

    # Core MongoDB metrics
    UP = metrics.Metric("mongodb_up", "job", namespace="${namespace}").with_defaults(
        JOB_FILTER
    )

    VERSION_INFO = metrics.Metric(
        "mongodb_version_info", "job", "mongodb", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    REPLSET_STATE = metrics.Metric(
        "mongodb_mongod_replset_my_state", "job", "pod", namespace="${namespace}"
    )

    OPLOG_HEAD_TIMESTAMP = metrics.Metric(
        "mongodb_mongod_replset_oplog_head_timestamp", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    OPLOG_TAIL_TIMESTAMP = metrics.Metric(
        "mongodb_mongod_replset_oplog_tail_timestamp", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    # Database stats
    DBSTATS_FS_USED_SIZE = metrics.Metric(
        "mongodb_dbstats_fsUsedSize",
        "database",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    DBSTATS_FS_TOTAL_SIZE = metrics.Metric(
        "mongodb_dbstats_fsTotalSize",
        "database",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    DBSTATS_INDEX_SIZE = metrics.Metric(
        "mongodb_dbstats_indexSize",
        "database",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    DBSTATS_AVG_OBJ_SIZE = metrics.Metric(
        "mongodb_dbstats_avgObjSize",
        "database",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    DBSTATS_OBJECTS = metrics.Metric(
        "mongodb_dbstats_objects",
        "database",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    DBSTATS_STORAGE_SIZE = metrics.Metric(
        "mongodb_dbstats_storageSize", "database", "job", namespace="${namespace}"
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    DBSTATS_INDEXES = metrics.Metric(
        "mongodb_dbstats_indexes",
        "database",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    DB_COLLECTIONS_TOTAL = metrics.Metric(
        "mongodb_mongod_db_collections_total",
        "database",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(DATABASE_FILTER_USER, JOB_FILTER)

    # Server stats
    SS_CONNECTIONS = metrics.Metric(
        "mongodb_ss_connections", "conn_type", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_OPCOUNTERS = metrics.CounterMetric(
        "mongodb_ss_opcounters",
        "legacy_op_type",
        "job",
        "rs_state",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_OPCOUNTERS_REPL = metrics.CounterMetric(
        "mongodb_ss_opcountersRepl",
        "legacy_op_type",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_METRICS_CURSOR_OPEN = metrics.Metric(
        "mongodb_ss_metrics_cursor_open", "job", namespace="${namespace}", rs_state=RS_STATE_PRIMARY
    ).with_defaults(JOB_FILTER)

    SS_METRICS_TTL_DELETED_DOCUMENTS = metrics.CounterMetric(
        "mongodb_ss_metrics_ttl_deletedDocuments",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_METRICS_CURSOR_TOTAL_OPENED = metrics.CounterMetric(
        "mongodb_ss_metrics_cursor_totalOpened", "job", namespace="${namespace}", rs_state=RS_STATE_PRIMARY
    ).with_defaults(JOB_FILTER)

    SS_GLOBAL_LOCK_ACTIVE_CLIENTS_READERS = metrics.Metric(
        "mongodb_ss_globalLock_activeClients_readers", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_GLOBAL_LOCK_ACTIVE_CLIENTS_WRITERS = metrics.Metric(
        "mongodb_ss_globalLock_activeClients_writers", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_TRANSACTIONS_CURRENT_ACTIVE = metrics.Metric(
        "mongodb_ss_transactions_currentActive", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_TRANSACTIONS_CURRENT_INACTIVE = metrics.Metric(
        "mongodb_ss_transactions_currentInactive", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_GLOBAL_LOCK_CURRENT_QUEUE = metrics.Metric(
        "mongodb_ss_globalLock_currentQueue",
        "count_type",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    # Memory and system metrics
    SS_MEM_RESIDENT = metrics.Metric(
        "mongodb_ss_mem_resident", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_NETWORK_BYTES_IN = metrics.CounterMetric(
        "mongodb_ss_network_bytesIn", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_NETWORK_BYTES_OUT = metrics.CounterMetric(
        "mongodb_ss_network_bytesOut", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SYS_CPU_USER_MS = metrics.CounterMetric(
        "mongodb_sys_cpu_user_ms", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SYS_CPU_IOWAIT_MS = metrics.CounterMetric(
        "mongodb_sys_cpu_iowait_ms", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SYS_CPU_SYSTEM_MS = metrics.CounterMetric(
        "mongodb_sys_cpu_system_ms", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    # Replication metrics
    REPLSET_MEMBER_REPLICATION_LAG = metrics.Metric(
        "mongodb_mongod_replset_member_replication_lag", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    # Flow control
    SS_FLOW_CONTROL_IS_LAGGED_COUNT = metrics.CounterMetric(
        "mongodb_ss_flowControl_isLaggedCount", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_FLOW_CONTROL_IS_LAGGED_TIME_MICROS = metrics.CounterMetric(
        "mongodb_ss_flowControl_isLaggedTimeMicros", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    # Operation latencies
    MONGOD_OP_LATENCIES_LATENCY_TOTAL = metrics.CounterMetric(
        "mongodb_mongod_op_latencies_latency_total",
        "type",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    MONGOD_OP_LATENCIES_OPS_TOTAL = metrics.CounterMetric(
        "mongodb_mongod_op_latencies_ops_total", "type", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_OP_LATENCIES_LATENCY = metrics.CounterMetric(
        "mongodb_ss_opLatencies_latency", "op_type", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_OP_LATENCIES_OPS = metrics.CounterMetric(
        "mongodb_ss_opLatencies_ops", "op_type", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    # Global lock queues
    MONGOD_GLOBAL_LOCK_CURRENT_QUEUE = metrics.Metric(
        "mongodb_mongod_global_lock_current_queue",
        "type",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    # Write conflicts
    MONGOD_METRICS_OPERATION_TOTAL = metrics.CounterMetric(
        "mongodb_mongod_metrics_operation_total",
        "state",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    # WiredTiger metrics
    SS_WT_CACHE_PAGES_READ_INTO_CACHE = metrics.CounterMetric(
        "mongodb_ss_wt_cache_pages_read_into_cache",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_PAGES_REQUESTED_FROM_THE_CACHE = metrics.CounterMetric(
        "mongodb_ss_wt_cache_pages_requested_from_the_cache",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    MONGOD_METRICS_QUERY_EXECUTOR_TOTAL = metrics.CounterMetric(
        "mongodb_mongod_metrics_query_executor_total",
        "state",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    MONGOD_METRICS_DOCUMENT_TOTAL = metrics.CounterMetric(
        "mongodb_mongod_metrics_document_total",
        "state",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_EVICTION_WORKER_THREAD_CREATED = metrics.CounterMetric(
        "mongodb_ss_wt_cache_eviction_worker_thread_created",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_EVICTION_WORKER_THREAD_REMOVED = metrics.CounterMetric(
        "mongodb_ss_wt_cache_eviction_worker_thread_removed",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_EVICTION_WORKER_THREAD_ACTIVE = metrics.Metric(
        "mongodb_ss_wt_cache_eviction_worker_thread_active",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    MONGOD_WIREDTIGER_CONCURRENT_TRANSACTIONS_AVAILABLE_TICKETS = metrics.Metric(
        "mongodb_mongod_wiredtiger_concurrent_transactions_available_tickets",
        "txn_rw",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_EVICTION_WORKER_THREAD_EVICTING_PAGES = metrics.CounterMetric(
        "mongodb_ss_wt_cache_eviction_worker_thread_evicting_pages",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_BYTES_WRITTEN_FROM_CACHE = metrics.CounterMetric(
        "mongodb_ss_wt_cache_bytes_written_from_cache", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_BYTES_READ_INTO_CACHE = metrics.CounterMetric(
        "mongodb_ss_wt_cache_bytes_read_into_cache", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_MODIFIED_PAGES_EVICTED_BY_APPLICATION_THREADS = metrics.CounterMetric(
        "mongodb_ss_wt_cache_modified_pages_evicted_by_application_threads",
        "job",
        rs_state=RS_STATE_PRIMARY,
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    MONGOD_WIREDTIGER_CACHE_MAX_BYTES = metrics.Metric(
        "mongodb_mongod_wiredtiger_cache_max_bytes", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    MONGOD_WIREDTIGER_CACHE_BYTES = metrics.Metric(
        "mongodb_mongod_wiredtiger_cache_bytes", "job", namespace="${namespace}"
    ).with_defaults(JOB_FILTER)

    SS_WT_CACHE_TRACKED_DIRTY_BYTES_IN_THE_CACHE = metrics.Metric(
        "mongodb_ss_wt_cache_tracked_dirty_bytes_in_the_cache",
        "job",
        namespace="${namespace}",
    ).with_defaults(JOB_FILTER)

    # Sharding metrics
    MONGOS_SHARDING_CHUNKS_IS_BALANCED = metrics.Metric(
        "mongodb_mongos_sharding_chunks_is_balanced", "job", namespace="${namespace}"
    )

    # Container metrics for disk I/O
    CONTAINER_FS_READS_TOTAL = metrics.CounterMetric(
        "container_fs_reads_total", "pod", namespace="${namespace}"
    )
    CONTAINER_FS_WRITES_TOTAL = metrics.CounterMetric(
        "container_fs_writes_total", "pod", namespace="${namespace}"
    )
    CONTAINER_BLKIO_DEVICE_USAGE_TOTAL = metrics.CounterMetric(
        "container_blkio_device_usage_total",
        "operation",
        "pod",
        namespace="${namespace}",
    )


def mongodb_stat(title, expr="", **kwargs):
    """Create a MongoDB Stat panel with common settings"""
    defaults = {
        "targets": [],
        "colorMode": "value",
        "textMode": "auto",
        "format": "none",
        "thresholds": THRESHOLDS["green_red"],
    }

    merged_params = {**defaults, **kwargs}

    if expr and not merged_params.get("targets"):
        merged_params["targets"] = [Target(expr=expr)]

    return Stat(
        title=title,
        dataSource=DATASOURCE,
        **merged_params,
    )


def mongodb_timeseries(title, targets, **kwargs):
    """Create a MongoDB TimeSeries panel with common settings"""
    defaults = {
        "drawStyle": "line",
        "lineInterpolation": "linear",
        "lineWidth": 1,
        "fillOpacity": 20,
        "pointSize": 5,
        "showPoints": "never",
        "unit": "none",
        "thresholds": THRESHOLDS["green_red"],
        "legendCalcs": ["mean", "max", "min"],
    }

    merged_params = {**defaults, **kwargs}

    return TimeSeries(
        title=title,
        dataSource=DATASOURCE,
        targets=targets,
        **merged_params,
    )


def mongodb_state_timeline(title, expr, description="", mappings=None, **kwargs):
    """Create a MongoDB StateTimeline panel"""
    defaults = {
        "fillOpacity": 100,
        "lineWidth": 0,
        "showValue": "auto",
        "mergeValues": True,
        "rowHeight": 0.9,
        "colorMode": "palette-classic",
    }

    # Merge defaults with kwargs, with kwargs taking precedence
    merged_params = {**defaults, **kwargs}

    return StateTimeline(
        title=title,
        description=description,
        dataSource=DATASOURCE,
        mappings=mappings,
        targets=[Target(expr=expr, legendFormat="{{pod}}")],
        **merged_params,
    )


# Overview Panels
mongodb_services_state = mongodb_stat(
    "MongoDB services state",
    orientation="horizontal",
    targets=[
        Target(
            expr="sum(" + Metrics.UP() + ") by (job)",
            legendFormat="{{pod}}",
        )
    ],
)

version_panel = Stat(
    title="Version",
    dataSource=DATASOURCE,
    format="string",
    colorMode="none",
    orientation="horizontal",
    textMode="auto",
    reduceOptions={
        "calcs": ["lastNotNull"],
        "fields": "/^mongodb$/",
        "values": False,
    },
    targets=[
        Target(
            expr="group by (mongodb) (" + Metrics.VERSION_INFO() + ")",
            format="table",
            instant=True,
        )
    ],
)

disk_usage_pie = PieChart(
    title="Disk usage",
    dataSource=DATASOURCE,
    displayLabels=["value", "name", "percent"],
    legendDisplayMode="hidden",
    pieType="pie",
    unit=UNITS.BYTES,
    targets=[
        Target(
            expr="sum(" + Metrics.DBSTATS_INDEX_SIZE() + ")",
            legendFormat="Indexes",
        ),
        Target(
            expr="sum("
            + Metrics.DBSTATS_FS_USED_SIZE()
            + " - "
            + Metrics.DBSTATS_INDEX_SIZE()
            + ")",
            legendFormat="Documents",
        ),
        Target(
            expr="sum("
            + Metrics.DBSTATS_FS_TOTAL_SIZE()
            + " - "
            + Metrics.DBSTATS_FS_USED_SIZE()
            + ")",
            legendFormat="Free",
        ),
    ],
)

avg_doc_size = mongodb_stat(
    "Avg document size",
    expr="avg(" + Metrics.DBSTATS_AVG_OBJ_SIZE() + ")",
    format=UNITS.BYTES,
    decimals=1,
    description="Average size of documents in the database",
)

num_docs_per_shard = mongodb_stat(
    "Avg documents per shard",
    expr=Metrics.DBSTATS_OBJECTS(),
    textMode="value",
    noValue="0",
    colorMode="value",
    thresholds=[Threshold("blue", 0, 0.0)],
)

size_collections = mongodb_stat(
    "Size of Collections",
    format=UNITS.BYTES,
    description="MongoDB stores documents in collections. Collections are analogous to tables in relational databases.",
    targets=[
        Target(
            expr="sum(" + Metrics.DBSTATS_STORAGE_SIZE() + ")",
            format="table",
            instant=True,
            legendFormat="{{collection}}",
        )
    ],
)

index_size = mongodb_stat(
    "Index size",
    expr="max by(job) (" + Metrics.DBSTATS_INDEX_SIZE() + ")",
    format=UNITS.BYTES,
)

# Activity indicators for overview
current_operations = mongodb_stat(
    "Operations",
    expr="sum(rate(" + Metrics.SS_OPCOUNTERS() + "))",
    format=UNITS.OPS_PER_SEC,
    decimals=1,
    colorMode="value",
    thresholds=[Threshold("blue", 0, 0.0)],
    noValue="-",
    description="Total operations per second across selected jobs",
)

total_active_cursors = mongodb_stat(
    "Active Cursors",
    expr="sum(" + Metrics.SS_METRICS_CURSOR_OPEN() + ")",
    format="cursors",
    colorMode="value",
    thresholds=[Threshold("blue", 0, 0.0)],
    noValue="0",
    description="Total number of active cursors across selected jobs",
)

# Configsvr panels (admin/config/local databases)
docs_configsvr = mongodb_stat(
    "Documents: configsvr",
    expr="sum(" + Metrics.DBSTATS_OBJECTS(DATABASE_FILTER_SYSTEM) + ")",
    textMode="value",
    noValue="0",
    colorMode="value",
    thresholds=[Threshold("blue", 0, 0.0)],
    description="Number of documents in config server (admin/config/local databases)",
)

index_size_configsvr = mongodb_stat(
    "Index Size: configsvr",
    expr="sum(" + Metrics.DBSTATS_INDEX_SIZE(DATABASE_FILTER_SYSTEM) + ")",
    format=UNITS.BYTES,
    noValue="0",
    colorMode="value",
    thresholds=[Threshold("blue", 0, 0.0)],
    description="Total index size for config server (admin/config/local databases)",
)

# Shard distribution pie charts
docs_distribution_pie = PieChart(
    title="Documents Distribution Across Shards",
    dataSource=DATASOURCE,
    displayLabels=["value", "name", "percent"],
    legendDisplayMode="table",
    legendPlacement="right",
    pieType="pie",
    unit="short",
    targets=[
        Target(
            expr="sum by (pod) (" + Metrics.DBSTATS_OBJECTS() + ")",
            legendFormat="{{ pod }}",
        )
    ],
    description="Distribution of user documents across all shards",
)

index_size_distribution_pie = PieChart(
    title="Index Size Distribution Across Shards",
    dataSource=DATASOURCE,
    displayLabels=["value", "name", "percent"],
    legendDisplayMode="table",
    legendPlacement="right",
    pieType="pie",
    unit=UNITS.BYTES,
    targets=[
        Target(
            expr="sum by (pod) (" + Metrics.DBSTATS_INDEX_SIZE() + ")",
            legendFormat="{{ pod }}",
        )
    ],
    description="Distribution of user index sizes across all shards",
)

# Status Panels
smallest_oplog = mongodb_stat(
    "Smallest oplog window",
    expr="min("
    + Metrics.OPLOG_HEAD_TIMESTAMP()
    + " - "
    + Metrics.OPLOG_TAIL_TIMESTAMP()
    + ")",
    format=UNITS.SECONDS,
    thresholds=THRESHOLDS["oplog_window"],
    description="This number represents the history window of the currently most used MongoDB shard. Losing a secondary for more than this duration will result in a divergence.",
)

disk_space_util = mongodb_stat(
    "Disk Space Utilization",
    expr="avg("
    + Metrics.DBSTATS_FS_USED_SIZE()
    + ") / avg("
    + Metrics.DBSTATS_FS_TOTAL_SIZE()
    + ")",
    format=UNITS.PERCENT_UNIT,
    thresholds=THRESHOLDS["disk_usage"],
    minValue=0,
    maxValue=100,
    description="Shows information about the disk space usage of the specified mountpoint.",
)

num_indexes = mongodb_stat(
    "Number of indexes",
    targets=[
        Target(
            expr="sum(" + Metrics.DBSTATS_INDEXES() + ")",
            legendFormat="Metadata database",
        )
    ],
)

num_collections = mongodb_stat(
    "Number of Collections",
    targets=[
        Target(
            expr="sum(" + Metrics.DB_COLLECTIONS_TOTAL() + ")",
            format="table",
            instant=True,
            legendFormat="__auto",
        )
    ],
)

# State Timeline Panels
shard_server_states = mongodb_state_timeline(
    "Shard Server States",
    "max by (pod) ("
    + Metrics.REPLSET_STATE('job=~"${namespace}/${job}-shard.*-data"')
    + ")",
    description="ReplSet statuses during the selected time range.",
    mappings=MONGODB_STATES_MAPPINGS,
)

shard_config_states = mongodb_state_timeline(
    "Shard configuration States",
    "max by (pod) ("
    + Metrics.REPLSET_STATE('job=~"${namespace}/${job}-configsvr"')
    + ")",
    description="ReplSet statuses during the selected time range.",
    mappings=MONGODB_STATES_MAPPINGS,
    showValue="always",
)

# Operations Panels
shard_balancing = Stat(
    title="Shard balancing",
    dataSource=DATASOURCE,
    format="",
    colorMode="value",
    textMode="value",
    mappings=[
        {
            "options": {"0": {"text": "Shards are not balanced", "color": "red"}},
            "type": "value",
        },
        {
            "options": {"1": {"text": "Shards are balanced", "color": "green"}},
            "type": "value",
        },
    ],
    targets=[
        Target(
            expr="max by (pod) (" + Metrics.MONGOS_SHARDING_CHUNKS_IS_BALANCED() + ")",
            legendFormat="{{ pod }}",
        )
    ],
)

mongos_cursors = mongodb_stat(
    "MongoS cursors open against selected instances",
    decimals=0,
    targets=[
        Target(
            expr="sum by (pod) (" + Metrics.SS_METRICS_CURSOR_OPEN() + ")",
        )
    ],
)

active_connections = mongodb_timeseries(
    "Active connections",
    [
        Target(
            expr="sum by(pod) (" + Metrics.SS_CONNECTIONS(conn_type="current") + ")",
            legendFormat="__auto",
        )
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    thresholds=THRESHOLDS["connections"],
    showPoints="auto",
)

active_cursors = mongodb_timeseries(
    "Active cursors",
    [
        Target(
            expr="max(" + Metrics.SS_METRICS_CURSOR_OPEN() + ")",
            legendFormat="Open cursors",
        )
    ],
    unit="cursors",
    lineInterpolation="smooth",
    showPoints="auto",
)

# Performance Panels
ops_shard_servers = mongodb_timeseries(
    "Data operations",
    [
        Target(
            expr="sum by (pod) (rate("
            + Metrics.SS_OPCOUNTERS(legacy_op_type=["query", "getmore"])
            + "))",
            legendFormat="Read - {{ pod }}",
        ),
        Target(
            expr="sum by (pod) (rate("
            + Metrics.SS_OPCOUNTERS(legacy_op_type=["insert", "update", "delete"])
            + "))",
            legendFormat="Write - {{ pod }}",
        ),
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    unit=UNITS.OPS_PER_SEC,
    lineInterpolation="smooth",
    showPoints="auto",
)

repl_opcounters_list = mongodb_timeseries(
    "Replication Operations",
    [
        Target(
            expr="sum by (legacy_op_type) (rate("
            + Metrics.SS_OPCOUNTERS_REPL()
            + "))",
            legendFormat="repl_{{legacy_op_type}}",
        ),
    ],
    unit=UNITS.OPS_PER_SEC,
    lineInterpolation="smooth",
    showPoints="never",
    decimals=2,
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
    description="Replication operations per second by type",
)

command_operations = mongodb_timeseries(
    "Operations by command",
    [
        Target(
            expr="sum(rate("
            + Metrics.SS_METRICS_TTL_DELETED_DOCUMENTS(rs_state=RS_STATE_PRIMARY)
            + "))",
            legendFormat="ttl_delete",
        ),
        Target(
            expr="sum by (legacy_op_type) (rate("
            + Metrics.SS_OPCOUNTERS(rs_state=RS_STATE_PRIMARY)
            + "))",
            legendFormat="{{legacy_op_type}}",
        ),
    ],
    unit=UNITS.OPS_PER_SEC,
    lineInterpolation="smooth",
    showPoints="never",
    decimals=2,
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
    description="Ops classified by legacy wire protocol type (query, insert, update, delete, getmore). And (from the internal TTL threads) the docs deletes/sec by TTL indexes.",
)

cursor_created = mongodb_timeseries(
    "Cursor created",
    [
        Target(
            expr="avg by (pod) (increase("
            + Metrics.SS_METRICS_CURSOR_TOTAL_OPENED()
            + "))",
            legendFormat="__auto",
        )
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    unit="/s",
    lineInterpolation="smooth",
    showPoints="auto",
)

connections = mongodb_timeseries(
    "Connections",
    [
        Target(
            expr="avg(" + expr + ")",
            legendFormat=legend,
        )
        for expr, legend in [
            (Metrics.SS_CONNECTIONS(conn_type="current"), "Current"),
            (Metrics.SS_CONNECTIONS(conn_type="available"), "Available"),
            (Metrics.SS_GLOBAL_LOCK_ACTIVE_CLIENTS_READERS(), "Active readers clients"),
            (Metrics.SS_GLOBAL_LOCK_ACTIVE_CLIENTS_WRITERS(), "Active writers clients"),
            (Metrics.SS_TRANSACTIONS_CURRENT_ACTIVE(), "Active transactions"),
            (Metrics.SS_TRANSACTIONS_CURRENT_INACTIVE(), "Inactive transactions"),
        ]
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    unit="none",
    description="MongoDB Connections",
)

disk_reads = mongodb_timeseries(
    "Disk Reads Completed",
    [
        Target(
            expr="sum by(pod) (rate("
            + Metrics.CONTAINER_FS_READS_TOTAL(f'pod=~"{POD_PATTERN}"')
            + "))",
            legendFormat="{{ pod }}",
        )
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    unit=UNITS.OPS_PER_SEC,
)

disk_writes = mongodb_timeseries(
    "Disk Writes Completed",
    [
        Target(
            expr="sum by(pod) (rate("
            + Metrics.CONTAINER_FS_WRITES_TOTAL(f'pod=~"{POD_PATTERN}"')
            + "))",
            legendFormat="{{ pod }}"
        )
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    unit=UNITS.OPS_PER_SEC,
)

# Oplog Panels
oplog_recovery = mongodb_timeseries(
    "Oplog Recovery Window",
    [
        Target(
            expr=Metrics.OPLOG_HEAD_TIMESTAMP() + "-" + Metrics.OPLOG_TAIL_TIMESTAMP(),
            legendFormat="{{ pod }}",
        )
    ],
    unit=UNITS.SECONDS,
    showPoints="never",
    description="Timespan window between newest and the oldest op in the Oplog collection.",
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

avg_op_latency = mongodb_timeseries(
    "Average Operation Latency",
    [
        Target(
            # Using weighted average: total latency / total operations
            # This reflects actual user experience across all instances
            expr="sum by(type) (rate("
            + Metrics.MONGOD_OP_LATENCIES_LATENCY_TOTAL()
            + ")) / sum by(type) (rate("
            + Metrics.MONGOD_OP_LATENCIES_OPS_TOTAL()
            + "))",
            legendFormat="{{type}}",
        )
    ],
    unit=UNITS.MICRO_SECONDS,
    thresholds=THRESHOLDS["latency"],
    lineInterpolation="smooth",
    showPoints="auto",
    description="Average latency of operations (classified by read, write, or (other) command)",
)

replication_lag = mongodb_timeseries(
    "Replication Lag",
    [
        Target(
            expr="last_over_time("
            + Metrics.REPLSET_MEMBER_REPLICATION_LAG()
            + "[$__rate_interval]) > 0",
            legendFormat="{{pod}}",
        )
    ],
    unit=UNITS.SECONDS,
    thresholds=THRESHOLDS["replication_lag"],
    lineInterpolation="smooth",
    showPoints="always",
    decimals=2,
    description="Replication lag is the delay needed to replicate data from primary to secondary nodes. Should typically stay within a few seconds. If lag keeps increasing, it means secondary nodes cannot replicate data fast enough to keep up with the write rate to the primary.",
)

flow_control_count = mongodb_timeseries(
    "Flow Control Count",
    [
        Target(
            expr="max(rate(" + Metrics.SS_FLOW_CONTROL_IS_LAGGED_COUNT() + "))",
            legendFormat="fc_count",
        ),
    ],
    unit="short",
    showPoints="never",
    decimals=0,
    description="Number of times flow control was engaged to prevent the primary from being overwhelmed.",
)

flow_control_time = mongodb_timeseries(
    "Flow Control Time",
    [
        Target(
            expr="max(rate(" + Metrics.SS_FLOW_CONTROL_IS_LAGGED_TIME_MICROS() + "))",
            legendFormat="fc_time",
        ),
    ],
    unit=UNITS.MICRO_SECONDS,
    showPoints="never",
    decimals=2,
    description="Total time spent in flow control to manage write rate.",
)

# Performance Metrics Panels
query_exec_times = mongodb_timeseries(
    "Query execution times",
    [
        Target(
            # Using weighted average: total latency / total operations
            # This reflects actual user experience, consistent with avg_op_latency
            expr="sum by (op_type) (rate("
            + Metrics.SS_OP_LATENCIES_LATENCY()
            + ")) / sum by (op_type) (rate("
            + Metrics.SS_OP_LATENCIES_OPS()
            + "))",
            legendFormat="{{op_type}}",
        )
    ],
    unit=UNITS.MICRO_SECONDS,
    thresholds=THRESHOLDS["query_exec"],
    lineInterpolation="smooth",
    showPoints="never",
    decimals=2,
    description="Average latency of operations (classified by read, write, or (other) command)",
)

queued_ops = mongodb_timeseries(
    "Queued Operations by Type",
    [
        Target(
            expr="sum by (type) ("
            + Metrics.MONGOD_GLOBAL_LOCK_CURRENT_QUEUE()
            + ")",
            legendFormat="{{type}}",
        )
    ],
    unit="none",
    thresholds=THRESHOLDS["queue_ops"],
    showPoints="never",
    decimals=2,
    description="Operations queued due to a lock, broken down by operation type (summed across all shards).",
)

# Additional Performance Panels
op_queue_size = mongodb_timeseries(
    "Total Queued Operations by pod",
    [
        Target(
            expr="sum by(pod) ("
            + Metrics.SS_GLOBAL_LOCK_CURRENT_QUEUE(count_type=["readers", "writers"])
            + ")",
            legendFormat="{{ pod }}",
        )
    ],
    unit="none",
    showPoints="never",
    description="Total reader and writer operations queued due to locks, aggregated by job/shard.",
)

write_conflicts = mongodb_timeseries(
    "Write Conflicts per Second",
    [
        Target(
            # Using weighted average: total conflicts / total write operations
            # This gives the actual conflict ratio experienced across all instances
            expr="sum(rate("
            + Metrics.MONGOD_METRICS_OPERATION_TOTAL(state="writeConflicts")
            + ")) / sum(rate("
            + Metrics.SS_OPCOUNTERS(legacy_op_type=["insert", "update", "delete"])
            + "))",
            legendFormat="Write conflict ratio",
        )
    ],
    unit=UNITS.PERCENT_FORMAT,
    thresholds=THRESHOLDS["write_conflicts"],
    showPoints="auto",
    description="The ratio of write conflicts to the total number of write operations. A value of 0% means no write conflicts occurred, while a value of 100% means all write operations were conflicts.",
)

reads_writes_locks = mongodb_timeseries(
    "Reads & Writes clients locks",
    [
        Target(
            expr="avg(" + expr + ")",
            legendFormat=legend,
        )
        for expr, legend in [
            (Metrics.SS_GLOBAL_LOCK_ACTIVE_CLIENTS_READERS(), "Active Readers"),
            (Metrics.SS_GLOBAL_LOCK_ACTIVE_CLIENTS_WRITERS(), "Active Writers"),
            (
                Metrics.SS_GLOBAL_LOCK_CURRENT_QUEUE(count_type="readers"),
                "Queued Readers",
            ),
            (
                Metrics.SS_GLOBAL_LOCK_CURRENT_QUEUE(count_type="writers"),
                "Queued Writers",
            ),
        ]
    ],
    unit="none",
    showPoints="never",
    description="Number of locks held by readers and writers",
)

wt_cache_ratio = mongodb_timeseries(
    "WiredTiger Engine Cache hit/miss ratio",
    [
        Target(
            expr="1 - rate("
            + Metrics.SS_WT_CACHE_PAGES_READ_INTO_CACHE()
            + ") / rate("
            + Metrics.SS_WT_CACHE_PAGES_REQUESTED_FROM_THE_CACHE()
            + ")",
            legendFormat="{{ pod }}",
        )
    ],
    unit=UNITS.PERCENT_UNIT,
    lineInterpolation="smooth",
    showPoints="auto",
    description="The ratio of pages requested from the cache that were found in the cache (hit) vs. pages that were not found in the cache (miss). A value of 100% means all pages requested were found in the cache.",
)

query_efficiency = mongodb_timeseries(
    "Ratio of documents scanned per query",
    [
        Target(
            expr="sum(irate("
            + Metrics.MONGOD_METRICS_QUERY_EXECUTOR_TOTAL(state="scanned_objects")
            + ")) / sum(irate("
            + Metrics.MONGOD_METRICS_DOCUMENT_TOTAL(state="returned")
            + "))",
            legendFormat="Scanned objects / returned",
        ),
        Target(
            expr="sum(irate("
            + Metrics.MONGOD_METRICS_QUERY_EXECUTOR_TOTAL(state="scanned")
            + ")) / sum(irate("
            + Metrics.MONGOD_METRICS_DOCUMENT_TOTAL(state="returned")
            + "))",
            legendFormat="Scanned idx / returned",
        ),
    ],
    unit="",
    showPoints="never",
    decimals=2,
    description="Ratio of Documents (or Index entries) scanned / documents returned. A value of 1 means all documents returned exactly match query criteria for the sample period.",
)

# Resources usage
stacked_cpu = mongodb_timeseries(
    "Stacked CPU usage",
    [
        Target(
            expr="sum by (job) (rate(" + metric() + ") / 1000)",
            legendFormat=legend,
        )
        for metric, legend in [
            (Metrics.SYS_CPU_USER_MS, "User {{ job }}"),
            (Metrics.SYS_CPU_IOWAIT_MS, "IO Wait {{ job }}"),
            (Metrics.SYS_CPU_SYSTEM_MS, "System {{ job }}"),
        ]
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    fillOpacity=45,
    showPoints="auto",
)

memory_usage = mongodb_timeseries(
    "Memory Usage",
    [
        Target(
            expr=Metrics.SS_MEM_RESIDENT(),
            legendFormat="{{pod}}",
        ),
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
    unit="decmbytes",
)

network_io = mongodb_timeseries(
    "Network I/O",
    [
        Target(
            expr=expr_template.format(metric=metric()),
            legendFormat=legend,
        )
        for expr_template, metric, legend in [
            ("rate({metric})", Metrics.SS_NETWORK_BYTES_IN, "{{pod}}: In"),
            ("-rate({metric})", Metrics.SS_NETWORK_BYTES_OUT, "{{pod}}: Out"),
        ]
    ],
    unit="decbytes",
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

disk_io_util = mongodb_timeseries(
    "Disk IO Utilization (all instances)",
    [
        Target(
            expr="sum by(pod) (rate("
            + Metrics.CONTAINER_BLKIO_DEVICE_USAGE_TOTAL(
                f'pod=~"{POD_PATTERN}"', operation="Total"
            )
            + "))",
        )
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
    unit="binBps",
)

# WiredTiger Panels
eviction_thread_created = mongodb_timeseries(
    "Eviction thread created",
    [
        Target(
            expr="rate(" + Metrics.SS_WT_CACHE_EVICTION_WORKER_THREAD_CREATED() + ")",
            legendFormat="{{pod}}",
        )
    ],
    showPoints="auto",
    unit=UNITS.OPS_PER_SEC,
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

eviction_threads_removed = mongodb_timeseries(
    "Eviction threads removed",
    [
        Target(
            expr="rate(" + Metrics.SS_WT_CACHE_EVICTION_WORKER_THREAD_REMOVED() + ")",
            legendFormat="{{pod}}",
        )
    ],
    showPoints="auto",
    unit=UNITS.OPS_PER_SEC,
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

num_eviction_threads = mongodb_timeseries(
    "Number of active eviction threads",
    [
        Target(
            expr=Metrics.SS_WT_CACHE_EVICTION_WORKER_THREAD_ACTIVE(),
            legendFormat="{{ pod }}",
        )
    ],
    showPoints="auto",
    unit="threads",
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

wt_concurrency_tickets = mongodb_timeseries(
    "Available Concurrency Tickets by Pod",
    [
        Target(
            expr="sum by (pod, txn_rw) ("
            + Metrics.MONGOD_WIREDTIGER_CONCURRENT_TRANSACTIONS_AVAILABLE_TICKETS()
            + ")",
            legendFormat="{{txn_type}} - {{pod}}",
        )
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    unit="short",
    showPoints="never",
    decimals=0,
    description="Number of available WT concurrency tickets by pod. Shows current ticket availability for read and write operations.",
)

write_concurrency_tickets = mongodb_timeseries(
    "Write Concurrency Tickets",
    [
        Target(
            expr="sum by (pod) ("
            + Metrics.MONGOD_WIREDTIGER_CONCURRENT_TRANSACTIONS_AVAILABLE_TICKETS(
                txn_rw="write"
            )
            + ")",
            legendFormat="{{pod}}",
        )
    ],
    showPoints="auto",
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

read_concurrency_tickets = mongodb_timeseries(
    "Read Concurrency Tickets",
    [
        Target(
            expr="sum by (pod) ("
            + Metrics.MONGOD_WIREDTIGER_CONCURRENT_TRANSACTIONS_AVAILABLE_TICKETS(
                txn_rw="read"
            )
            + ")",
            legendFormat="{{pod}}",
        )
    ],
    showPoints="auto",
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

eviction_pages = mongodb_timeseries(
    "Page Eviction",
    [
        Target(
            expr="sum by (pod) (rate("
            + Metrics.SS_WT_CACHE_EVICTION_WORKER_THREAD_EVICTING_PAGES()
            + "))",
            legendFormat="{{pod}}",
        )
    ],
    unit=UNITS.OPS_PER_SEC,
    showPoints="auto",
    legendDisplayMode="table",
    legendPlacement="right",
    legendValues=["mean", "max", "min"],
)

wt_cache_io = mongodb_timeseries(
    "Cache I/O",
    [
        Target(
            expr="sum(rate(" + metric() + "))",
            legendFormat=legend,
        )
        for metric, legend in [
            (Metrics.SS_WT_CACHE_BYTES_WRITTEN_FROM_CACHE, "written_from_cache"),
            (Metrics.SS_WT_CACHE_BYTES_READ_INTO_CACHE, "read_into_cache"),
        ]
    ],
    unit="binBps",
    showPoints="auto",
)

evictions_app_threads = mongodb_timeseries(
    "Evictions from application threads",
    [
        Target(
            expr="rate("
            + Metrics.SS_WT_CACHE_MODIFIED_PAGES_EVICTED_BY_APPLICATION_THREADS()
            + ")",
            legendFormat="{{pod}}",
        )
    ],
    legendDisplayMode="table",
    legendPlacement="right",
    unit=UNITS.OPS_PER_SEC,
    showPoints="auto",
)

wiredtiger_cache = mongodb_timeseries(
    "Cache Size",
    [
        Target(
            expr="sum(" + metric() + ")",
            legendFormat=legend,
        )
        for metric, legend in [
            (Metrics.MONGOD_WIREDTIGER_CACHE_MAX_BYTES, "max"),
            (Metrics.MONGOD_WIREDTIGER_CACHE_BYTES, "used"),
            (Metrics.SS_WT_CACHE_TRACKED_DIRTY_BYTES_IN_THE_CACHE, "dirty"),
        ]
    ],
    unit=UNITS.BYTES,
)

# Create the dashboard
dashboard = (
    Dashboard(
        title="MongoDB",
        editable=True,
        sharedCrosshair=True,
        refresh="",
        tags=[],
        timezone="browser",
        inputs=[
            DataSourceInput(
                name="DS_PROMETHEUS",
                label="Prometheus",
                pluginId="prometheus",
                pluginName="Prometheus",
            ),
            ConstantInput(
                name="namespace",
                label="Namespace",
                description="Namespace associated with the Zenko instance",
                value="zenko",
            ),
            ConstantInput(
                name="job",
                label="Job",
                description="Name of the MongoDB job, used to filter only the MongoDB instances.",
                value="data-db-mongodb-sharded",
            ),
        ],
        templating=Templating(
            [
                Template(
                    dataSource=DATASOURCE,
                    name="jobs",
                    label="MongoDB instance type",
                    query='label_values(mongodb_up{namespace="${namespace}", job=~"${namespace}/${job}.*"}, job)',
                    regex="/^${namespace}\/(.*)$/",
                    includeAll=True,
                    multi=True,
                    refresh=1,
                    type="query",
                ),
            ]
        ),
        panels=layout.column(
            [
                RowPanel(title="Overview"),
                layout.row(
                    [
                        mongodb_services_state,
                        layout.column(
                            [
                                version_panel,
                                smallest_oplog,
                            ],
                            height=4,
                            width=3,
                        ),
                        disk_usage_pie,
                        layout.column(
                            [
                                current_operations,
                                total_active_cursors,
                            ],
                            height=4,
                        ),
                        layout.column(
                            [
                                avg_doc_size,
                                disk_space_util,
                            ],
                            height=4,
                        ),
                        layout.column(
                            [
                                size_collections,
                                num_collections,
                            ],
                            height=4,
                            width=3,
                        ),
                        layout.column(
                            [
                                num_docs_per_shard,
                                num_indexes,
                            ],
                            height=4,
                        ),
                        layout.column(
                            [
                                docs_configsvr,
                                index_size_configsvr,
                            ],
                            height=4,
                        ),
                    ],
                    height=8,
                ),
                layout.row(
                    [
                        shard_balancing,
                        docs_distribution_pie,
                        index_size_distribution_pie,
                    ],
                    height=8,
                ),
                layout.row(
                    [
                        shard_server_states,
                        shard_config_states,
                    ],
                    7,
                ),
                RowPanel(title="MongoDB proxy"),
                layout.row(
                    [
                        mongos_cursors,
                        active_connections,
                    ],
                    7,
                ),
                RowPanel(title="Operations"),
                layout.row(
                    [
                        active_cursors,
                        ops_shard_servers,
                    ],
                    height=8,
                ),
                layout.row(
                    [
                        repl_opcounters_list,
                        command_operations,
                    ],
                    height=8,
                ),
                layout.row(
                    [
                        cursor_created,
                        connections,
                    ],
                    height=8,
                ),
                layout.row(
                    [
                        disk_reads,
                        disk_writes,
                    ],
                    height=8,
                ),
                RowPanel(title="Oplog"),
                layout.row(
                    [
                        oplog_recovery,
                        avg_op_latency,
                    ],
                    9,
                ),
                layout.row(
                    [
                        replication_lag,
                        flow_control_count,
                        flow_control_time,
                    ],
                    8,
                ),
                RowPanel(title="Performance Metrics"),
                layout.row(
                    [
                        query_exec_times,
                        queued_ops,
                    ],
                    8,
                ),
                layout.row(
                    [
                        op_queue_size,
                        write_conflicts,
                        reads_writes_locks,
                    ],
                    9,
                ),
                layout.row(
                    [
                        wt_cache_ratio,
                        query_efficiency,
                    ],
                    9,
                ),
                RowPanel(title="Resources usage"),
                layout.row(
                    [
                        stacked_cpu,
                        memory_usage,
                    ],
                    8,
                ),
                layout.row(
                    [
                        network_io,
                        disk_io_util,
                    ],
                    8,
                ),
                RowPanel(title="Wiredtiger"),
                layout.row(
                    [
                        eviction_thread_created,
                        eviction_threads_removed,
                    ],
                    8,
                ),
                layout.row(
                    [
                        num_eviction_threads,
                        wt_concurrency_tickets,
                    ],
                    8,
                ),
                layout.row(
                    [
                        write_concurrency_tickets,
                        read_concurrency_tickets,
                    ],
                    8,
                ),
                layout.row(
                    [
                        eviction_pages,
                        wt_cache_io,
                    ],
                    8,
                ),
                layout.row(
                    [
                        evictions_app_threads,
                        wiredtiger_cache,
                    ],
                    11,
                ),
            ]
        ),
    )
    .auto_panel_ids()
    .verify_datasources()
)
