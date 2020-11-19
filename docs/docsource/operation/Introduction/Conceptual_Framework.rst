Conceptual Framework
====================

XDM is designed to help administrators of large storage systems control,
manage, replicate, and visualize data in a multi-cloud context.

Fundamental building blocks of XDM’s replication framework are the bucket, the
location, and the cloud service. End users (people or services) store data as
files in buckets. Administrators are free to configure and name buckets as they
please—to the admin, buckets are essentially tenants aggregated in a cloud
storage deployment. From an end user’s perspective, a bucket simply appears as a
networked storage location, for example, “accounting,” “bioinformatics-lab,”
“video-backup,” or any other organizational unit that makes sense.

XDM can fetch buckets from one location — a Scality RING private cloud, for
example — and replicate them to designated cloud storage locations on other
clouds. A company may, for example, store its data by departmental buckets to
local cloud, then replicate that cloud storage location to several other public
or private clouds for storage redundancy, rate-shopping, or other
purposes. XDM can also provide useful management features for large quantities
of unstructured data without replicating data at all: a company with very large
in-house data stores may not replicate using XDM, but may still want a robust
metadata search capability to locate files or file versions rapidly.

XDM manages the complexities and discontinuities between the native Amazon S3
cloud storage protocol and other popular cloud protocols, such as Google Cloud
and Microsoft Azure storage, and manages a unified namespace to retrieve data
seamlessly from all managed cloud locations.

To do this, XDM maintains its own namespace, which it uses to manage and track
objects in other namespaces. For example, a cloud might spread a bucket's
contents over many servers. XDM trusts this cloud to work as designed and 
provide the bucket, or individual objects in the bucket, on demand. XDM knows
what the source cloud calls the data, and if it should replicate it to a target
cloud, it again relies on the target cloud to maintain the data fed to it: XDM
only deals with cloud storage systems with the APIs they provide. In effect,
XDM operates by maintaining a namespace of namespaces.

To perform this task efficiently, XDM relies heavily on the metadata generated
by object data storage systems. Rather than managing every byte under its
control, XDM closely watches or extrapolates cloud or file system metadata and
makes decisions and offers features based on metadata status changes. This
enables XDM to replicate data, offer bucket lifecycle management (expiration
and transition), and provide other tools to manage unstructured data easily,
quickly, and in a truly multi-cloud environment.
