.. _PUT Bucket Replication:

PUT Bucket Replication
======================

In a versioning-enabled bucket, The PUT Bucket Replication operation
creates a new replication configuration, or replaces an existing one.

Requests
--------

**Request Syntax**

.. code::

   PUT /?replication HTTP/1.1
   Host: bucketname.s3.amazonaws.com
   Content-Length: length
   Date: date
   Authorization: authorization string (see Authenticating Requests (AWS Signature Version
           4))
   Content-MD5: MD5

   Replication configuration XML in the body

**Request Parameters**

The PUT Bucket Replication operation does not use Request Parameters.

**Request Headers**

+-----------------------+-----------------------+-----------------------+
| Name                  | Type                  | Required              |
+=======================+=======================+=======================+
| Content-MD5           | The base64-encoded    | Yes                   |
|                       | 128-bit MD5 digest of |                       |
|                       | the data; must be     |                       |
|                       | used as a message     |                       |
|                       | integrity check to    |                       |
|                       | verify that the       |                       |
|                       | request body was not  |                       |
|                       | corrupted in transit. |                       |
|                       | For more information, |                       |
|                       | go to RFC 1864.       |                       |
|                       |                       |                       |
|                       | Type: String          |                       |
|                       |                       |                       |
|                       | Default: None         |                       |
+-----------------------+-----------------------+-----------------------+

Request Body
~~~~~~~~~~~~

The replication configuration can be specified in the request body. The
configuration includes one or more rules, with each providing
information (e.g., key name prefix identifying objects with specific
prefixes) to replicate (an empty prefix indicates all objects), rule
status, and details about the destination.

The destination details include the bucket in which to store replicas
and optional storage classes to use to store the replicas.

S3 acts only on rules with the status Enabled. The configuration also
identifies an IAM role for S3 to assume for copying objects. This role
must have sufficient permissions to read objects from the source bucket
and replicate these objects into the target bucket.

.. code::

   <ReplicationConfiguration>
       <Role>IAM-role-ARN</Role>
       <Rule>
           <ID>Rule-1</ID>
           <Status>rule-status</Status>
           <Prefix>key-prefix</Prefix>
           <Destination>        
              <Bucket>arn:aws:s3:::bucket-name</Bucket>
              <StorageClass>optional-destination-storage-class-override</StorageClass>          
           </Destination>
       </Rule>
       <Rule>
           <ID>Rule-2</ID>
            ...
       </Rule>
        ...
   </ReplicationConfiguration>

The following table describes the XML elements in the replication
configuration:

