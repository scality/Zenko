Design
======

The RESTful API exposes methods for users to pause and resume
cross-region replication operations.

Redis’s pub/sub function propagates requests to all active CRR Kafka
Consumers on all nodes that have Backbeat containers set up for
replication.

Backbeat's design allows pausing and resuming the CRR service at the
lowest level (pause and resume all Kafka Consumers subscribed to the CRR
topic) to stop processing any replication entries that might have
already been populated by Kafka but have yet to be consumed and queued
for replication. Any entries already consumed by the Kafka Consumer and
being processed for replication finish replication and are not paused.

The API has a Redis instance publishing messages to a specific channel.
Queue processors subscribe to this channel, and on receiving a request
to pause or resume CRR, notify all their Backbeat consumers to perform
the action, if applicable. If an action occurs, the queue processor
receives an update on the current status of each consumer. Based on the
global status of a location, the status is updated in ZooKeeper if a
change has occurred.

When a consumer pauses, the consumer process is kept alive and maintains
any internal state, including offset. The consumer is no longer
subscribed to the CRR topic, so no longer tries to consume any entries.
When the paused consumer is resumed, it again resumes consuming entries
from its last offset.
