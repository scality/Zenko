CloudServer
===========

Zenko CloudServer is an open-source Node.js object storage server
handling the Amazon S3 protocols.

By providing a free-standing implementation of the S3 API, CloudServer
offers developers the freedom to build S3 apps and run them either
on-premises, in the AWS public cloud, or both—with no code changes.
CloudServer is deployed in a Docker container.

Overview
--------

.. image:: ../Resources/Images/CloudServer.svg
   :align: center

.. tabularcolumns:: X{0.20\textwidth}X{0.65\textwidth}
.. table::

   +---------------------+---------------------------------------------------------+
   | Component           | Description                                             |
   +=====================+=========================================================+
   | S3 Routes           | The main S3 service that receives S3-protocol commands. |
   +---------------------+---------------------------------------------------------+
   | Backbeat Routes     | A special Backbeat-only S3 service that uses backbeat   |
   |                     | routes to replicate data to other clouds and update the |
   |                     | replication status of the local object, while being     |
   |                     | authenticated as the internal Backbeat service.         |
   +---------------------+---------------------------------------------------------+
   | Management Agent    | CloudServer establishes an HTTPS connection to Orbit    |
   |                     | (API Push Server) and uses polling or websockets. The   |
   |                     | management agent stores the configuration, an           |
   |                     | in-memory-only overlay of the configuration, in the     |
   |                     | Metadata service. The same mechanism retrieves          |
   |                     | statistics from the Backbeat API and, later, to         |
   |                     | control the Replication service and do the same with    |
   |                     | other service components.                               |
   +---------------------+---------------------------------------------------------+
   | Prometheus client   | (Not depicted) Monitoring information is maintained in  |
   |                     | a Prometheus endpoint. Prometheus polls this endpoint   |
   |                     | for monitoring.                                         |
   +---------------------+---------------------------------------------------------+
   | Metadata backend    | A multi-backend interface than can talk to MongoDB.     |
   +---------------------+---------------------------------------------------------+
   | Data Backend        | A multi-backend interface than can talk to different    |
   |                     | clouds while preserving namespace (S3, Azure, GCP).     |
   +---------------------+---------------------------------------------------------+

.. note::

   CloudServer also supports bucketd and sproxyd protocol for S3 Connector.


Use Cases
---------

As currently implemented with Zenko, CloudServer supports the following
use cases.

-  **Direct cloud storage**

   Users can store data on the managed cloud locations using the S3
   protocol, if a cloud location (AWS, Azure, GCP, etc.) and endpoints
   are configured (using Orbit or a configuration file).

-  **Managing a preferred location for PUTs and GETs**

   When defining an endpoint, you can define and bind a preferred read
   location to it. This is a requirement for transient source support.

-  **Objects’ cloud location readable**

   CloudServer can read objects’ location property.

-  **Direct RING storage (sproxydclient)**

   CloudServer uses a library called sproxydclient to access the RING
   through the sproxy daemon (sproxyd).

-  **Direct SOFS storage (cdmiclient)**

   CloudServer uses a library called cdmiclient to access the SOFS
   Dewpoint daemon through the CDMI protocol. Both the file system and
   the S3 environment have their own metadata. The CDMI protocol allows
   a user to attach custom metadata to an entity (directory/file). This
   feature is used to save S3 metadata: an entry named “s3metadata” is
   added to a metadata entity. Its value is the S3 metadata (JSON
   object). When an object is created from an S3 client, the cloud
   server produces all the S3 metadata. When a file is created using the
   file system interface (either using CDMI protocol or a traditional
   file system client on Dewpoint daemon fuse mountpoint), S3 metadata
   is reconstituted from POSIX information.

-  **Healthcheck**

   Currently, a liveness probe calls /\_/healthcheck/deep. Services that
   expose readiness can also get a readiness probe.

-  **Metrics Collection**

   These metrics are valid on all NodeJS-based services:

.. tabularcolumns:: X{0.45\textwidth}X{0.45\textwidth}
.. table:: NodeJS Process General Metrics

   +-----------------------------------------------+---------------------------------------------------------+
   | Metric                                        | Description                                             |
   +===============================================+=========================================================+
   | nodejs\_version\_info                         | NodeJS Version info                                     |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_heap\_space\_size\_available\_bytes   | Process heap space size available from node.js in bytes |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_heap\_size\_total\_bytes              | Process heap size from node.js in bytes                 |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_heap\_size\_used\_bytes               | Process heap size used from node.js in bytes            |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_external\_memory\_bytes               | Nodejs external memory size in bytes                    |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_heap\_space\_size\_total\_bytes       | Process heap space size total from node.js in bytes     |
   +-----------------------------------------------+---------------------------------------------------------+
   | process\_cpu\_user\_seconds\_total            | Total user CPU time spent in seconds                    |
   +-----------------------------------------------+---------------------------------------------------------+
   | process\_cpu\_system\_seconds\_total          | Total system CPU time spent in seconds                  |
   +-----------------------------------------------+---------------------------------------------------------+
   | process\_cpu\_seconds\_total                  | Total user and system CPU time spent in seconds         |
   +-----------------------------------------------+---------------------------------------------------------+
   | process\_start\_time\_seconds                 | Start time of the process since unix epoch in seconds   |
   +-----------------------------------------------+---------------------------------------------------------+
   | process\_resident\_memory\_bytes              | Resident memory size in bytes                           |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_eventloop\_lag\_seconds               | Lag of event loop in seconds                            |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_active\_handles\_total                | Number of active handles                                |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_active\_requests\_total               | Number of active requests                               |
   +-----------------------------------------------+---------------------------------------------------------+
   | nodejs\_heap\_space\_size\_used\_bytes        | Process heap space size used from node.js in bytes      |
   +-----------------------------------------------+---------------------------------------------------------+

.. tabularcolumns:: X{0.45\textwidth}X{0.45\textwidth}
.. table:: Cloud Server General Metrics

   +--------------------------------------+--------------------------------------+
   | Metric                               | Description                          |
   +======================================+======================================+
   | cloud\_server\_number\_of\_buckets   | Total number of buckets              |
   +--------------------------------------+--------------------------------------+
   | cloud\_server\_number\_of\_objects   | Total number of objects              |
   +--------------------------------------+--------------------------------------+
   | cloud\_server\_data\_disk\_available | Available data disk storage in bytes |
   +--------------------------------------+--------------------------------------+
   | cloud\_server\_data\_disk\_free      | Free data disk storage in bytes      |
   +--------------------------------------+--------------------------------------+
   | cloud\_server\_data\_disk\_total     | Total data disk storage in bytes     |
   +--------------------------------------+--------------------------------------+

.. tabularcolumns:: X{0.45\textwidth}X{0.45\textwidth}
.. table:: Labeled Metrics

   +--------------------------------------------+-------------------------------------------+
   | Metric                                     | Description                               |
   +============================================+===========================================+
   | cloud\_server\_http\_requests\_total       | Total number of HTTP requests             |
   +--------------------------------------------+-------------------------------------------+
   | cloud\_server\_http\_request\_duration     | Duration of HTTP requests in microseconds |
   | \_microseconds                             |                                           |
   +--------------------------------------------+-------------------------------------------+
   | cloud\_server\_http\_request\_size\_bytes  | The HTTP request sizes in bytes           |
   +--------------------------------------------+-------------------------------------------+
   | cloud\_server\_http\_response\_size\_bytes | The HTTP response sizes in bytes          |
   +--------------------------------------------+-------------------------------------------+
