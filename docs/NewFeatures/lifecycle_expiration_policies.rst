Lifecycle Expiration Policies
=============================

Cloud users can apply lifecycle expiration rules (specified in Amazon’s
`AWS S3 API <https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html>`__)
to buckets managed through Zenko. These rules are triggered after a defined
time has passed since the object’s creation. Zenko supports expiration of
versioned or non-versioned objects, when a defined number of days have
passed since those objects’ creation. This enables automatic deletion of
older versions of versioned objects to reclaim storage space.

Several Zenko components are used in lifecycle management. Most rely on Kafka
and ZooKeeper to pass state to each other.

Bucket lifecycle characteristics inhere to each bucket. Zenko’s lifecycle
management feature enforces, but does not set these characteristics. When
lifecycle expiration is enabled, the host cloud enforces buckets’ lifecycle
rules. If CRR operation is enabled, Zenko replicates the expiration rules to
all backup clouds.

To configure bucket lifecycle, follow the AWS S3 Lifecycle Configuration
Element syntax described in
`https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html
<https://docs.aws.amazon.com/AmazonS3/latest/dev/intro-lifecycle-rules.html>`__.

    **Note:** Lifecycle management rules conform to the S3 lifecycle management
    syntax for expiration policies described at
    https://docs.aws.amazon.com/AmazonS3/latest/dev/object-lifecycle-mgmt.html.
    *Lifecycle actions are currently constrained to expiration actions,
    and not transition actions.* Files that exceed a preconfigured
    temporal threshold (for example, 90 days) are “expired” and deleted
    from the bucket on which they are stored. At present, files
    exceeding a preset date *cannot be transitioned* to STANDARD\_IA or
    GLACIER storage classes.
