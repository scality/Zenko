#!/bin/bash

if which mongo &> /dev/null; then
    mongoCmd="mongo"
else
    mongoCmd="mongosh"
fi

set_default_majority() {
    $mongoCmd "mongodb://127.0.0.1:27017/?replicaSet=${MONGODB_REPLICA_SET_NAME}"  -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
conf = rs.config()

defaultWriteConcern = conf.settings.getLastErrorDefaults

if (!defaultWriteConcern || defaultWriteConcern.w !== 'majority') {
    defaultWriteConcern.w = 'majority'
    rs.reconfig(conf)
}
EOF
}

if [ "${MONGODB_SHARDING_MODE:-}" != "configsvr" ]; then
    set_default_majority
fi
