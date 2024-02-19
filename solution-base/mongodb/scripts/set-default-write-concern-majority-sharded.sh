#!/bin/bash

set_default_majority_if_mongos() {
    mongosh --host "mongodb://127.0.0.1/?replicaSet=${MONGODB_REPLICA_SET_NAME}" -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
var writeConcern = { w: "majority" }
db.adminCommand( { setDefaultRWConcern: 1, defaultWriteConcern: writeConcern } )
EOF
}

# Set default write concern to "majority" if the MongoDB mode is "mongos"
if [ "${MONGODB_SHARDING_MODE:-}" == "mongos" ]; then
    set_default_majority_if_mongos
fi