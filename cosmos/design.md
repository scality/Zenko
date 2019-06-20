<h1 align="center">
Out-of-band Updates from File Systems<br>The "Cosmos" Storage Backend
</h1>

### Overview

This document is a proposal for an extensible framework (a.k.a Cosmos) that will allow Zenko to manage data stored on various kinds of *backends* such as filesystems, block storage devices, and any other storage platform. Pre-existing data on these storage systems and data not created through Zenko will be chronologically ingested/synchronized.

### Problem Description

Currently, Zenko can only manage data that is stored locally, in the cloud, or in the Scality RING. In order for it to manage data stored in other *backends* (such as NFS, SMB, etc.), the data needs to be uploaded directly through the CloudServer API. However, this is an unnecessarily complex and time consuming procedure, which consists in duplicating data rather than allowing Zenko to manage existing one.

### Use-cases Description

Leverage Zenko features (multi-cloud replication, metadata search, lifecycle policies, and such) on data stored in any of the following backends transparently:

- NFS

- SMB

- CephFS

- FlexVolume

- [and more](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistent-volumes)

#### NOTE: Support for other protocols such as FTP should not require binding of a PV and can be implemented in a passthrough daemon

### Technical Details

In short, there are several components working together to provide a simple and self maintaining state to provide the desired passthrough access to any supported storage backend.

First, a scheduler will *watch* MongoDB for relevant configuration updates that may be pushed down by the Orbit management system. Whenever a new storage location of type *"passthrough"* is added along with a corresponding ingestion bucket, this scheduler will provision a "Cosmos" Custom Resource in Kubernetes. An operator will then take this Custom Resource and deploy a templated helm chart based off the values in it's spec. Every new storage location created in this way will map to a unique backend. This allows us to easily maintain the state of each passthrough backend independently.

This helm chart will contain a scaleable deployment of pods that will then serve that data of the underlying storage system over RESTful API to Cloudserver, similarly to how the S3-Data service functions. Additionally, a cron job will be deployed to syncrhonize/ingest any pre-existing data and data not created through Zenko chronologically.

##### Cosmos

The Cosmos install consists of 2 pods:

- Passthrough File Daemon (PFSD): A RESTful HTTP server that can stream data from its underlying filesystem to whomever requests for it (i.e. Cloudserver).

- RClone: An rsync-like client that supports S3 api along with a plethora of other cloud APIs. This is deployed as a Kubernetes cron job designed to run a specified intervals to sync Cloudserver with the specified backend.

**Note:** Optimizations can be made in *v2* to allow the rclone process to run sooner based on things like geosync logs for hinting and listing/attribute cache to speed up the listing.

### Alternatives

Currently, there are **NO** alternatives for the "Cosmos" framework. However, there are some alternatives for specifically supporting "NFS" compatible storage systems as a backend and/or being able to ingest data from them. Here is a list of the few considered options:

- **Option 1: Mount CloudServer Pods**
  With SYS_ADMIN or similar capabilities applied to each of the Cloudserver containers, they would be able to directly “mount” to an NFS which would greatly simplify configuration. However, this opens the door to potentially severe security risk because Cloudserver is an externally exposed service (in fact, the only one).

  **Pros:**

  - Easy to implement (adding a `mount` to the Cloudserver entrypoint).

  **Cons:**

  - Requires special kernel level privileges.
    #### Note: The proposed framework will require special Kubernetes level priviledges

  - If the NFS server fails, CloudServer will be unresponsive.

- **Option 2: A user-space NFS client**
  With a userland NFS client, such as [node-nfsc](https://github.com/scality/node-nfsc), the Cloudserver pods would be able to safely mount on the the NFS exports.

  **Pros:**

  - It doesn't require privileges.

  - If the NFS server fails, Cloudserver will be still be responsive.

  **Cons:**

  - Currently, there is no support NFSv4 and some NFS server may not be compatible.

  - Not as stable as the kernel based NFS client.

  - We would have to implement correct connection pooling and parallelism to have credible performance.

- **Option 3: Live update daemon**

  - Listing with prefix: compare both mtimes for the directory on the filesystem and in MongoDB for that prefix (there should be a placeholder). if up to date, CloudServer proceeds with the listing from MongoDB. if not up-to-date, CloudServer finds the changes and update MongoDB's content for that particular prefix, then proceeds with the listing (still from MongoDB).
  - HEAD or GET on an object: stat(3) the targeted file, update the object's representation in MongoDB if relevant, then CloudServer proceeds with serving the file.
  - Listing without prefix: proceed with the recursive listing of the filesystem (modulo the maxKeys parameter) and update the objects/"directory placeholders" in MongoDB if relevant (I just made it up, I'm not certain about this part).

  **Pros:**

  - No need for rclone.

  **Cons:**

  - There is a complication when file system clients perform partial updates of the files.

  - Only happens with specific file system workloads, e.g. random writes. And this constraint can be easily understood (or stated as not optimized).

  - The first HEAD/GET on the partially modified file the MongoDB image gets updated.

  - Races between readdir and stat are more commonly understood, which can be ok as long as the former returns the truth about the file.

### Roadmap

- v1: Read/Delete capabilities. The goal is only to be able to ingest data from a NAS.
- v2: Add support for FTP passthrough over RESTful API
  - This would allow Cloudserver to communicate to FTP backends
- v3: Write functionality. Full control of NAS-backed data through Zenko.

### Design Diagram

```ascii
                              +---------------------+
                              |        Orbit        |
                              +----------^----------+
                                         |
+---------------------------------------------------------------------------------+
|                                        |                                        |
|                             +----------v----------+             +-------------+ |
|                             |                     <------------->             | |
|             +--------------->     CloudServer     |             |   MongoDB   | |
|             |               |                     <----------+  |             | |
|             |               +----------^----------+          |  +------+------+ |
|             |                          |                     |         |        |
|             |                          |     +-------------------------+        |
|             |                          |     |               +---+              |
|    +--------+---------+     +----------+-----v----+     +--------v---------+    |
|    |        |         |     |                     |     |        |         |    |
|    | RClone |  PFSD   <-----+      Scheduler      +-----> RClone |   PFSD  |    |
|    +--------+---------+     |                     |     +--------+---------+    |
|    |       PVC        |     +----+------------+---+     |       PVC        |    |
|    +--------^---------+          |            |         +--------^---------+    |
|             |                    |            |                  |              |
|             |                    |            |                  |              |
|    +--------v---------+          |            |         +--------v---------+    |
|    |                  |          |            |         |                  |    |
|    |    In-tree PV    <----------+            +--------->  Out-of-tree PV  |    |
|    |    (i.e. NFS)    |                                 |    (i.e. SMB)    |    |
|    |                  |                                 |                  |    |
|    +--------^---------+                                 +--------^---------+    |
|             |                                                    |              |
|             |                                                    |              |
+---------------------------------------------------------------------------------+
              |                                                    |
     +--------v---------+                                 +--------v---------+
     |                  |                                 |                  |
     |    NFS Server    |                                 |    SMB Server    |
     |                  |                                 |                  |
     +------------------+                                 +------------------+
```

