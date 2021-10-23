#!/bin/bash

create_user() {
    local MONGODB_HOSTS=$(printf '%s' \
        "dev-db-mongodb-primary-0.dev-db-mongodb-headless.$MONGODB_NAMESPACE.svc.cluster.local.:27017" \
        ",dev-db-mongodb-secondary-0.dev-db-mongodb-headless.$MONGODB_NAMESPACE.svc.cluster.local:27107" \
        ",dev-db-mongodb-secondary-1.dev-db-mongodb-headless.$MONGODB_NAMESPACE.svc.cluster.local:27017" \
    )

    mongo --host $MONGODB_HOSTS -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
user = db.getSiblingDB('admin').getUser('$MONGODB_APP_USERNAME')
if (user == null) {
    db.getSiblingDB('admin').createUser({
        user: '$MONGODB_APP_USERNAME',
        pwd: '$MONGODB_APP_PASSWORD',
        roles: [
            {role: 'readWrite', db: '$MONGODB_APP_DATABASE' },
            {role: 'read', db: 'local' }
        ]
    })
}
EOF
}

retry() {
    local count=0

    while ! "$@" && [ $count -lt 10 ]; do
        count=$(($count + 1))
        sleep 5
    done

    [ $count -lt 10 ] || echo "Failed to create app user."
}

retry create_user
