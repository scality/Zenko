Resync a MongoDB Member
=====================================

Problem Description
-------------------

After a prolonged downtime period, a MongoDB member can fail to restart due to
a rollback operation that is unable to complete within the default timeout
of 24 hours. In this case, the replica set becomes "stale" and the member
must be completely resynchronized with the rest of the replica set, by
removing its data and performing an
`initial sync <https://www.mongodb.com/docs/manual/core/replica-set-sync/#std-label-replica-set-initial-sync>`__.

Problem Resolution
------------------

.. warning::

   To prevent changing the write quorum, never rotate more than one replica set
   member at a time.

#. Locate the MongoDB member that is unable to restart. Run
   the following command on the primary member of the replica set:

   .. command-block:: get-mongodb-replicas

     kubectl exec hpe-3par-mongodb-replicaset-<id> -- \
        bash -c "mongo --eval 'rs.status()'"

   Any replica set member with a ``RECOVERING`` or ``ROLLBACK`` state will need a
   resync. ``<id>`` is a number, by default ``0``.

#. Save the index in a variable for later use:

   .. code-block:: shell

      export MONGODB_REPLICA_ID=<MONGODB_REPLICA_ID>

#. Put a write lock on the MongoDB instance to prevent any new writes:

   .. command-block:: write-lock-mongodb

     kubectl exec hpe-3par-mongodb-replicaset-$MONGODB_REPLICA_ID -- \
        bash -c "mongo --eval 'db.fsyncLock()'"

#. Delete all the data in the MongoDB instance:

   .. command-block:: delete-mongodb-data

      kubectl exec hpe-3par-mongodb-replicaset-$MONGODB_REPLICA_ID -- \
         bash -c 'rm -rf /data/db/*'

#. Restart the MongoDB instance to initiate the resynchronization process:

   .. command-block:: restart-mongodb-instance

      kubectl delete pod hpe-3par-mongodb-replicaset-$MONGODB_REPLICA_ID -n zenko

#. Check that the member has rejoined the replica set and started the
   initial sync:

   .. note::

      The MongoDB instance may take several minutes before restarting,
      this is normal.

      During the initial sync process, the MongoDB instance might be in the
      ``STARTUP2`` state.

   .. command-block:: verify-mongodb-replica-sync

      kubectl exec hpe-3par-mongodb-replicaset-$MONGODB_REPLICA_ID -- \
         bash -c "mongo --eval 'rs.status()'"

The MongoDB instance must now be in the ``SECONDARY`` state and fully synced
with the replica set.
