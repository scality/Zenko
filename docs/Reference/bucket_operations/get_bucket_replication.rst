.. _GET Bucket Replication:

GET Bucket Replication
======================

Returns the replication configuration information set on the bucket. .

Requests
--------

**Request Syntax**

.. code::

   GET /?replication HTTP/1.1
   Host: bucketname.s3.amazonaws.com
   Date: date
   Authorization: authorization string (see Authenticating Requests (AWS Signature Version
           4))

**Request Parameters**

The PUT Bucket operation does not use Request Parameters.

**Request Headers**

This implementation of the operation uses only request headers that are
common to all operations.

Request Elements
~~~~~~~~~~~~~~~~

This implementation of the operation does not use request elements.

**Response Headers**

This implementation of the operation uses only response headers that are
common to most responses.

**Response Elements**

This implementation of GET returns the following response elements.

+-----------------------------------+-----------------------------------+
| Name                              | Description                       |
+===================================+===================================+
| ReplicationConfiguration          | Container for replication rules.  |
|                                   | Up to 1,000 rules can be added.   |
|                                   | Total replication configuration   |
|                                   | size can be up to 2 MB.           |
|                                   |                                   |
|                                   | Type: Container                   |
|                                   |                                   |
|                                   | Children: Rule                    |
|                                   |                                   |
|                                   | Ancestor: None                    |
+-----------------------------------+-----------------------------------+
| Role                              | Amazon Resource Name (ARN) of an  |
|                                   | IAM role for Amazon S3 to assume  |
|                                   | when replicating the objects.     |
|                                   |                                   |
|                                   | Type: String                      |
|                                   |                                   |
|                                   | Ancestor: Rule                    |
+-----------------------------------+-----------------------------------+
| Rule                              | Container for information about a |
|                                   | particular replication rule.      |
|                                   | Replication configuration must    |
|                                   | have at least one rule and can    |
|                                   | contain up to 1,000 rules.        |
|                                   |                                   |
|                                   | Type: Container                   |
|                                   |                                   |
|                                   | Ancestor:                         |
|                                   | ReplicationConfiguration          |
+-----------------------------------+-----------------------------------+
| ID                                | Unique identifier for the rule.   |
|                                   | The value cannot be longer than   |
|                                   | 255 characters.                   |
|                                   |                                   |
|                                   | Type: String                      |
|                                   |                                   |
|                                   | Ancestor: Rule                    |
+-----------------------------------+-----------------------------------+
| Status                            | The rule is ignored if status is  |
|                                   | not Enabled.                      |
|                                   |                                   |
|                                   | Type: String                      |
|                                   |                                   |
|                                   | Ancestor: Rule                    |
|                                   |                                   |
|                                   | Valid values: Enabled, Disabled.  |
+-----------------------------------+-----------------------------------+
| Prefix                            | Object keyname prefix identifying |
|                                   | one or more objects to which the  |
|                                   | rule applies. Maximum prefix      |
|                                   | length can be up to 1,024         |
|                                   | characters. Overlapping prefixes  |
|                                   | are not supported.                |
|                                   |                                   |
|                                   | Type: String                      |
|                                   |                                   |
|                                   | Ancestor: Rule                    |
+-----------------------------------+-----------------------------------+
| Destination                       | Container for destination         |
|                                   | information.                      |
|                                   |                                   |
|                                   | Type: Container                   |
|                                   |                                   |
|                                   | Ancestor: Rule                    |
+-----------------------------------+-----------------------------------+
| Bucket                            | Amazon resource name (ARN) of the |
|                                   | bucket where in which Amazon S3   |
|                                   | is to store replicas of the       |
|                                   | object identified by the rule.    |
|                                   |                                   |
|                                   | If there are multiple rules in    |
|                                   | the replication configuration,    |
|                                   | note that all these rules must    |
|                                   | specify the same bucket as the    |
|                                   | destination. That is, replication |
|                                   | configuration can replicate       |
|                                   | objects only to one destination   |
|                                   | bucket.                           |
|                                   |                                   |
|                                   | Type: String                      |
|                                   |                                   |
|                                   | Ancestor: Destination             |
+-----------------------------------+-----------------------------------+
| StorageClass                      | Optional destination storage      |
|                                   | class override to use when        |
|                                   | replicating objects. If not       |
|                                   | specified, Amazon S3 uses the     |
|                                   | storage class of the source       |
|                                   | object to create object replica.  |
|                                   | Type: String                      |
|                                   |                                   |
|                                   | Ancestor: Destination             |
|                                   |                                   |
|                                   |                                   |
|                                   |                                   |
|                                   | Default: Storage class of the     |
|                                   | source object.                    |
|                                   |                                   |
|                                   | Valid Values: STANDARD \|         |
|                                   | STANDARD_IA \| REDUCED_REDUNDANCY |
|                                   |                                   |
|                                   | GLACIER cannot be specified as    |
|                                   | the storage class, though objects |
|                                   | can be transitioned to the        |
|                                   | GLACIER storage class using       |
|                                   | lifecycle configuration (refer to |
|                                   | `Object Lifecycle                 |
|                                   | Management <http://docs.aws.amazo |
|                                   | n.com/AmazonS3/latest/dev/object- |
|                                   | lifecycle-mgmt.html>`__           |
|                                   | in the Amazon Simple Storage      |
|                                   | Service (S3) documentation).      |
+-----------------------------------+-----------------------------------+

**Special Errors**

+-----------------+-----------------+-----------------+-----------------+
| Name            | Description     | HTTP Status     | SOAP Fault Code |
|                 |                 | Code            | Prefix          |
+=================+=================+=================+=================+
| NoSuchReplicati | The replication | 404 Not Found   | Client          |
| onConfiguration | configuration   |                 |                 |
|                 | does not exist. |                 |                 |
+-----------------+-----------------+-----------------+-----------------+

**Retrieve Replication Configuration Information**

*Request Sample*

The following example GET request retrieves replication configuration
information set for the examplebucket bucket.

.. code::

   GET /?replication HTTP/1.1
   Host: examplebucket.s3.amazonaws.com
   x-amz-date: Tue, 10 Feb 2015 00:17:21 GMT
   Authorization: signatureValue

The following sample response shows that replication is enabled on the
bucket, and the empty prefix indicates that S3 will replicate all
objects created in the examplebucket bucket. The Destination element
shows the target bucket where S3 creates the object replicas and the
storage class (STANDARD_IA) that S3 will use when creating replicas.

S3 will assume the specified role to replicate objects on behalf of the
bucket owner.

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: ITnGT1y4RyTmXa3rPi4hklTXouTf0hccUjo0iCPjz6FnfIutBj3M7fPGlWO2SEWp
   x-amz-request-id: 51991C342example
   Date: Tue, 10 Feb 2015 00:17:23 GMT
   Server: AmazonS3
   Content-Length: contentlength

   <?xml version="1.0" encoding="UTF-8"?>
   <ReplicationConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
     <Rule>
       <ID>rule1</ID>
       <Status>Enabled</Status>
       <Prefix></Prefix>
       <Destination>
         <Bucket>arn:aws:s3:::exampletargetbucket</Bucket>
         <StorageClass>STANDARD_IA</StorageClass>
       </Destination>
     </Rule>
     <Role>arn:aws:iam::35667example:role/CrossRegionReplicationRoleForS3</Role>
   </ReplicationConfiguration>
