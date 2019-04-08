
#!/bin/sh

while [ -z "$(curl localhost:27017 2>&1 | grep MongoDB)" ]; do
    sleep 1
done


IP=$(ifconfig eth0 | awk '/inet/{split($2,a,":"); print a[2]}')

mongo<<EOF
rs.initiate(
    {
        _id: "${REPLICASET}",
        version: 1,
        members: [
        { _id: 0, host : "${IP}:27017" },
        { _id: 1, host : "${IP}:27018" },
        { _id: 2, host : "${IP}:27019" }
        ]
    }
)
EOF
