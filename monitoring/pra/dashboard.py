from grafanalib.core import (
    ConstantInput,
    DataSourceInput,
    RowPanel,
    Threshold,
)

from grafanalib import formatunits as UNITS
from scalgrafanalib import (
    layout,
    metrics,
    Dashboard,
    Stat,
    Target,
    TimeSeries,
)


class Metrics:
    DR_SOURCE = 'drSinkInstance=""'
    DR_SINK = 'drSinkInstance="${dr_sink_instance}"'

    UP = metrics.Metric(
        "up",
        "drSinkInstance", job="${job}", namespace="${namespace}",
    )

    KAFKA_CONSUMERGROUP_LAG = metrics.Metric(
        "kafka_consumergroup_group_max_lag",
        "group", cluster_name="${kafka_instance}", namespace="${namespace}",
    )

    KAFKA_CONNECT_SOURCE_TASK_RECORDS_LAG = metrics.Metric(
        "kafka_consumer_fetch_manager_records_lag",
        "drSinkInstance", "job", namespace="${namespace}",
    )

    LIFECYCLE_DURATION = metrics.BucketMetric(
        "s3_lifecycle_duration_seconds",
        "type", location=["${locations}"], job=["${lifecycle_jobs}"], namespace="${namespace}",
    )

    LIFECYCLE_LAST_TIMESTAMP = metrics.Metric(
        "s3_lifecycle_last_timestamp_ms",
        "type", location=["${locations}"], job=["${lifecycle_jobs}"], namespace="${namespace}",
    )

    KAFKA_MESSAGES_IN_TOTAL = metrics.CounterMetric(
        "kafka_server_brokertopicmetrics_messagesin_total",
        job="${kafka_instance}", namespace="${namespace}", topic="",  # topic="" is the total
    )

    KAFKA_CONNECT_MONGODB_PUT_TOTAL = metrics.CounterMetric(
        "kafka_connect_mongodb_sink_task_metrics_in_task_put",
        "drSinkInstance", job="${kafka_connect_sink_job}", namespace="${namespace}",
    )

    MONGODB_OPLOG_START_TS, MONGODB_OPLOG_END_TS, MONGODB_LAST_WRITE_TS = [
        metrics.Metric(
            name,
            "drSinkInstance", job=["${mongo_jobs}"], namespace="${namespace}",
        )
        for name in (
            "mongodb_oplog_stats_start",
            "mongodb_oplog_stats_end",
            "mongodb_ss_repl_lastWrite_lastWriteDate",
        )
    ]


up = [
    Stat(
        title=title,
        dataSource="${DS_PROMETHEUS}",
        reduceCalc="last",
        minValue="0",
        maxValue=replicas,
        noValue="0",
        targets=[
            Target(
                expr='sum(' + metric + ')',
            ),
        ],
        thresholdType="percentage",
        thresholds=[
            Threshold("red", 0, 0.0),
            Threshold("yellow", 1, 50.0),
            Threshold("green", 2, 100.0),
        ],
    )
    for title, metric, replicas in [
        ["KafkaConnect Source", Metrics.UP(Metrics.DR_SOURCE, job="${kafka_connect_src_job}"), 1],
        ["KafkaConnect Sink", Metrics.UP(Metrics.DR_SINK, job="${kafka_connect_sink_job}"), 1],
        ["Kafka", Metrics.UP('job="${kafka_instance}"'), 1],
    ]
]

lastLifecycle = Stat(
    title="Last lifecycle op",
    description="Time since the last eligible op on the primary site.",
    dataSource="${DS_PROMETHEUS}",
    format=UNITS.CLOCK_MSEC,
    noValue="-",
    reduceCalc="last",
    targets=[
        Target(
            expr="time() - " + Metrics.LIFECYCLE_LAST_TIMESTAMP(),
        )
    ],
    thresholds=[
        Threshold("#808080", 0, 0.0),
        Threshold("green", 1, 0.0),
        Threshold("super-light-yellow", 2, 1800.0),
        Threshold("orange", 3, 3600.0),
        Threshold("red", 4, 3700.0),
    ],
)

lastMongodbWrite = Stat(
    title="Last DR mongo write",
    description="Time since the last mongo DB write on DR site.",
    dataSource="${DS_PROMETHEUS}",
    format=UNITS.CLOCK_MSEC,
    noValue="-",
    reduceCalc="last",
    targets=[
        Target(
            expr="time() - " + Metrics.MONGODB_LAST_WRITE_TS(Metrics.DR_SINK),
        )
    ],
    thresholds=[
        Threshold("#808080", 0, 0.0),
        Threshold("green", 1, 0.0),
        Threshold("super-light-yellow", 2, 1800.0),
        Threshold("orange", 3, 3600.0),
        Threshold("red", 4, 3700.0),
    ],
)

kafka_lag = TimeSeries(
    title="Kafka Lag",
    dataSource="${DS_PROMETHEUS}",
    fillOpacity=30,
    legendDisplayMode="list",
    legendCalcs=["max", "mean"],
    unit=UNITS.SECONDS,
    targets=[Target(
        expr="max(" + Metrics.KAFKA_CONSUMERGROUP_LAG() + ")",
        legendFormat=" ",
    )],
)


