.. _get-bucket-replication:

get-bucket-replication
======================

Returns the replication configuration of a bucket.

.. note::

  It can take a while to propagate the put or delete a replication configuration
  to all S3 Connector systems. Therefore, a get request soon after put or delete
  can return a wrong result.

See also: :ref:`GET Bucket Replication`.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Synopsis
--------

::

  get-bucket-replication
    --bucket <value>
    [--cli-input-json <value>]

Options
-------

``--bucket`` (string)

``--cli-input-json`` (string)

  Performs service operation based on the JSON string provided. If other
  arguments are provided on the command line, the CLI values will override the
  JSON-provided values. It is not possible to pass arbitrary binary values using
  a JSON-provided value as the string will be taken literally.

See `aws help <https://docs.aws.amazon.com/cli/latest/reference/index.html>`_
for descriptions of global parameters.

Examples
--------

The following command retrieves the replication configuration for a bucket named
``my-bucket``::

  aws s3api get-bucket-replication --bucket my-bucket

Output::

  {
    "ReplicationConfiguration": {
        "Rules": [
            {
              "Status": "Enabled",
              "Prefix": "",
              "Destination": {
                "Bucket": "arn:aws:s3:::my-bucket-backup",
                "StorageClass": "STANDARD"
                },
              "ID": "ZmUwNzE4ZmQ4tMjVhOS00MTlkLOGI4NDkzZTIWJjNTUtYTA1"
            }
        ],
      "Role": "arn:aws:iam::123456789012:role/s3-replication-role"
    }
  }

Output
------

ReplicationConfiguration -> (structure)

  Role -> (string)
  
  The Amazon Resource Name (ARN) of the AWS Identity and Access Management (IAM)
  role that S3 Connector assumes when replicating objects. For more information,
  see `How to Set Up Cross-Region Replication
  <https://docs.aws.amazon.com/AmazonS3/latest/dev/crr-how-setup.html>`__ in the
  *Amazon Simple Storage Service Developer Guide* .

  Rules -> (list)

  A container for one or more replication rules. A replication configuration
  must have at least one rule and can contain a maximum of 1,000 rules.

  (structure)
    
    Specifies which S3 objects to replicate and where to store the replicas.

    ID -> (string)

    A unique identifier for the rule. The maximum value is 255 characters.

    Priority -> (integer)

    The priority associated with the rule. If you specify multiple rules in a
    replication configuration, S3 Connector prioritizes the rules to prevent
    conflicts when filtering. If two or more rules identify the same object
    based on a specified filter, the rule with higher priority takes
    precedence. For example:
	
    * Same object quality prefix based filter criteria If prefixes you specified
      in multiple rules overlap
         
    * Same object qualify tag based filter criteria specified in multiple rules

    For more information, see `Cross-Region Replication (CRR)
    <https://docs.aws.amazon.com/AmazonS3/latest/dev/crr.html>`__ in the *Amazon
    S3 Developer Guide*.

    Prefix -> (string)
      
    An object keyname prefix that identifies the object or objects to which the
    rule applies. The maximum prefix length is 1,024 characters. To include all
    objects in a bucket, specify an empty string.

    Filter -> (structure)

      Prefix -> (string)

      An object keyname prefix that identifies the subset of objects to which the rule applies.

      Tag -> (structure)

      A container for specifying a tag key and value. 

      The rule applies only to objects that have the tag in their tag set.

        Key -> (string)

        Name of the tag.

        Value -> (string)

        Value of the tag.

    And -> (structure)

    A container for specifying rule filters. The filters determine the subset of
    objects to which the rule applies. This element is required only if you
    specify more than one filter. For example:
           
    * If you specify both a ``Prefix`` and a ``Tag`` filter, wrap these filters in an ``And`` tag. 
           
    * If you specify a filter based on multiple tags, wrap the ``Tag`` elements in an ``And`` tag. 

    Prefix -> (string)

    Tags -> (list)

    (structure)

      Key -> (string)
	      
      Name of the tag.

      Value -> (string)
	      
      Value of the tag.

    Status -> (string)
      
    Specifies whether the rule is enabled.

    SourceSelectionCriteria -> (structure)
      
    A container that describes additional filters for identifying the source
    objects that you want to replicate. You can choose to enable or disable the
    replication of these objects. Currently, S3 Connector supports only the filter
    that you can specify for objects created with server-side encryption using
    an AWS KMS-Managed Key (SSE-KMS).

    SseKmsEncryptedObjects -> (structure)

    A container for filter information for the selection of S3 objects encrypted
    with AWS KMS. If you include ``SourceSelectionCriteria`` in the replication
    configuration, this element is required.

      Status -> (string)

      Specifies whether S3 Connector replicates objects created with server-side
      encryption using an AWS KMS-managed key.

    Destination -> (structure)
      
    A container for information about the replication destination.

      Bucket -> (string)

      The Amazon Resource Name (ARN) of the bucket where you want S3 Connector to
      store replicas of the object identified by the rule.

      A replication configuration can replicate objects to only one destination
      bucket. If there are multiple rules in your replication configuration, all
      rules must specify the same destination bucket.

    Account -> (string)

    Destination bucket owner account ID. In a cross-account scenario, if you
    direct S3 Connector to change replica ownership to the AWS account that owns
    the destination bucket by specifying the ``AccessControlTranslation``
    property, this is the account ID of the destination bucket owner. For more
    information, see `Cross-Region Replication Additional Configuration\: Change
    Replica Owner
    <https://docs.aws.amazon.com/AmazonS3/latest/dev/crr-change-owner.html>`__
    in the *Amazon Simple Storage Service Developer Guide*.

    StorageClass -> (string)

    The storage class to use when replicating objects, such as standard or
    reduced redundancy. By default, S3 Connector uses the storage class of the
    source object to create the object replica.

    For valid values, see the ``StorageClass`` element of the `PUT Bucket
    replication
    <https://docs.aws.amazon.com/AmazonS3/latest/API/RESTBucketPUTreplication.html>`__
    action in the *Amazon Simple Storage Service API Reference* .
	  
    AccessControlTranslation -> (structure)

    Specify this only in a cross-account scenario (where source and destination
    bucket owners are not the same), and you want to change replica ownership to
    the AWS account that owns the destination bucket. If this is not specified
    in the replication configuration, the replicas are owned by same AWS account
    that owns the source object.

      Owner -> (string)

      Specifies the replica ownership. For default and valid values, see `PUT
      bucket replication
      <https://docs.aws.amazon.com/AmazonS3/latest/API/RESTBucketPUTreplication.html>`__
      in the *Amazon Simple Storage Service API Reference*.

    EncryptionConfiguration -> (structure)

    A container that provides information about encryption. If
    ``SourceSelectionCriteria`` is specified, you must specify this element.

      ReplicaKmsKeyID -> (string)

      Specifies the AWS KMS Key ID (Key ARN or Alias ARN) for the destination
      bucket. S3 Connector uses this key to encrypt replica objects.

      DeleteMarkerReplication -> (structure)

        Status -> (string)
	
        The status of the delete marker replication.

        .. note::

           In the current implementation, S3 doesn't replicate the delete
           markers. The status must be ``Disabled``.
