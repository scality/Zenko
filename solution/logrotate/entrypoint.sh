#!/bin/sh
set -eu

trap 'exit 0' TERM INT

while :; do
    logrotate --state /var/lib/logrotate/status /etc/logrotate.conf || echo "logrotate exited with $?" >&2
    sleep 10 &
    wait $!
done
