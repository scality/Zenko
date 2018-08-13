#!/bin/sh

while [ ! -z "$1" ]; do
    echo "npm run $1"
    npm run "$1"
    status="$?"
    if [ "$status" -gt 0 ]; then
        echo "command: npm run $1 failed with exit code $status" >&2
        exit 1
    fi
    shift
done
