#!/bin/bash

set_default_majority() {
    mongo --host "mongodb://127.0.0.1/?replicaSet=${MONGODB_REPLICA_SET_NAME}"  -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
conf = rs.config()

defaultWriteConcern = conf.settings.getLastErrorDefaults

if (!defaultWriteConcern || defaultWriteConcern.w !== 'majority' || !defaultWriteConcern.wtimeout || defaultWriteConcern.wtimeout === 0) {
    defaultWriteConcern.w = 'majority'
    defaultWriteConcern.wtimeout = 30000
    rs.reconfig(conf)
}
EOF
}

if [ "${MONGODB_SHARDING_MODE:-}" != "configsvr" ]; then
    set_default_majority
fi
