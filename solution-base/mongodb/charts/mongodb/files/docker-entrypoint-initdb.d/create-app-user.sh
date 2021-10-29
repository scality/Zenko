#!/bin/bash

create_user() {
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

    if [ $count -ge 10 ]; then
        echo "Failed to create app user."
        exit 1
    fi
}

retry create_user
