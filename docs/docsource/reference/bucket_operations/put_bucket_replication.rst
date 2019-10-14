.. _PUT Bucket Replication:

PUT Bucket Replication
======================

In a versioning-enabled bucket, The PUT Bucket Replication operation
creates a new replication configuration, or replaces an existing one.

Requests
--------

Syntax
~~~~~~

.. code::

   PUT /?replication HTTP/1.1
   Host: bucketname.s3.amazonaws.com
   Content-Length: length
   Date: date
   Authorization: authorization string (see Authenticating Requests (AWS Signature Version 4))
   Content-MD5: MD5

   Replication configuration XML in the body

Parameters
~~~~~~~~~~

The PUT Bucket Replication operation does not use request parameters.

Headers
~~~~~~~

.. tabularcolumns:: X{0.15\textwidth}X{0.10\textwidth}X{0.55\textwidth}X{0.15\textwidth}
.. table::

   +-----------------+-----------+--------------------------------------------------+----------+
   | Name            | Type      | Description                                      | Required |
   +=================+===========+==================================================+==========+
   | ``Content-MD5`` | String    | The base64-encoded 128-bit MD5 digest of the     | Yes      |
   |                 |           | data; must be used as a message integrity check  |          |
   |                 |           | to verify that the request body was not          |          |
   |                 |           | corrupted in transit. For more information, see  |          |
   |                 |           | RFC 1864.                                        |          |
   |                 |           |                                                  |          |
   |                 |           | **Default:** None                                |          |
   +-----------------+-----------+--------------------------------------------------+----------+

Request Body
~~~~~~~~~~~~

The replication configuration can be specified in the request body. The
configuration includes one or more rules, with each providing
information (e.g., key name prefix identifying objects with specific
prefixes) to replicate (an empty prefix indicates all objects), rule
status, and details about the destination.

The destination details include the bucket in which to store replicas
and optional storage classes to use to store the replicas.

Zenko only acts on rules with an Enabled status. Zenko does not support IAM 
roles; instead, Zenko pre-creates service accounts, one for each service
(Replication, Lifecycle, Ingestion, Garbage Collection, Metadata Search).
Each service uses keys generated for its own account to execute an operation.

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

The following table describes the XML elements in the replication configuration:

.. tabularcolumns:: X{0.30\textwidth}X{0.10\textwidth}X{0.45\textwidth}X{0.10\textwidth}
.. table::
   :class: longtable

   +------------------------------+-----------+-------------------------------------------------+----------+
   | Name                         | Type      | Description                                     | Required |
   +==============================+===========+=================================================+==========+
   | ``ReplicationConfiguration`` | Container | Container for replication rules. Up to 1,000    | Yes      |
   |                              |           | rules can be added. Total replication           |          |
   |                              |           | configuration size can be up to 2 MB.           |          |
   |                              |           |                                                 |          |
   |                              |           | **Children:** Rule                              |          |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** None                              |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``Role``                     | String    | Amazon Resource Name (ARN) of an IAM role for   | Yes      |
   |                              |           | Zenko to assume when replicating the objects.   |          |
   |                              |           |                                                 |          |
   |                              |           | **Type:** String                                |          |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** Rule                              |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``Rule``                     | Container | Container for information about a particular    | Yes      |
   |                              |           | replication rule. Replication configuration     |          |
   |                              |           | must have at least one rule and can contain     |          |
   |                              |           | up to 1,000 rules.                              |          |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** ReplicationConfiguration          |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``ID``                       | String    | Unique identifier for the rule. The value       | No       |
   |                              |           | cannot be longer than 255 characters.           |          |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** Rule                              |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``Status``                   | String    | The rule is ignored if status is not Enabled.   | Yes      |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** Rule                              |          |
   |                              |           |                                                 |          |
   |                              |           | **Valid Values:** Enabled, Disabled             |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``Prefix``                   | String    | Object keyname prefix identifying one or more   | Yes      |
   |                              |           | more objects to which the rule applies.         |          |
   |                              |           |                                                 |          |
   |                              |           | Maximum prefix length can be up to 1,024        |          |
   |                              |           | characters. Overlapping prefixes are not        |          |
   |                              |           | supported.                                      |          |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** Rule                              |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``Destination``              | Container | Container for destination information.          | Yes      |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** Rule                              |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``Bucket``                   | String    | Amazon resource name (ARN) of the bucket where  | Yes      |
   |                              |           | Zenko is to store replicas of the object        |          |
   |                              |           | identified by the rule.                         |          |
   |                              |           |                                                 |          |
   |                              |           | If there are multiple rules in the replication  |          |
   |                              |           | configuration, all these rules must specify     |          |
   |                              |           | the same bucket as the destination. That is,    |          |
   |                              |           | replication configuration can replicate         |          |
   |                              |           | objects only to one destination bucket.         |          |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** Destination                       |          |
   +------------------------------+-----------+-------------------------------------------------+----------+
   | ``StorageClass``             | String    | Optional destination storage class override to  | No       |
   |                              |           | use when replicating objects. If this element   |          | 
   |                              |           | is not specified, Zenko uses the storage        |          |
   |                              |           | class of the source object to create object     |          |
   |                              |           | replica.                                        |          |
   |		                  |           |                                                 |          |
   |                              |           | Zenko reinterprets this S3 call not as a        |          |
   |                              |           | service quality directive, but as a service     |          |
   |                              |           | locator. In other words, where Amazon S3 uses   |          |
   |                              |           | this directive to define a location by quality  |	   |
   |                              |           | of service (e.g., STANDARD or GLACIER), Zenko   |          |
   |                              |           | uses it to direct replication to a location.    |          |
   |                              |           | The quality of service is determined and the    |          |
   |                              |           | replication destination is configured by the    |          |
   |                              |           | user.                                           |          |
   |                              |           |                                                 |          |
   |                              |           | **Ancestor:** Destination                       |          |
   |                              |           |                                                 |          |
   |                              |           | **Default:** Storage class of the source        |          |
   |                              |           | object                                          |          |
   |                              |           |                                                 |          |
   |                              |           | **Valid Values:** Any defined destination name  |          |
   +------------------------------+-----------+-------------------------------------------------+----------+

Response
--------

Headers
~~~~~~~

This operation uses only response headers that are common to most responses.

Elements
~~~~~~~~

This operation does not return response elements.

Special Errors
~~~~~~~~~~~~~~

This operation does not return special errors.

Examples
--------

Add Replication Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

The following is a sample PUT request that creates a replication subresource on
the specified bucket and saves the replication configuration in it. The
replication configuration specifies a rule to replicate to the
{{exampleTargetBucket}} bucket any new objects created with the key name prefix
“TaxDocs”.

After adding a replication configuration to a bucket, S3 assumes the IAM role
specified in the configuration in order to replicate objects on behalf of the
bucket owner, which is the AWS account that created the bucket.

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

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: r+qR7+nhXtJDDIJ0JJYcd+1j5nM/rUFiiiZ/fNbDOsd3JUE8NWMLNHXmvPfwMpdc
   x-amz-request-id: 9E26D08072A8EF9E
   Date: Wed, 11 Feb 2015 02:11:22 GMT
   Content-Length: 0
   Server: <serverName>
