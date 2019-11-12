.. _Blobserver:

Blobserver
==========

Blobserver is an open-source Node.js object storage server built to handle Azure
Blob Storage protocols. BlobServer provides an Azure Blob Storage API interface
to access multiple backend data storage both on-premise or public in the cloud.

Blobserver operates as a modular stand-in for CloudServer. If a user configures
Blobserver as a frontend service, Zenko spins up Blobserver instances as needed
to ensure a highly available service to manage the Zenko namespace in an Azure
context. Blobserver has not achieved feature parity wth CloudServer as of Zenko
version |version|.
