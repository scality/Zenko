Conceptual Framework
====================

Zenko is designed to help administrators of large storage systems
control, manage, replicate, and visualize data in a multi-cloud context.

Fundamental building blocks of Zenko’s replication framework are the
bucket, the location, and the cloud service. End users (people or
services) store data as files in buckets. Administrators are free to
configure and name buckets as they please—to the admin, buckets are
essentially tenants aggregated in a cloud storage deployment. From an
end user’s perspective, a bucket simply appears as a networked storage
location, for example, “accounting,” “bioinformatics-lab,”
“daily-video-backup,” or any other organizational unit that makes
sense.

Zenko fetches buckets from one location—a Scality RING private cloud,
for example—and replicates them to designated cloud storage locations on
other clouds. So, a company might store its data by departmental buckets
to local cloud, then replicate that cloud storage location to several
other public or private clouds for storage redundancy, rate-shopping, or
other purposes. Zenko manages the complexities and discontinuities
between the native Amazon S3 cloud storage protocol, and other popular
cloud protocols, such as Google Cloud and Microsoft Azure storage, and
manages a unified namespace to retrieve data seamlessly from all managed
cloud locations.

In addition to replication, Zenko provides bucket lifecycle management
(expiration and transition) and other tools to manage data easily in a
multi-cloud environment.