#!/bin/bash

get_mongodb_version() {
    echo "$(mongo --quiet --host "mongodb://127.0.0.1/?replicaSet=${MONGODB_REPLICA_SET_NAME}" -u 'root' -p "$MONGODB_ROOT_PASSWORD" --eval 'db.version()')"
}

set_default_majority_if_mongos() {
    mongo --host "mongodb://127.0.0.1/?replicaSet=${MONGODB_REPLICA_SET_NAME}" -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
var writeConcern = { w: "majority" }
db.adminCommand( { setDefaultRWConcern: 1, defaultWriteConcern: writeConcern } )
EOF
}

set_default_majority_if_not_configsvr() {
    mongo --host "mongodb://127.0.0.1/?replicaSet=${MONGODB_REPLICA_SET_NAME}" -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
var conf = rs.config();
var defaultWriteConcern = conf.settings.getLastErrorDefaults;
if (!defaultWriteConcern || defaultWriteConcern.w !== 'majority') {
    defaultWriteConcern.w = 'majority';
    rs.reconfig(conf);
}
EOF
}

version=$(get_mongodb_version)
major=$(echo "$version" | cut -d. -f1)
minor=$(echo "$version" | cut -d. -f2)

# Handling of MongoDB 4.4+
if [ "${MONGODB_SHARDING_MODE:-}" == "mongos" ] && [ "$major" -ge 4 ] && [ "$minor" -ge 4 ]; then
    set_default_majority_if_mongos
fi

# Handling of MongoDB <4.4
if [ "${MONGODB_SHARDING_MODE:-}" != "configsvr" ] && ([ "$major" -lt 4 ] || ([ "$major" -eq 4 ] && [ "$minor" -lt 4 ])); then
    set_default_majority_if_not_configsvr
fi