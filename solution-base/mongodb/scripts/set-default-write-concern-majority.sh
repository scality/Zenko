#!/bin/bash

set_default_majority() {
    mongosh "mongodb://127.0.0.1:27017/?replicaSet=${MONGODB_REPLICA_SET_NAME}"  -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
conf = rs.config()

try {
    let currentDefault = db.adminCommand({ getDefaultRWConcern: 1 })

    if (!currentDefault.defaultWriteConcern || currentDefault.defaultWriteConcern.w !== 'majority') {
        db.adminCommand({
            setDefaultRWConcern: 1,
            defaultWriteConcern: { w: 'majority' }
        })
        print("Default write concern set to 'majority'")
    } else {
        print("Default write concern already set to 'majority'")
    }
} catch (e) {
    print("Error setting default write concern: " + e)
    quit(1)
}
EOF
}

if [ "${MONGODB_SHARDING_MODE:-}" == "configsvr" ]; then
    set_default_majority
else
    echo "Skipping write concern configuration as this is not a config server."
fi
