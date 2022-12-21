from grafanalib.core import (
    TABLE_TARGET_FORMAT,
    ConstantInput,
    DataSourceInput,
    Repeat,
    RowPanel,
    Table,
    Template,
    Templating,
    Threshold,
)

from grafanalib import formatunits as UNITS
from scalgrafanalib import (
    layout,
    metrics,
    Dashboard,
    PieChart,
    Stat,
    Target,
    TimeSeries,
)


class Metrics:
    connector_status = metrics.Metric(
        'kafka_connect_connector_status', 'status', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    connector_info = metrics.Metric(
        'kafka_connect_connector_info', 'status', 'connector',
        'connector_type', 'connector_class', 'connector_version',
        'instance', job='${job}', namespace='${namespace}',
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    app_info = metrics.Metric(
        'kafka_connect_app_info', 'start_time_ms', 'version', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    network_io_rate = metrics.Metric(
        'kafka_connect_network_io_rate', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    incoming_byte_rate = metrics.Metric(
        'kafka_connect_incoming_byte_rate', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    outgoing_byte_rate = metrics.Metric(
        'kafka_connect_outgoing_byte_rate', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    connection_count = metrics.Metric(
        'kafka_connect_connection_count', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    failed_authentication_total = metrics.Metric(
        'kafka_connect_failed_authentication_total', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    successful_authentication_rate = metrics.Metric(
        'kafka_connect_successful_authentication_rate', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    request_rate = metrics.Metric(
        'kafka_connect_request_rate', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    response_rate = metrics.Metric(
        'kafka_connect_response_rate', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    io_ratio = metrics.Metric(
        'kafka_connect_io_ratio', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_connector_count = metrics.Metric(
        'kafka_connect_worker_connector_count', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_task_count = metrics.Metric(
        'kafka_connect_worker_task_count', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_task_startup_success_total = metrics.Metric(
        'kafka_connect_worker_task_startup_success_total', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_task_startup_failure_total = metrics.Metric(
        'kafka_connect_worker_task_startup_failure_total', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_rebalance_rebalance_avg_time_ms = metrics.Metric(
        'kafka_connect_worker_rebalance_rebalance_avg_time_ms', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_rebalance_time_since_last_rebalance_ms = metrics.Metric(
        'kafka_connect_worker_rebalance_time_since_last_rebalance_ms', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_connector_startup_success_total = metrics.Metric(
        'kafka_connect_worker_connector_startup_success_total', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_connector_startup_failure_total = metrics.Metric(
        'kafka_connect_worker_connector_startup_failure_total', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    worker_connector_total_task_count = metrics.Metric(
        'kafka_connect_worker_connector_total_task_count', 'instance', 'connector', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    worker_connector_running_task_count = metrics.Metric(
        'kafka_connect_worker_connector_running_task_count', 'instance', 'connector', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    worker_connector_paused_task_count = metrics.Metric(
        'kafka_connect_worker_connector_paused_task_count', 'instance', 'connector', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    worker_connector_failed_task_count = metrics.Metric(
        'kafka_connect_worker_connector_failed_task_count', 'instance', 'connector', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    worker_connector_unassigned_task_count = metrics.Metric(
        'kafka_connect_worker_connector_unassigned_task_count', 'instance', 'connector', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    worker_connector_destroyed_task_count = metrics.Metric(
        'kafka_connect_worker_connector_destroyed_task_count', 'instance', 'connector', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    connector_task_batch_size_avg = metrics.Metric(
        'kafka_connect_connector_task_batch_size_avg', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    connector_task_batch_size_max = metrics.Metric(
        'kafka_connect_connector_task_batch_size_max', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    connector_task_offset_commit_success_percentage = metrics.Metric(
        'kafka_connect_connector_task_offset_commit_success_percentage', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    connector_task_offset_commit_avg_time_ms = metrics.Metric(
        'kafka_connect_connector_task_offset_commit_avg_time_ms', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    connector_task_running_ratio = metrics.Metric(
        'kafka_connect_connector_task_running_ratio', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    task_error_total_record_failures = metrics.Metric(
        'kafka_connect_task_error_total_record_failures', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    task_error_total_record_errors = metrics.Metric(
        'kafka_connect_task_error_total_record_errors', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    task_error_total_records_skipped = metrics.Metric(
        'kafka_connect_task_error_total_records_skipped', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    task_error_total_errors_logged = metrics.Metric(
        'kafka_connect_task_error_total_errors_logged', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    task_error_total_retries = metrics.Metric(
        'kafka_connect_task_error_total_retries', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    task_error_deadletterqueue_produce_requests = metrics.Metric(
        'kafka_connect_task_error_deadletterqueue_produce_requests', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    task_error_deadletterqueue_produce_failures = metrics.Metric(
        'kafka_connect_task_error_deadletterqueue_produce_failures', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"')

    source_task_poll_batch_avg_time_ms = metrics.Metric(
        'kafka_connect_source_task_poll_batch_avg_time_ms', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    source_task_poll_batch_max_time_ms = metrics.Metric(
        'kafka_connect_source_task_poll_batch_max_time_ms', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    source_task_source_record_poll_rate = metrics.Metric(
        'kafka_connect_source_task_source_record_poll_rate', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    source_task_source_record_write_rate = metrics.Metric(
        'kafka_connect_source_task_source_record_write_rate', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    source_task_source_record_active_count = metrics.Metric(
        'kafka_connect_source_task_source_record_active_count', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    source_task_source_record_active_count_avg = metrics.Metric(
        'kafka_connect_source_task_source_record_active_count_avg', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    source_task_source_record_active_count_max = metrics.Metric(
        'kafka_connect_source_task_source_record_active_count_max', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    sink_task_partition_count = metrics.Metric(
        'kafka_connect_sink_task_partition_count', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')  

    sink_task_put_batch_avg_time_ms = metrics.Metric(
        'kafka_connect_sink_task_put_batch_avg_time_ms', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    sink_task_put_batch_max_time_ms = metrics.Metric(
        'kafka_connect_sink_task_put_batch_max_time_ms', 'instance', 'connector', 'task', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"', 'connector=~"$connector"', 'task!=""')

    process_cpu_seconds_total = metrics.CounterMetric(
        'process_cpu_seconds_total', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    jvm_memory_bytes_used = metrics.Metric(
        'jvm_memory_bytes_used', 'area', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    jvm_memory_bytes_max = metrics.Metric(
        'jvm_memory_bytes_max', 'area', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')

    jvm_gc_collection_seconds = metrics.BucketMetric(
        'jvm_gc_collection_seconds', 'gc', 'instance', job='${job}', namespace='${namespace}'
    ).with_defaults('instance=~"$instance"')


up = Stat(
    title="Workers",
    description="Number of workers available",
    dataSource='${DS_PROMETHEUS}',
    minValue='0',
    maxValue='${replicas}',
    reduceCalc='last',
    targets=[Target(
        expr='sum(up{job="${job}", namespace="${namespace}"})',
    )],
    thresholdType='percentage',
    thresholds=[
        Threshold('red', 0, 0.0),
        Threshold('yellow', 1, 50.),
        Threshold('green', 2, 100.),
    ]
)

connectors_not_running = Stat(
    title="Connectors not running",
    description="Number of connectors not running",
    dataSource='${DS_PROMETHEUS}',
    noValue='0',
    reduceCalc='last',
    targets=[Target(
        expr='sum(' + Metrics.connector_status() + ') - sum(' + Metrics.connector_status(status="running") + ')',
    )],
    thresholds=[
        Threshold('green', 0, 0.0),
        Threshold('red', 1, 1.0),
    ],
)

tasks = [
    Stat(
        title='Tasks ' + kind.title(),
        dataSource='${DS_PROMETHEUS}',
        minValue='0',
        maxValue='${replicas}',
        noValue='0',
        reduceCalc='last',
        targets=[Target(
            expr='sum(' + metric() + ')'
        )],
        thresholds=[
            Threshold('green', 0, 0.0),
            *([Threshold(color, 1, 1.)] if color != None else []),
        ]
    )
    for kind, metric, color in [
        ['total', Metrics.worker_connector_total_task_count, None],
        ['running', Metrics.worker_connector_running_task_count, None],
        ['paused', Metrics.worker_connector_paused_task_count, 'orange'],
        ['failed', Metrics.worker_connector_failed_task_count, 'red'],
        ['unassigned', Metrics.worker_connector_unassigned_task_count, 'yellow'],
        ['destroyed', Metrics.worker_connector_destroyed_task_count, 'purple'],
    ]
]

connectors_by_status = PieChart(
    title='Connector repartition per status',
    dataSource='${DS_PROMETHEUS}',
    legendPlacement='right',
    reduceOptionsCalcs=['lastNotNull'],
    targets=[Target(
        expr='sum(' + Metrics.connector_status() + ') by(status)',
        instant=True,
        legendFormat='{{status}}',
    )],
)

tasks_by_status = PieChart(
    title='Task repartition per status',
    dataSource='${DS_PROMETHEUS}',
    legendPlacement='right',
    reduceOptionsCalcs=['lastNotNull'],
    targets=[
        Target(
            expr='sum(' + metric + ')',
            instant=True,
            legendFormat=name,
        )
        for name, metric in [
            ['running', Metrics.worker_connector_running_task_count()],
            ['failed', Metrics.worker_connector_failed_task_count()],
            ['paused', Metrics.worker_connector_paused_task_count()],
            ['unassigned', Metrics.worker_connector_unassigned_task_count()],
            ['destroyed', Metrics.worker_connector_destroyed_task_count()],
        ]
    ],
)

def override(name: str, color: str = None, displayName: str = None, unit: str = None,
             hidden: bool = False, thresholds: dict = [], mappings: dict = []) -> dict:
    properties = []
    if color:
        properties += [{"id": "color", "value": {"fixedColor": color, "mode": "fixed"}}]
    if displayName:
        properties += [{"id": "displayName", "value": displayName}]
    if unit:
        properties += [{"id": "unit", "value": unit}]
    if hidden:
        properties += [{"id": "custom.hidden", "value": hidden}]
    if thresholds:
        properties += [{"id": "thresholds", "value": {
            "mode": "absolute",
            "steps": [
                {"color": value, "value": key} for key, value in thresholds.items()
            ]
        }}]
    if mappings:
        properties += [{"id": "mappings", "value": [
            {
                "type": "value",
                "options": {
                    key: {
                        "text": value,
                        "index": 0
                    }
                }
            }
            for key, value in mappings.items()
        ]}]
    return {
        "matcher": {"id": "byName", "options": name},
        "properties": properties,
    }

connectors_status = TimeSeries(
    title='Status of connectors over time',
    dataSource='${DS_PROMETHEUS}',
    fillOpacity=10,
    legendCalcs=['last'],
    legendDisplayMode='table',
    legendPlacement='right',
    unit=UNITS.SHORT,
    targets=[Target(
        expr='sum(' + Metrics.connector_status('status!=""') + ') by (status)',
        legendFormat='{{status}}'
    )],
    overrides=[
        override('stopped', color='red'),
        override('paused', color='orange'),
        override('running', color='green'),
    ]
)

tasks_status = TimeSeries(
    title='Status of tasks over time',
    dataSource='${DS_PROMETHEUS}',
    fillOpacity=10,
    legendCalcs=['last'],
    legendDisplayMode='table',
    legendPlacement='right',
    unit=UNITS.SHORT,
    targets=[
        Target(
            expr='sum(' + Metrics.worker_connector_running_task_count() + ')',
            legendFormat='running'
        ),
        Target(
            expr='sum(' + Metrics.worker_connector_failed_task_count() + ')',
            legendFormat='failed'
        ),
        Target(
            expr='sum(' + Metrics.worker_connector_paused_task_count() + ')',
            legendFormat='paused'
        ),
        Target(
            expr='sum(' + Metrics.worker_connector_destroyed_task_count() + ')',
            legendFormat='destroyed'
        ),
        Target(
            expr='sum(' + Metrics.worker_connector_unassigned_task_count() + ')',
            legendFormat='unassigned'
        ),
    ],
)

workers = Table(
    title = 'Connect Workers',
    dataSource='${DS_PROMETHEUS}',
    showHeader = True,
    targets=[
        Target(refId='B', expr='count(' + Metrics.app_info('start_time_ms!=""') + ') by (instance, start_time_ms)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='A', expr='count(' + Metrics.app_info('version!=""') + ') by (instance, version)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='C', expr='sum(' + Metrics.worker_connector_count() + ') by (instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='D', expr='sum(' + Metrics.worker_connector_startup_success_total() + ') by (instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='E', expr='sum(' + Metrics.worker_connector_startup_failure_total() + ') by (instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='I', expr='sum(' + Metrics.worker_task_count() + ') by (instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='J', expr='sum(' + Metrics.worker_task_startup_success_total() + ') by (instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='K', expr='sum(' + Metrics.worker_task_startup_failure_total() + ') by (instance)', format=TABLE_TARGET_FORMAT, instant=True),
    ],
    overrides=[
        override('Time', hidden=True),
        override('__name__', hidden=True),
        override('instance', displayName='Worker instance'),
        override('start_time_ms', displayName="Startup time"),
        override('Value #A', hidden=True),
        override('Value #B', hidden=True),
        override('Value #C', displayName='Connector Count', unit=UNITS.SHORT),
        override('Value #D', displayName='Connector Startup Success Total', unit=UNITS.SHORT),
        override('Value #E', displayName='Connector Startup Failure Total', unit=UNITS.SHORT),
        #override('Value #F', displayName='Number of rebalances', unit=UNITS.SHORT),  # Type NUMBER
        #override('Value #G', displayName='Average time of rebalances', unit=UNITS.MILLI_SECONDS),  # Type NUMBER
        #override('Value #H', displayName='Time since last rebalance', unit=UNITS.MILLI_SECONDS),  # Type NUMBER
        override('Value #I', displayName='Number of tasks', unit=UNITS.SHORT),
        override('Value #J', displayName='Task Startup Success ', unit=UNITS.SHORT),
        override('Value #K', displayName='Task Startup Failure', unit=UNITS.SHORT),
    ],

    thresholds=[
        Threshold('green', 0, 0.0),
        Threshold('red', 1, 80.),
    ],
    transformations=[{"id": "merge"}]
)

worker_details = [
    TimeSeries(
        title=title,
        description=description,
        dataSource='${DS_PROMETHEUS}',
        fillOpacity=20,
        unit=unit,
        targets=[Target(
            expr=metric(),
            legendFormat='{{instance}}'
        )]
    )
    for metric, title, unit, description in [
        [Metrics.network_io_rate, 'Network IO Rate', UNITS.OPS_PER_SEC,
         'Average number of network operations (reads or writes) on all connections per second'],
        [Metrics.incoming_byte_rate, 'Incoming Byte Rate', UNITS.BYTES_SEC,
         'Bytes per second read off all sockets'],
        [Metrics.outgoing_byte_rate, 'Outgoing Byte Rate', UNITS.BYTES_SEC,
         'Average number of outgoing bytes sent per second to all servers'],
        [Metrics.connection_count, 'Current number of active connections', UNITS.SHORT,
         'Current number of active connections'],
        [Metrics.failed_authentication_total, 'Failed authentication connections', UNITS.SHORT,
         'Connections that failed authentication'],
        [Metrics.successful_authentication_rate, 'Successful authentication connections', UNITS.SHORT,
         'Connections that were successfully authenticated using SASL or SSL'],
        [Metrics.request_rate, 'Request rate', UNITS.OPS_PER_SEC,
         'Average number of requests sent per second'],
        [Metrics.response_rate, 'Responses received and sent', UNITS.OPS_PER_SEC,
         'Responses received and sent per second'],
        [Metrics.io_ratio, 'IO Ratio', UNITS.PERCENT_UNIT,
         'Fraction of time the I/O thread spent doing I/O'],
    ]
]

connectors = Table(
    title = 'Connectors',
    dataSource='${DS_PROMETHEUS}',
    showHeader = True,
    targets=[
        Target(refId='I', expr='label_replace(label_replace(label_replace('
                + 'count(' + Metrics.connector_info('status!=""') + ') by(instance, status),'
                + ' "status", "1", "status", "running"),'
                + ' "status", "2", "status", "paused"),'
                + ' "status", "3", "status", "stopped")',
            format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='A', expr='count(' + Metrics.connector_info('connector_type!=""') + ') by(instance, connector_type)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='C', expr='count(' + Metrics.connector_info('connector_version!=""') + ') by(instance, connector_version)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='D', expr='count(' + Metrics.connector_info('connector_class!=""') + ') by(instance, connector_class)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='E', expr='sum(' + Metrics.worker_connector_total_task_count() + ') by(instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='F', expr='sum(' + Metrics.worker_connector_running_task_count() + ') by(instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='G', expr='sum(' + Metrics.worker_connector_failed_task_count() + ') by(instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='H', expr='sum(' + Metrics.worker_connector_paused_task_count() + ') by(instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='B', expr='sum(' + Metrics.worker_connector_destroyed_task_count() + ') by(instance)', format=TABLE_TARGET_FORMAT, instant=True),
        Target(refId='J', expr='sum(' + Metrics.worker_connector_unassigned_task_count() + ') by(instance)', format=TABLE_TARGET_FORMAT, instant=True),
    ],
    overrides=[
        override('Time', hidden=True),
        override('__name__', hidden=True),
        override('status',
            mappings={1: 'running', 2: 'paused', 3: 'stopped'},
            thresholds={None: 'green', 2: 'orange', 3: 'red'}
        ),
        override('connector', displayName='Name'),
        override('connector_type', displayName='Type'),
        override('connector_version', displayName='Version'),
        override('connector_class', displayName='Class'),
        override('Value #A', hidden=True),
        override('Value #B', displayName='Nb if Tasks destroyed', thresholds={None: 'green', 1: 'purple'}),
        override('Value #C', hidden=True),
        override('Value #D', hidden=True),
        override('Value #E', displayName='Nb of tasks', thresholds={ None: 'red', 0: 'orange', 1: 'green'}),
        override('Value #F', displayName='Nb of Tasks running', thresholds={ None: 'red', 0: 'orange', 1: 'green'}),
        override('Value #G', displayName='Nb of Tasks failed', thresholds={ None: 'green', 1: 'red'}),
        override('Value #H', displayName='Nb of Tasks paused', thresholds={ None: 'green', 1: 'orange'}),
        override('Value #I', hidden=True),
        override('Value #J', displayName='Nb of Tasks unassigned', thresholds={ None: 'green', 1: 'yellow'}),
    ],

    thresholds=[
        Threshold('green', 0, 0.0),
        Threshold('red', 1, 80.),
    ],
    transformations=[{'id': 'merge'}]
)

rebalance_average_time = TimeSeries(
    title='Rebalances average time',
    dataSource='${DS_PROMETHEUS}',
    fillOpacity=20,
    legendCalcs=['max', 'mean', 'last'],
    legendDisplayMode='table',
    legendPlacement='right',
    unit=UNITS.MILLI_SECONDS,
    targets=[Target(
        expr=Metrics.worker_rebalance_rebalance_avg_time_ms(),
        legendFormat='{{instance}}'
    )]
)

time_since_last_rebalance = Stat(
    title='($instance) Time since last rebalance',
    description='Time since last rebalance',
    dataSource='${DS_PROMETHEUS}',
    decimals=0,
    mappings=[
        {"type": "special", "options": {"match": "null", "result": {"text": "N/A"}}}
    ],
    reduceCalc='lastNotNull',
    format=UNITS.MILLI_SECONDS,
    targets=[Target(
        expr=Metrics.worker_rebalance_time_since_last_rebalance_ms(),
    )],
    thresholds=[
        Threshold('green', 0, 0.0),
    ],
    repeat=Repeat(variable='instance', direction='h')
)

task_metrics = [
    TimeSeries(
        title=title,
        description=description,
        dataSource='${DS_PROMETHEUS}',
        unit=unit,
        #legend ?
        targets=[Target(
            expr=metric(),
            legendFormat='{{connector}}-{{task}}',
        )],
    )
    for title, metric, unit, description in [
        ['Batch Size Average', Metrics.connector_task_batch_size_avg, UNITS.BYTES,
         'Average size of the batches processed by the connector'],
        ['Batch Size Max', Metrics.connector_task_batch_size_max, UNITS.BYTES,
         'Maximum size of the batches processed by the connector'],
        ['Offset Commit Success Percentage', Metrics.connector_task_offset_commit_success_percentage,
         UNITS.PERCENT_UNIT, 'Average percentage of the task’s offset commit attempts that succeeded'],
        ['Offset Commit Average Time', Metrics.connector_task_offset_commit_avg_time_ms,
         UNITS.MILLI_SECONDS, 'The average time in milliseconds taken by this task to commit offsets'],
        ['Running Ratio ', Metrics.connector_task_running_ratio, UNITS.PERCENT_UNIT,
         'The fraction of time this task has spent in the running state'],
    ]
]

task_errors = [
    TimeSeries(
        title=title,
        description=description,
        dataSource='${DS_PROMETHEUS}',
        decimals=0,
        #legend ?
        targets=[Target(
            expr=metric(),
            legendFormat='{{connector}}-{{task}}'
        )],
    )
    for title, metric, description in [
        ['Total record failures', Metrics.task_error_total_record_failures,
         'Total number of failures seen by task'],
        ['Total record errors', Metrics.task_error_total_record_errors,
         'Total number of errors seen by task'],
        ['Total record skipped', Metrics.task_error_total_records_skipped,
         'Total number of records skipped by task'],
        ['Total errors logged', Metrics.task_error_total_errors_logged,
         'The number of messages that was logged into either the dead letter queue or with Log4j'],
        ['Total retries', Metrics.task_error_total_retries, 'Total number of retries made by task'],
        ['Dead letter queue Produce Requests', Metrics.task_error_deadletterqueue_produce_requests,
         'Number of produce requests to the dead letter queue'],
        ['Dead letter queue Produce Failures', Metrics.task_error_deadletterqueue_produce_failures,
         'Number of produce requests to the dead letter queue'],
    ]
]

source_metrics = [
    TimeSeries(
        title=title,
        dataSource='${DS_PROMETHEUS}',
        description=description,
        #legend ?
        unit=unit,
        targets=[Target(
            expr=metric,
            legendFormat='{{connector}}-{{task}}',
        )],
    )
    for title, metric, unit, description in [
        ['Poll Batch Average time', Metrics.source_task_poll_batch_avg_time_ms(), UNITS.MILLI_SECONDS,
         'The average time in milliseconds taken by this task to poll for a batch of source records'],
        ['Poll Batch Max time', Metrics.source_task_poll_batch_max_time_ms(), UNITS.MILLI_SECONDS,
         'The maximum time in milliseconds taken by this task to poll for a batch of source records'],
        ['Source Record Poll rate', Metrics.source_task_source_record_poll_rate(), UNITS.OPS_PER_SEC, 
         'The average per-second number of records produced/polled (before transformation) by this '
         'task belonging to the named source connector in this worker.'],
        ['Source Record Write rate', Metrics.source_task_source_record_write_rate(), UNITS.OPS_PER_SEC,
         'The average per-second number of records output from the transformations and written to '
         'Kafka for this task belonging to the named source connector in this worker. This is after '
         'transformations are applied and excludes any records filtered out by the transformations.'],
        ['Source Record Active Count average',
         Metrics.source_task_source_record_active_count_avg(), UNITS.SHORT,
         'The average number of records that have been produced by this task but not yet completely '
         'written to Kafka.'],
        ['Source Record Active Count max',
         Metrics.source_task_source_record_active_count_max(), UNITS.SHORT,
         'The maximum number of records that have been produced by this task but not yet completely '
         'written to Kafka.']
    ]
]

sink_metrics = [
    TimeSeries(
        title=title,
        dataSource='${DS_PROMETHEUS}',
        description=description,
        #legend ?
        unit=unit,
        targets=[Target(
            expr=metric(),
            legendFormat='{{connector}}-{{task}}',
        )],
    )
    for title, metric, unit, description in [
        ['Partition Count', Metrics.sink_task_partition_count, UNITS.SHORT,
         'The number of topic partitions assigned to this task belonging to the named sink '
         'connector in this worker.'],
        ['Put Batch Average time', Metrics.sink_task_put_batch_avg_time_ms, UNITS.MILLI_SECONDS,
         'The average time in milliseconds taken by this task to put a batch of sinks records'],
        ['Put Batch Max time', Metrics.sink_task_put_batch_max_time_ms, UNITS.MILLI_SECONDS,
         'The maximum time in milliseconds taken by this task to put a batch of sinks records'],
    ]
]

cpu_usage = TimeSeries(
    title="CPU Usage",
    dataSource='${DS_PROMETHEUS}',
    fillOpacity=30,
    legendDisplayMode='table',
    legendCalcs=['max', 'mean'],
    unit=UNITS.PERCENT_UNIT,
    targets=[Target(
        expr='rate(' + Metrics.process_cpu_seconds_total() + ')',
    )]
)

jvm_memory_used = TimeSeries(
    title="JVM Memory Used",
    dataSource='${DS_PROMETHEUS}',
    fillOpacity=15,
    legendDisplayMode='table',
    legendCalcs=['max', 'mean'],
    unit=UNITS.BYTES,
    targets=[
        Target(
            expr='sum(' + Metrics.jvm_memory_bytes_used() + ') without(area)',
            legendFormat='{{instance}}'
        ),
        Target(
            expr=Metrics.jvm_memory_bytes_max(area='heap'),
            legendFormat='{{instance}}'
        ),
    ],
)

jvm_gc_duration = TimeSeries(
    title='JVM GC Collection',
    dataSource='${DS_PROMETHEUS}',
    fillOpacity=30,
    legendDisplayMode='table',
    legendCalcs=['max', 'mean'],
    unit=UNITS.SECONDS,
    targets=[Target(
        expr='sum(rate(' + Metrics.jvm_gc_collection_seconds.sum() + ')) without(gc)',
        legendFormat='{{instance}}'
    )]
)

dashboard = (
    Dashboard(
        title='Kafka Connect',
        editable=True,
        refresh='30s',
        tags=['Backeat'],
        timezone='',
        inputs=[
            DataSourceInput(
                name='DS_PROMETHEUS',
                label='Prometheus',
                pluginId='prometheus',
                pluginName='Prometheus',
            ),
            ConstantInput(
                name='namespace',
                label='namespace',
                description='Namespace associated with the Zenko instance',
                value='zenko',
            ),
            ConstantInput(
                name='job',
                label='Job',
                description='Name of the kafka connect job to filter metrics',
                value='artesca-data-base-queue-connector-metrics',
            ),
            ConstantInput(
                name='replicas',
                label='Kafka-connect replicas',
                description='Expected number of kafka connect replicas/workers',
                value='1',
            ),
        ],
        templating=Templating([
            Template(
                dataSource='${DS_PROMETHEUS}',
                label='Instance',
                name='instance',
                query='label_values(kafka_connect_commit_id_info, instance)',
                includeAll=True,
            ),
            Template(
                dataSource='${DS_PROMETHEUS}',
                label='Connector',
                name='connector',
                query='label_values(kafka_connect_connector_status, connector)',
                includeAll=True,
            ),
        ]),
        panels=layout.column([
            layout.row([up, connectors_not_running, *tasks], height=4),
            layout.row([connectors_by_status, tasks_by_status], height=7),
            layout.row([connectors_status, tasks_status], height=6),

            RowPanel(title="Connect Workers"),
            layout.row([workers], height=8),
            *[
                layout.row(worker_details[i * 3:(i+1) * 3], height=6)
                for i in range((len(worker_details) + 3 - 1) // 3)
            ],

            RowPanel(title='Connector details'),
            layout.row([connectors], height=8),

            RowPanel(title='Rebalances'),
            layout.row([rebalance_average_time], height=6),
            layout.row([time_since_last_rebalance], height=4),

            RowPanel(title='Task metrics'),
            layout.row(task_metrics[:2], height=6),
            layout.row(task_metrics[2:], height=6),

            RowPanel(title='Task Errors metrics'),
            layout.row(task_errors[:3], height=6),
            layout.row(task_errors[3:5], height=6),
            layout.row(task_errors[5:], height=6),

            RowPanel(title='Source metrics'),
            layout.row(source_metrics[:3], height=6),
            layout.row(source_metrics[3:], height=6),

            RowPanel(title='Sink metrics'),
            layout.row(sink_metrics, height=6),

            RowPanel(title="System"),
            layout.row([cpu_usage, jvm_memory_used, jvm_gc_duration], height=8),
        ]),
    )
    .auto_panel_ids()
    .verify_datasources()
)