kafka_connect_lag_source, kafka_connect_lag_sink = [
    TimeSeries(
        title="Kafka Connect " + name + " Lag",
        dataSource="${DS_PROMETHEUS}",
        fillOpacity=30,
        legendDisplayMode="list",
        legendCalcs=["max", "mean"],
        unit=UNITS.SECONDS,
        targets=[Target(
            expr="sum(" + metric + ")",
            legendFormat=" ",
        )],
    )
    for name, metric in [
        ["Source", Metrics.KAFKA_CONNECT_SOURCE_TASK_RECORDS_LAG(Metrics.DR_SOURCE, job="${kafka_connect_src_job}")],
        ["Sink", Metrics.KAFKA_CONNECT_SOURCE_TASK_RECORDS_LAG(Metrics.DR_SINK, job="${kafka_connect_sink_job}")],
    ]
]


lifecycle_archive_rate = TimeSeries(
    title="Lifecycle Archive Rate (source)",
    dataSource="${DS_PROMETHEUS}",
    fillOpacity=30,
    legendDisplayMode="list",
    legendCalcs=["mean", "max"],
    unit=UNITS.OPS_PER_SEC,
    targets=[Target(
        expr="sum(rate(" + Metrics.LIFECYCLE_DURATION.count(type="archive") + "))",
        legendFormat=" ",
    )],
)


incoming_message_rate = TimeSeries(
    title="Kafka Message Rate",
    dataSource="${DS_PROMETHEUS}",
    fillOpacity=30,
    legendDisplayMode="list",
    legendCalcs=["max", "mean"],
    unit=UNITS.OPS_PER_SEC,
    targets=[Target(
        expr="sum(rate(" + Metrics.KAFKA_MESSAGES_IN_TOTAL() + "))",
        legendFormat=" ",
    )],
)


outgoing_message_rate = TimeSeries(
    title="Metadata Write Rate (sink)",
    dataSource="${DS_PROMETHEUS}",
    fillOpacity=30,
    legendDisplayMode="list",
    legendCalcs=["mean", "max"],
    unit=UNITS.OPS_PER_SEC,
    targets=[Target(
        expr="sum(rate(" + Metrics.KAFKA_CONNECT_MONGODB_PUT_TOTAL() + "))",
        legendFormat=" ",
    )],
)


dashboard = (
    Dashboard(
        title="Zenko DR ${zenkoName}",
        editable=True,
        refresh="30s",
        timezone="",
        version=1,
        inputs=[
            DataSourceInput(
                name="DS_PROMETHEUS",
                label="Prometheus",
                description="Prometheus server that will be used for all panels in the dashboard.",
                pluginId="prometheus",
                pluginName="Prometheus",
            ),
            ConstantInput(
                name="namespace",
                label="namespace",
                description="Namespace associated with the Zenko instance",
                value="zenko",
            ),
            ConstantInput(
                name="zenkoName",
                label="zenko instance name",
                description="Name of the ZenkoDR instance",
                value="artesca-data",
            ),
            ConstantInput(
                name="kafka_instance",
                label="kafka instance",
                description="Name of the kafka instance/job/cluster_name",
                value="artesca-data-dr-base-queue",
            ),
            ConstantInput(
                name="kafka_connect_src_job",
                label="kafka connect source job",
                description="Name of the kafka connect job",
                value="artesca-data-dr-base-queue-connector-metrics",
            ),
            ConstantInput(
                name="kafka_connect_sink_job",
                label="kafka connect sink job",
                description="Name of the kafka connect job",
                value="artesca-data-dr-base-queue-connector-metrics",
            ),
            ConstantInput(
                name="lifecycle_jobs",
                label="Lifecycle jobs",
                description="Promethes label expression for lifecycle jobs",
                value="artesca-data-backbeat-lifecycle-.*-headless",
            ),
            ConstantInput(
                name="mongo_jobs",
                label="MongoDb jobs",
                description="Promethes label expression for mongo jobs",
                value="zenko/data-db-mongodb-sharded-shard.*",
            ),
            ConstantInput(
                name="locations",
                label="Locations",
                description="Promethes label expression to filter PRA locations",
                value="glacier",
            ),
            ConstantInput(
                name="replicas",
                label="Replicas",
                description="Expected number of replicas",
                value="1",
            ),
            ConstantInput(
                name="dr_sink_instance",
                label="DR Sink Instance",
                description="Name of the DR sink instance",
                value="artesca-data-dr",
            ),
        ],
        panels=layout.column([
            layout.row(
                up + layout.resize([lastLifecycle, lastMongodbWrite], width=6,),
                height=4,
            ),
            RowPanel(title="Kafka Lag"),
            layout.row(
                [kafka_connect_lag_source, kafka_lag, kafka_connect_lag_sink],
                height=8,
            ),
            RowPanel(title="Processing rate"),
            layout.row(
                [lifecycle_archive_rate, incoming_message_rate, outgoing_message_rate],
                height=8,
            ),
        ]),
    )
    .auto_panel_ids()
    .verify_datasources()
)