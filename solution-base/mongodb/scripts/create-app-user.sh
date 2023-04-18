#!/bin/bash

create_user() {
    mongo --host "mongodb://127.0.0.1/?replicaSet=${MONGODB_REPLICA_SET_NAME}"  -u 'root' -p "$MONGODB_ROOT_PASSWORD" <<EOF
roleDef = {
    role: 'inprogViewer', 
    privileges: [
        { resource: { cluster: true }, actions: [ 'inprog' ] },
        { resource: { db: '', collection: '' }, actions: [ 'killCursors' ] }
    ],
    roles: []
}

role = db.getSiblingDB('admin').getRole(roleDef.role)
if (role == null) {
    db.getSiblingDB('admin').createRole(roleDef)
} else {
    db.getSiblingDB('admin').updateRole(roleDef.role, { privileges: roleDef.privileges, roles: roleDef.roles })
}

user = db.getSiblingDB('admin').getUser('$MONGODB_APP_USERNAME')
requiredRoles = [
    { role: roleDef.role, db: 'admin' },
    { role: 'enableSharding', db: '$MONGODB_APP_DATABASE' },
    { role: 'readWrite', db: '$MONGODB_APP_DATABASE' },
    { role: 'read', db: 'local' }
]

if (user == null) {
    db.getSiblingDB('admin').createUser({
        user: '$MONGODB_APP_USERNAME',
        pwd: '$MONGODB_APP_PASSWORD',
        roles: requiredRoles
    })
} else {
    db.getSiblingDB('admin').grantRolesToUser('$MONGODB_APP_USERNAME', requiredRoles)
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
