Kafka
=====

Kafka is a distributed streaming platform written in Java for the Apache
ecosystem.

Backbeat uses Kafka as a journaling system to track jobs to be performed
and as a persistent queue for failed operations to retry. Jobs come to
Kafka from Node.js streams (from producers), and Kafka queues them for
Backbeat to follow.

The lifespan of jobs queued in Kafka’s journal is configurable (the
current default lifespan of a job in Backbeat’s Kafka queue is seven
days), and after the job’s age reaches the configured retention time,
Kafka purges it from the queue. This solves two problems: job
instructions are stored in a stable, non-volatile system (not, for
instance, in a fugitive database, such as Redis) that is also not
enduring (once completed, the job information is not preserved).


