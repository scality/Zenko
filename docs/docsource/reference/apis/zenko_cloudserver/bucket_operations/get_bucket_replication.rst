.. _GET Bucket Replication:

GET Bucket Replication
======================

Returns the replication configuration information set on the bucket.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /?replication HTTP/1.1
   Host: bucketname.s3.amazonaws.com
   Date: date
   Authorization: authorization string (see Authenticating Requests (AWS Signature Version 4))
           
Parameters
~~~~~~~~~~

The GET Bucket operation does not use request parameters.

Headers
~~~~~~~

This operation uses only request headers that are
common to all operations.

Elements
~~~~~~~~

This operation does not use request elements.

Responses
---------

Headers
~~~~~~~

This operation uses only response headers that are common to most responses.

Elements
~~~~~~~~

This implementation of GET returns the following response elements.

.. tabularcolumns:: X{0.45\textwidth}X{0.50\textwidth}
.. table::
   :class: longtable

   +------------------------------+--------------------------------------------+
   | Name                         | Description                                |
   +==============================+============================================+
   | ``ReplicationConfiguration`` | Container for replication rules. Up to     |
   |                              | 1,000 rules can be added. Total            |
   |                              | replication configuration size can be up   |
   |                              | to 2 MB.                                   |
   |                              |                                            |
   |                              | **Type:** Container                        |
   |                              |                                            |
   |                              | **Children:** Rule                         |
   |                              |                                            |
   |                              | **Ancestor:** None                         |
   +------------------------------+--------------------------------------------+
   | ``Role``                     | Amazon Resource Name (ARN) of an IAM role  |
   |                              | for Amazon S3 to assume when replicating   |
   |                              | the objects.                               |
   |                              |                                            |
   |                              | **Type:** String                           |
   |                              |                                            |
   |                              | **Ancestor:** Rule                         |
   +------------------------------+--------------------------------------------+
   | ``Rule``                     | Container for information about a          |
   |                              | particular replication rule. Replication   |
   |                              | configuration must have at least one rule  |
   |                              | and can contain up to 1,000 rules.         |
   |                              |                                            |
   |                              | **Type:** Container                        |
   |                              |                                            |
   |                              | **Ancestor:** ReplicationConfiguration     |
   +------------------------------+--------------------------------------------+
   | ``ID``                       | Unique identifier for the rule. The        |
   |                              | value's length cannot exceed 255           |
   |                              | characters.                                |
   |                              |                                            |
   |                              | **Type:** String                           |
   |                              |                                            |
   |                              | **Ancestor:** Rule                         |
   +------------------------------+--------------------------------------------+
   | ``Status``                   | The rule is ignored if status is not       |
   |                              | Enabled.                                   |
   |                              |                                            |
   |                              | **Type:** String                           |
   |                              |                                            |
   |                              | **Ancestor:** Rule                         |
   |                              |                                            |
   |                              | **Valid Values:** Enabled, Disabled        |
   +------------------------------+--------------------------------------------+
   | ``Prefix``                   | Object keyname prefix identifying one or   |
   |                              | more objects to which the rule applies.    |
   |                              | Maximum prefix length is 1,024 characters. |
   |                              | Overlapping prefixes are not supported.    |
   |                              |                                            |
   |                              | **Type:** String                           |
   |                              |                                            |
   |                              | **Ancestor:** Rule                         |
   +------------------------------+--------------------------------------------+
   | ``Destination``              | Container for destination information.     |
   |                              |                                            |
   |                              | **Type:** Container                        |
   |                              |                                            |
   |                              | **Ancestor:** Rule                         |
   +------------------------------+--------------------------------------------+
   | ``Bucket``                   | Amazon resource name (ARN) of the bucket   |
   |                              | in which Amazon S3 is to store replicas of |
   |                              | the object identified by the rule.         |
   |                              |                                            |
   |                              | If there are multiple rules in the         |
   |                              | replication configuration, all these rules |
   |                              | must specify the same bucket as the        |
   |                              | destination. That is, replication          |
   |                              | configuration can replicate objects only   |
   |                              | to one destination bucket.                 |
   |                              |                                            |
   |                              | **Type:** String                           |
   |                              |                                            |
   |                              | **Ancestor:** Destination                  |
   +------------------------------+--------------------------------------------+
   | ``StorageClass``             | Optional destination storage class         |
   |                              | override to use when replicating objects.  |
   |                              | If this element is not specified, Zenko    |
   |			          | uses the source object's storage class to  |
   |   			          | create an object replica.                  |
   |                              |                                            |
   |			          | Zenko reinterprets this S3 call not as a   |
   |                              | service quality directive, but as a service|
   |                              | locator. In other words, where Amazon S3   |
   |                              | uses this directive to define a location   |
   |                              | by quality of service (e.g., STANDARD or   |
   |                              | GLACIER), Zenko uses it to direct          |
   |                              | replication to a location. The quality of  |
   |			          | service is determined and the replication  |
   |                              | destination is configured by the user.     |
   |                              |                                            |
   |                              | **Type:** String                           |
   |                              |                                            |
   |                              | **Ancestor:** Destination                  |
   |                              |                                            |
   |                              | **Default:** Storage class of the source   |
   |                              | object                                     |
   |                              |                                            |
   |                              | **Valid Values:** Any defined Zenko        |
   |                              | location                                   |
   +------------------------------+--------------------------------------------+

Special Errors
~~~~~~~~~~~~~~

.. tabularcolumns:: X{0.40\textwidth}X{0.19\textwidth}X{0.19\textwidth}X{0.19\textwidth}
.. table::

   +------------------------------------+-----------------+-------------------+-----------------+
   | Name                               | Description     | HTTP Status       | SOAP Fault      |
   |                                    |                 | Code              | Code Prefix     |
   +====================================+=================+===================+=================+
   | ``NoSuchReplicationConfiguration`` | The replication | ``404 Not Found`` | Client          |
   |                                    | configuration   |                   |                 |
   |                                    | does not exist. |                   |                 |
   +------------------------------------+-----------------+-------------------+-----------------+

Examples
--------

Retrieve Replication Configuration Information
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

The following example GET request retrieves replication configuration
information set for the examplebucket bucket.

.. code::

   GET /?replication HTTP/1.1
   Host: examplebucket.s3.amazonaws.com
   x-amz-date: Tue, 10 Feb 2015 00:17:21 GMT
   Authorization: signatureValue

Response
````````

The following sample response shows that replication is enabled on the
bucket, and the empty prefix indicates that Zenko will replicate all
objects created in the examplebucket bucket. The Destination element
shows the target bucket where Zenko creates the object replicas and the
storage class (AzureCloud) that Zenko uses when creating replicas.

Zenko assumes the specified role to replicate objects on behalf of the
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
         <StorageClass>AzureCloud</StorageClass>
       </Destination>
     </Rule>
     <Role>arn:aws:iam::35667example:role/CrossRegionReplicationRoleForS3</Role>
   </ReplicationConfiguration>
