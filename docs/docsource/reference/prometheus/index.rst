Prometheus
==========

One of several dashboards available to Zenko users, Prometheus provides insight
into Kubernetes platform (MetalK8s) and Zenko functionality.

Lifecycle Metrics
-----------------

The lifecycle transition policies feature generates useful metrics, currently
exposed through SoundCloud's Prometheus toolkit. Exposure through the Backbeat
API is under development.

The following Prometheus metrics are available (see the `Prometheus
documentation <https://prometheus.io/docs/introduction/overview/>`_ for how to
access counter/gauge/histogram data and how to query the Prometheus API).
Labels and their content are described below.

Available Metrics
~~~~~~~~~~~~~~~~~

zenko_replication_queued_total
``````````````````````````````
- type: counter
- description: number of objects queued for replication
- labels: origin, partition, fromLocation, fromLocationType, toLocation, 
  toLocationType

zenko_replication_queued_bytes
``````````````````````````````
- type: counter
- description: number of bytes queued for replication
- labels: origin, partition, fromLocation, fromLocationType, toLocation, 
  toLocationType

zenko_replication_processed_bytes
`````````````````````````````````
- type: counter
- description: number of bytes replicated
- labels: origin, fromLocation, fromLocationType, toLocation, toLocationType,
  status

zenko_replication_elapsed_seconds
`````````````````````````````````
- type: histogram
- description: replication jobs elapsed time in seconds
- labels: origin, fromLocation, fromLocationType, toLocation, toLocationType,
  status, contentLengthRange

Labels
``````

The following labels are provided to one or more of the above metrics:

- **origin:** The origin label identifies the service that triggered the
  replication, e.g. “lifecycle”. Currently, lifecycle is the only service to use
  replication as reflected in these metrics, but when other services under
  development use it, this label will be used to distinguish replication tasks
  by the services triggering them.

- **partition:** The partition number in the “backbeat-data-mover” Kafka topic
  where the replication task has been queued

- **fromLocation:** The name of the source Zenko location 

- **fromLocationType:** This identifies the type of location from which the
  ``fromLocation`` call emerged: ``aws_s3`` for an AWS compatible location,
  ``local`` for a local storage location or a RING location, ``azure`` for an
  Azure location, ``gcp`` for a Google Cloud location.

- **toLocation:** The name of the target Zenko location

- **toLocationType:** This identifies the type of location to which the
  information in ``toLocation`` is targeted, following the convention described
  in ``fromLocation``.

- **status:** This reports the status of the finished task: ``success`` if the
  replication completed successfully or ``error`` if it did not.

- **contentLengthRange:** This range separates the metric values in different
  content-length (object size) buckets to offer more meaningful elapsed time
  metrics grouped by object size ranges. The labels used are: ``<10KB``,
  ``10KB..30KB``, ``30KB..100KB``, […], ``300GB..1TB``, ``>1TB``.

Kafka Metrics
~~~~~~~~~~~~~

Kafka provides its own set of Prometheus metrics. One, kafka_consumergroup_lag,
is especially useful for monitoring lifecycle transitions:

kafka_consumergroup_lag
```````````````````````
- type: counter

- description: Lag of consumer groups on a topic/partition, i.e. number of
  messages published but not consumed yet by this consumer group

- labels: topic, partition, consumergroup

Labels
``````
The following labels can be used to filter this metric:

- **topic:** The topic name. The relevant topic names for transition policies
  are:

   - “backbeat-data-mover” for tracking the data mover (replication) topic

   - “backbeat-lifecycle-bucket-tasks” for tracking the bucket tasks
     topic (scanning buckets for lifecycle actions to execute on objects)

   - “backbeat-lifecycle-object-tasks” for tracking the object tasks
     topic (tasks to execute on each expiration or a transition object)

   - “backbeat-gc” for tracking the garbage collection topic (The garbage 
     collection service removes original data after a transition. It is also
     used for transient source data removal after successful CRR.)

- **partition:** Partition number in the Kafka topic

- **consumergroup:** This label carries the consumer group name. Relevant 
  consumer group names for transition policies are:

   - backbeat-replication-group-[location name]: Consumer group that consumes
     replication tasks of transition actions to a particular location
     (e.g. “backbeat-replication-group-aws1” tracks the consumer group for the
     "aws1" location). Consumer groups will also consume messages for other
     locations, but will not process them (hence the lag will also count
     replications to other locations).

   - backbeat-lifecycle-bucket-processor-group: The unique consumer
     group of the “backbeat-lifecycle-bucket-tasks” topic.

   - backbeat-lifecycle-object-processor-group: The unique consumer
     group of the “backbeat-lifecycle-object-tasks” topic.

   - backbeat-gc-consumer-group: The unique consumer group of the
     “backbeat-gc” topic

You can use either the Prometheus API or the Prometheus UI and the PromQL 
query language to access these metrics.

Below is an example. See the Prometheus documentation for a full PromQL
reference. 

- Compute the total average throughput, in bytes per second, of successful
  replications triggered by lifecycle transitions over the last 5 minutes::

      sum(rate(zenko_replication_processed_bytes{origin="lifecycle",status=”success”}[5m]))

The foregoing descriptions are not encyclopedic. You may find other metrics not
documented here to be suitable for your use case.