+-----------------------+-----------------------+-----------------------+
| Name                  | Type                  | Required              |
+=======================+=======================+=======================+
| ReplicationConfigurat | Container for         | Yes                   |
| ion                   | replication rules. Up |                       |
|                       | to 1,000 rules can be |                       |
|                       | added. Total          |                       |
|                       | replication           |                       |
|                       | configuration size    |                       |
|                       | can be up to 2 MB.    |                       |
|                       |                       |                       |
|                       | Type: Container       |                       |
|                       |                       |                       |
|                       | Children: Rule        |                       |
|                       |                       |                       |
|                       | Ancestor: None        |                       |
+-----------------------+-----------------------+-----------------------+
| Role                  | Amazon Resource Name  | Yes                   |
|                       | (ARN) of an IAM role  |                       |
|                       | for Amazon S3 to      |                       |
|                       | assume when           |                       |
|                       | replicating the       |                       |
|                       | objects.              |                       |
|                       |                       |                       |
|                       | Type: String          |                       |
|                       |                       |                       |
|                       | Ancestor: Rule        |                       |
+-----------------------+-----------------------+-----------------------+
| Rule                  | Container for         | Yes                   |
|                       | information about a   |                       |
|                       | particular            |                       |
|                       | replication rule.     |                       |
|                       | Replication           |                       |
|                       | configuration must    |                       |
|                       | have at least one     |                       |
|                       | rule and can contain  |                       |
|                       | up to 1,000 rules.    |                       |
|                       |                       |                       |
|                       | Type: Container       |                       |
|                       |                       |                       |
|                       | Ancestor:             |                       |
|                       | ReplicationConfigurat |                       |
|                       | ion                   |                       |
+-----------------------+-----------------------+-----------------------+
| ID                    | Unique identifier for | No                    |
|                       | the rule. The value   |                       |
|                       | cannot be longer than |                       |
|                       | 255 characters.       |                       |
|                       |                       |                       |
|                       | Type: String          |                       |
|                       |                       |                       |
|                       | Ancestor: Rule        |                       |
+-----------------------+-----------------------+-----------------------+
| Status                | The rule is ignored   | Yes                   |
|                       | if status is not      |                       |
|                       | Enabled.              |                       |
|                       |                       |                       |
|                       | Type: String          |                       |
|                       |                       |                       |
|                       | Ancestor: Rule        |                       |
|                       |                       |                       |
|                       | Valid values:         |                       |
|                       | Enabled, Disabled.    |                       |
+-----------------------+-----------------------+-----------------------+
| Prefix                | Object keyname prefix | Yes                   |
|                       | identifying one or    |                       |
|                       | more objects to which |                       |
|                       | the rule applies.     |                       |
|                       | Maximum prefix length |                       |
|                       | can be up to 1,024    |                       |
|                       | characters.           |                       |
|                       | Overlapping prefixes  |                       |
|                       | are not supported.    |                       |
|                       |                       |                       |
|                       | Type: String          |                       |
|                       |                       |                       |
|                       | Ancestor: Rule        |                       |
+-----------------------+-----------------------+-----------------------+
| Destination           | Container for         | Yes                   |
|                       | destination           |                       |
|                       | information.          |                       |
|                       |                       |                       |
|                       | Type: Container       |                       |
|                       |                       |                       |
|                       | Ancestor: Rule        |                       |
+-----------------------+-----------------------+-----------------------+
| Bucket                | Amazon resource name  | Yes                   |
|                       | (ARN) of the bucket   |                       |
|                       | where Amazon S3 is to |                       |
|                       | store replicas of the |                       |
|                       | object identified by  |                       |
|                       | the rule.             |                       |
|                       |                       |                       |
|                       | If there are multiple |                       |
|                       | rules in the          |                       |
|                       | replication           |                       |
|                       | configuration, note   |                       |
|                       | that all these rules  |                       |
|                       | must specify the same |                       |
|                       | bucket as the         |                       |
|                       | destination. That is, |                       |
|                       | replication           |                       |
|                       | configuration can     |                       |
|                       | replicate objects     |                       |
|                       | only to one           |                       |
|                       | destination bucket.   |                       |
|                       |                       |                       |
|                       | Type: String          |                       |
|                       |                       |                       |
|                       | Ancestor: Destination |                       |
+-----------------------+-----------------------+-----------------------+
| StorageClass          | Optional destination  | N                     |
|                       | storage class         |                       |
|                       | override to use when  |                       |
|                       | replicating objects.  |                       |
|                       | If not specified,     |                       |
|                       | Amazon S3 uses the    |                       |
|                       | storage class of the  |                       |
|                       | source object to      |                       |
|                       | create object         |                       |
|                       | replica.              |                       |
|                       | Type: String          |                       |
|                       |                       |                       |
|                       | Ancestor: Destination |                       |
|                       |                       |                       |
|                       | Default: Storage      |                       |
|                       | class of the source   |                       |
|                       | object.               |                       |
|                       |                       |                       |
|                       | Valid Values:         |                       |
|                       | STANDARD \|           |                       |
|                       | STANDARD_IA \|        |                       |
|                       | REDUCED_REDUNDANCY    |                       |
|                       |                       |                       |
|                       | Constraints: GLACIER  |                       |
|                       | cannot be specified   |                       |
|                       | as the storage class, |                       |
|                       | though objects can be |                       |
|                       | transitioned to the   |                       |
|                       | GLACIER storage class |                       |
|                       | using lifecycle       |                       |
|                       | configuration (refer  |                       |
|                       | to `Object Lifecycle  |                       |
|                       | Management <http://do |                       |
|                       | cs.aws.amazon.com/Ama |                       |
|                       | zonS3/latest/dev/obje |                       |
|                       | ct-lifecycle-mgmt.htm |                       |
|                       | l>`__                 |                       |
|                       | in the Amazon Simple  |                       |
|                       | Storage Service (S3)  |                       |
|                       | documentation).       |                       |
+-----------------------+-----------------------+-----------------------+

**Response Headers**

This implementation of the operation uses only response headers that are
common to most responses.

**Response Elements**

This implementation of the operation does not return response elements.

**Special Errors**

This implementation of the operation does not return special errors.

**Add Replication Configuration**

*Request Sample*

The following is a sample PUT request that creates a replication
subresource on the specified bucket and saves the replication
configuration in it. The replication configuration specifies a rule to
replicate to the {{exampleTargetBucket}} bucket any new objects created
with the key name prefix “TaxDocs”.

After adding a replication configuration to a bucket, S3 assumes the IAM
role specified in the configuration in order to replicate objects on
behalf of the bucket owner, which is the AWS account that created the
bucket.

.. code::

   PUT /?replication HTTP/1.1
   Host: examplebucket.s3.amazonaws.com
   x-amz-date: Wed, 11 Feb 2015 02:11:21 GMT
   Content-MD5: q6yJDlIkcBaGGfb3QLY69A==
   Authorization: authorization string
   Content-Length: 406

   <ReplicationConfiguration>
     <Role>arn:aws:iam::35667example:role/CrossRegionReplicationRoleForS3</Role>
     <Rule>
       <ID>rule1</ID>
       <Prefix>TaxDocs</Prefix>
       <Status>Enabled</Status>
       <Destination>
         <Bucket>arn:aws:s3:::{{exampleTargetBucket}}</Bucket>
       </Destination>
     </Rule>
   </ReplicationConfiguration>

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: r+qR7+nhXtJDDIJ0JJYcd+1j5nM/rUFiiiZ/fNbDOsd3JUE8NWMLNHXmvPfwMpdc
   x-amz-request-id: 9E26D08072A8EF9E
   Date: Wed, 11 Feb 2015 02:11:22 GMT
   Content-Length: 0
   Server: AmazonS3
