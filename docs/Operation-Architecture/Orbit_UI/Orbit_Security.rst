Orbit Security
==============

Orbit sessions use a direct connection proxied through
`https://admin.zenko.io <https://admin.zenko.io/>`__. Connections are
encrypted end-to-end between the user’s browser and the admin.zenko.io
proxy, and from there to the Zenko instance. No user content in
transmission is stored, cached, read, or readable by Scality systems.

Metrics (and configuration) are stored in Scality systems using
non-identifiable numbers or encrypted blobs except for the following
essential name space information

-  Bucket names
-  Remote credential names (secret keys are encrypted such that only the
   Zenko instance itself can decrypt them)
-  Zenko-local storage account names, location names and endpoints

The following features employ real-time communication

-  CRR failed object listing and retry operations
-  Multicloud browser
-  Metadata search

The most secure operating mode is when the instance is linked and locked
to a user account. Forgetting the instance, except for momentary
transfer to another account, is not a best practice. Forgetting the
instance does not stop the secure channel, which is needed for normal
operation.


