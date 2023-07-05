#!/bin/bash

set_default_majority() {
    mongo --host "mongodb://127.0.0.1/?replicaSet=${MONGODB_REPLICA_SET_NAME}"  -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
var version = db.version().split(".");
var major = parseInt(version[0]);
var minor = parseInt(version[1]);

if (major > 4 || (major == 4 && minor >= 4)) {
    var writeConcern = { w: "majority" }
    db.adminCommand( { setDefaultRWConcern: 1, defaultWriteConcern: writeConcern } )
} else {
    conf = rs.config()
    defaultWriteConcern = conf.settings.getLastErrorDefaults
    if (!defaultWriteConcern || defaultWriteConcern.w !== 'majority') {
        defaultWriteConcern.w = 'majority'
        rs.reconfig(conf)
    }
}
EOF
}

if [ "${MONGODB_SHARDING_MODE:-}" != "configsvr" ]; then
    set_default_majority
fi