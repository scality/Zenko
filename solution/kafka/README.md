# Kafka Docker Image

Thin layer over [koperator](https://github.com/adobe/koperator)'s [Apache Kafka](https://kafka.apache.org)
image, adding Zenko's log4j configuration and disabling GC logging.

Using koperator's own image keeps the brokers and the cruise-control metrics reporter koperator
injects into them built against the same Kafka version.
