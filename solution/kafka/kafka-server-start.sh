#!/bin/bash
"$(dirname "$0")/kafka-server-start-real.sh" "$@"
KAFKA_EXIT=$?
printf "%d" "$KAFKA_EXIT" > /var/run/kafka-exit/code
exit "$KAFKA_EXIT"
