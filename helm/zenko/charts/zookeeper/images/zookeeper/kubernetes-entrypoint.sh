#!/bin/bash

set -e

ZOO_HEAP_SIZE=${ZOO_HEAP_SIZE:-2G}
ZOO_SERVER_PORT=2888
ZOO_ELECTION_PORT=3888
PROMETHEUS_AGENT=${PROMETHEUS_AGENT:-"/opt/jmx_prometheus_javaagent/jmx_prometheus_javaagent-0.2.0.jar"}
PROMETHEUS_AGENT_CONFIG=${PROMETHEUS_AGENT_CONFIG:-"/etc/prometheus_agent.yml"}

HOST=$(hostname -s)
DOMAIN=$(hostname -d)


function find_node_id() {
    echo "Find current node Id"

    if [[ $HOST =~ (.*)-([0-9]+)$ ]]; then
        NAME=${BASH_REMATCH[1]}
        ORD=${BASH_REMATCH[2]}
    else
        echo "Failed to extract ordinal from hostname $HOST"
        exit 1
    fi
    export ZOO_MY_ID=$((ORD+1))
}

function compute_server_list() {
    if [ -z $ZOO_REPLICAS ]; then
        echo "ZOO_REPLICAS is a mandatory environment variable"
        exit 1
    fi
    for (( i=1; i<=$ZOO_REPLICAS; i++ ))
    do
        ZOO_SERVERS="$ZOO_SERVERS server.$i=$NAME-$((i-1)).$DOMAIN:$ZOO_SERVER_PORT:$ZOO_ELECTION_PORT"
    done
    echo $ZOO_SERVERS
    export ZOO_SERVERS=$ZOO_SERVERS
}

function create_java_env() {
    echo "Creating JVM configuration file"
    JAVA_ENV_FILE=$ZOO_CONF_DIR/java.env
    rm -f $JAVA_ENV_FILE
#    echo "ZOO_LOG_DIR=$ZOO_LOG_DIR" >> $JAVA_ENV_FILE
    echo "JVMFLAGS=\"-Xmx$ZOO_HEAP_SIZE -Xms$ZOO_HEAP_SIZE\"" >> $JAVA_ENV_FILE
    echo "JVMFLAGS=\"\${JVMFLAGS} -javaagent:${PROMETHEUS_AGENT}=${PROMETHEUS_PORT}:${PROMETHEUS_AGENT_CONFIG}\"" >> $JAVA_ENV_FILE
    echo "Wrote JVM configuration to $JAVA_ENV_FILE"
}

find_node_id && compute_server_list && create_java_env

exec /docker-entrypoint.sh "$@"
