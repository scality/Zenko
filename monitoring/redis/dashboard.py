from grafanalib.core import ConstantInput, DataSourceInput, Stat, Threshold, TimeSeries
from grafanalib import formatunits as UNITS
from scalgrafanalib import Target, layout, Dashboard

LAST_NOT_NULL = "lastNotNull"


up = Stat(
    title="Up",
    dataSource="${DS_PROMETHEUS}",
    reduceCalc=LAST_NOT_NULL,
    targets=[Target(expr='sum(up{namespace="${namespace}", job="${job}"})')],
    thresholds=[
        Threshold("red", 0, 0.0),
        Threshold("green", 1, 1.0),
    ],
)

uptime = Stat(
    title="Uptime",
    dataSource="${DS_PROMETHEUS}",
    decimals=0,
    format=UNITS.SECONDS,
    reduceCalc=LAST_NOT_NULL,
    targets=[
        Target(
            expr='max(max_over_time(redis_uptime_in_seconds{namespace="${namespace}", job="${job}"}[$__interval]))'
        ),
    ],
    thresholds=[
        Threshold("blue", 0, 0.0),
    ],
)

totalItems = Stat(
    title="Total items",
    dataSource="${DS_PROMETHEUS}",
    reduceCalc=LAST_NOT_NULL,
    targets=[
        Target(expr='sum(redis_db_keys{namespace="${namespace}", job="${job}"})'),
    ],
    thresholds=[
        Threshold("red", 0, 0.0),
        Threshold("green", 1, 1.0),
    ],
)

clients = Stat(
    title="Clients",
    dataSource="${DS_PROMETHEUS}",
    reduceCalc=LAST_NOT_NULL,
    targets=[
        Target(
            expr='sum(redis_connected_clients{namespace="${namespace}", job="${job}"})'
        ),
    ],
    thresholds=[
        Threshold("blue", 0, 0.0),
    ],
)

commandsPerSec = TimeSeries(
    title="Commands Executed / sec",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    fillOpacity=20,
    targets=[
        Target(
            expr='sum(rate(redis_commands_processed_total{namespace="${namespace}", job="${job}"}[$__rate_interval]))'
        ),
    ],
)

hit_miss = TimeSeries(
    title="Hits / Misses per Sec",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    fillOpacity=20,
    legendDisplayMode="table",
    legendPlacement="right",
    targets=[
        Target(
            expr='sum(irate(redis_keyspace_hits_total{namespace="${namespace}", job="${job}"}[$__rate_interval]))',
            legendFormat="hits",
        ),
        Target(
            expr='sum(irate(redis_keyspace_misses_total{namespace="${namespace}", job="${job}"}[$__rate_interval]))',
            legendFormat="misses",
        ),
    ],
)

total_memory = TimeSeries(
    title="Total Memory Usage",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    fillOpacity=20,
    unit=UNITS.BYTES,
    targets=[
        Target(
            expr='sum(redis_memory_used_bytes{namespace="${namespace}", job="${job}"})',
            legendFormat="used",
        ),
        Target(
            expr='sum(irate(redis_keyspace_misses_total{namespace="${namespace}", job="${job}"}[$__rate_interval]))',
            legendFormat="max",
        ),
    ],
)

network = TimeSeries(
    title="Network I/O",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    fillOpacity=20,
    unit=UNITS.BYTES,
    targets=[
        Target(
            expr='sum(rate(redis_net_input_bytes_total{namespace="${namespace}", job="${job}"}[$__rate_interval]))',
            legendFormat="input",
        ),
        Target(
            expr='sum(rate(redis_net_output_bytes_total{namespace="${namespace}", job="${job}"}[$__rate_interval]))',
            legendFormat="output",
        ),
    ],
)

total_item_db = TimeSeries(
    title="total Items per DB",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    legendDisplayMode="table",
    legendPlacement="right",
    targets=[
        Target(
            expr='sum (redis_db_keys{namespace="${namespace}", job="${job}"}) by (db)',
            legendFormat="{{ db }}",
        ),
    ],
)

expiring = TimeSeries(
    title="Expiring vs Not-Expiring Keys",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    targets=[
        Target(
            expr='sum (redis_db_keys{namespace="${namespace}", job="${job}"}) - sum (redis_db_keys_expiring{namespace="${namespace}", job="${job}"})',
            legendFormat="not expiring",
        ),
        Target(
            expr='sum (redis_db_keys_expiring{namespace="${namespace}", job="${job}"})',
            legendFormat="expiring",
        ),
    ],
)

evicted = TimeSeries(
    title="Expired / Evicted",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    targets=[
        Target(
            expr='sum(rate(redis_expired_keys_total{namespace="${namespace}", job="${job}"}[$__rate_interval])) by (addr)',
            legendFormat="expired",
        ),
        Target(
            expr='sum(rate(redis_evicted_keys_total{namespace="${namespace}", job="${job}"}[$__rate_interval])) by (addr)',
            legendFormat="evicted",
        ),
    ],
)

topk_5_commands = TimeSeries(
    title="Top5 commands with most Calls/sec",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    fillOpacity=80,
    targets=[
        Target(
            expr='topk(5, sum(irate(redis_commands_total{namespace="${namespace}", job="${job}"}[$__rate_interval])) by (cmd))',
            legendFormat="{{ cmd }}",
        ),
    ],
)

clients_ts = TimeSeries(
    title="Clients",
    dataSource="${DS_PROMETHEUS}",
    lineInterpolation="smooth",
    fillOpacity=20,
    targets=[
        Target(
            expr='sum(redis_connected_clients{namespace="${namespace}", job="${job}"})',
            legendFormat="clients",
        ),
    ],
)

dashboard = (
    Dashboard(
        title="Redis",
        description="Prometheus dashboard for Redis servers",
        editable=True,
        refresh="30s",
        tags=["redis"],
        timezone="",
        inputs=[
            DataSourceInput(
                name="DS_PROMETHEUS",
                label="Prometheus",
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
                name="job",
                label="job",
                description="Name of the Redis job, used to filter only "
                "the Redis instances.",
                value="artesca-data-base-cache-metrics",
            ),
        ],
        panels=layout.column(
            [
                layout.row(
                    layout.resize([up, uptime], height=4, width=2)
                    + layout.resize(
                        [
                            commandsPerSec,
                        ],
                        height=8,
                        width=8,
                    )
                    + layout.resize(
                        [
                            hit_miss,
                        ],
                        height=8,
                        width=12,
                    ),
                    height=4,
                ),
                layout.row(
                    layout.resize([totalItems, clients], height=4, width=2), height=4
                ),
                layout.row(
                    [
                        total_memory,
                        network,
                    ],
                    height=7,
                ),
                layout.row(
                    [total_item_db, expiring],
                    height=7,
                ),
                layout.row(
                    [
                        evicted,
                        topk_5_commands,
                    ],
                    height=7,
                ),
                layout.row([clients_ts], height=7),
            ]
        ),
    )
    .auto_panel_ids()
    .verify_datasources()
)
