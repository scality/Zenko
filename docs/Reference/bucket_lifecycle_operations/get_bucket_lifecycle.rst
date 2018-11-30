.. _GET Bucket Lifecycle:

GET Bucket Lifecycle
====================

The GET Bucket Lifecycle operation returns the lifecycle configuration
information set on the bucket. This GET operation requires the
S3:GetLifecycleConfiguration permission.

Requests
--------

**Request Syntax**

.. code::

  GET /?lifecycle HTTP/1.1
  Host: {{BucketName}}.{{StorageService}}.com
  Date: {{date}}
  Authorization: {{authorizationString}}

**Request Parameters**

The GET Bucket Lifecycle operation does not use request parameters.

**Request Headers**

The GET Bucket Lifecycle operation uses only request headers that are
common to all operations (refer :ref:`Common Request Headers`).

**Request Elements**

The GET Bucket Lifecycle operation does not use request elements.

Responses
---------

**Response Headers**

Implementation of the GET Bucket Lifecycle operation uses only response
headers that are common to all operations (refer to :ref:`Common Response
Headers`).

**Response Elements**

The GET Bucket Lifecycle operation returns the following response
elements.

+-----------------------------------+-----------------------------------+
| Name                              | Description                       |
+===================================+===================================+
| And                               | Container for specifying Prefix   |
|                                   | and Tag based filters.            |
|                                   |                                   |
|                                   | **Child:** Prefix and Tag         |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Ancestor:** Filter              |
+-----------------------------------+-----------------------------------+
| AbortIncompleteMultipartUpload    | Container for specifying when an  |
|                                   | incomplete multipart upload       |
|                                   | becomes eligible for an abort     |
|                                   | operation.                        |
|                                   |                                   |
|                                   | **Child:** DaysAfterInitiation    |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
+-----------------------------------+-----------------------------------+
| Date                              | Date when you want the action to  |
|                                   | take place.                       |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Expiration or       |
|                                   | Transition                        |
+-----------------------------------+-----------------------------------+
| Days                              | Specifies the number of days      |
|                                   | after object creation when the    |
|                                   | specific rule action takes        |
|                                   | effect. The object’s eligibility  |
|                                   | time is calculated as creation    |
|                                   | time + the number of days.        |
|                                   |                                   |
|                                   | **Type:** Nonnegative Integer     |
|                                   | when used with Transition, or     |
|                                   | Positive Integer when used with   |
|                                   | Expiration.                       |
|                                   |                                   |
|                                   | **Ancestor:** Transition or       |
|                                   | Expiration                        |
+-----------------------------------+-----------------------------------+
| DaysAfterInitiation               | Specifies the number of days      |
|                                   | after initiating a multipart      |
|                                   | upload when the multipart upload  |
|                                   | must be completed. If it does not |
|                                   | complete by the specified number  |
|                                   | of days, the incomplete multipart |
|                                   | upload will be aborted.           |
|                                   |                                   |
|                                   | **Type:** Positive Integer        |
|                                   |                                   |
|                                   | **Ancestor:**                     |
|                                   | AbortIncompleteMultipartUpload    |
+-----------------------------------+-----------------------------------+
| Expiration                        | The expiration action occurs only |
|                                   | on objects that are eligible      |
|                                   | according to the period specified |
|                                   | in the child Date or Days         |
|                                   | element. The action depends on    |
|                                   | whether the bucket is versioning  |
|                                   | enabled (or suspended).           |
|                                   |                                   |
|                                   | If versioning has never been      |
|                                   | enabled on the bucket, the object |
|                                   | is permanently deleted.           |
|                                   |                                   |
|                                   | Otherwise, if the bucket is       |
|                                   | versioning-enabled or             |
|                                   | versioning-suspended, the action  |
|                                   | applies only to the current       |
|                                   | version of the object. Buckets    |
|                                   | with versioning-enabled or        |
|                                   | versioning-suspended can have     |
|                                   | many versions of the same object, |
|                                   | one current version, and zero or  |
|                                   | more noncurrent versions.         |
|                                   |                                   |
|                                   | Instead of deleting the current   |
|                                   | version, the current version      |
|                                   | becomes a noncurrent version and  |
|                                   | a delete marker is added as the   |
|                                   | new current version.              |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Children:** Days or Date        |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
+-----------------------------------+-----------------------------------+
| Filter                            | Container element describing one  |
|                                   | or more filters used to identify  |
|                                   | a subset of objects to which the  |
|                                   | lifecycle rule applies.           |
|                                   |                                   |
|                                   | **Child:** Prefix, Tag, or And    |
|                                   | (if both prefix and tag are       |
|                                   | specified)                        |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
+-----------------------------------+-----------------------------------+
| ID                                | Unique identifier for the rule.   |
|                                   | The value cannot be longer than   |
|                                   | 255 characters.                   |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
+-----------------------------------+-----------------------------------+
| Key                               | Tag key                           |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Tag                 |
+-----------------------------------+-----------------------------------+
| LifecycleConfiguration            | Container for lifecycle rules.    |
|                                   | You can add as many as 1000       |
|                                   | rules.                            |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Children:** Rule                |
|                                   |                                   |
|                                   | **Ancestor:** None                |
+-----------------------------------+-----------------------------------+
| ExpiredObjectDeleteMarker         | On a versioning-enabled or        |
|                                   | versioning-suspended bucket, any  |
|                                   | expired object delete markers     |
|                                   | will be deleted in the bucket.    |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Valid values:** true or false   |
|                                   |                                   |
|                                   | **Ancestor:** Expiration          |
+-----------------------------------+-----------------------------------+
| NoncurrentDays                    | Specifies the number of days an   |
|                                   | object is noncurrent before       |
|                                   | performing the associated action. |
|                                   |                                   |
|                                   | **Type:** Nonnegative Integer     |
|                                   | when used with                    |
|                                   | NoncurrentVersionTransition, or   |
|                                   | Positive Integer when used with   |
|                                   | NoncurrentVersionExpiration       |
|                                   |                                   |
|                                   | **Ancestor:**                     |
|                                   | NoncurrentVersionExpiration or    |
|                                   | NoncurrentVersionTransition       |
+-----------------------------------+-----------------------------------+
| NoncurrentVersionExpiration       | Specifies when noncurrent object  |
|                                   | versions expire. Upon expiration, |
|                                   | the applicable noncurrent object  |
|                                   | versions are permanently deleted. |
|                                   |                                   |
|                                   | You set this lifecycle            |
|                                   | configuration action on a bucket  |
|                                   | that has versioning enabled (or   |
|                                   | suspended).                       |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Children:** NoncurrentDays      |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
+-----------------------------------+-----------------------------------+
| NoncurrentVersionTransition       | Container for the transition rule |
|                                   | that describes when noncurrent    |
|                                   | objects transition to another     |
|                                   | storage class.                    |
|                                   |                                   |
|                                   | If your bucket is                 |
|                                   | versioning-enabled or             |
|                                   | versioning-suspended, you can set |
|                                   | this action to transition         |
|                                   | noncurrent object versions to     |
|                                   | another storage class at a        |
|                                   | specified period in the object’s  |
|                                   | lifetime.                         |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Children:** NoncurrentDays and  |
|                                   | StorageClass                      |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
+-----------------------------------+-----------------------------------+
| Prefix                            | Object key prefix identifying one |
|                                   | or more objects to which the rule |
|                                   | applies.                          |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Filter or And (if   |
|                                   | you specify Prefix and Tag child  |
|                                   | elements in the Filter)           |
+-----------------------------------+-----------------------------------+
| Rule                              | Container for a lifecycle rule.   |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Ancestor:**                     |
|                                   | LifecycleConfiguration            |
+-----------------------------------+-----------------------------------+
| Status                            | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
|                                   |                                   |
|                                   | **Valid values:** Enabled or      |
|                                   | Disabled                          |
+-----------------------------------+-----------------------------------+
| StorageClass                      | Specifies the storage class to    |
|                                   | which you want to transition the  |
|                                   | object.                           |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Transition and      |
|                                   | NoncurrentVersionTransition       |
|                                   |                                   |
|                                   | **Valid values:** STANDARD,       |
|                                   | STANDARD_IA, or GLACIER           |
+-----------------------------------+-----------------------------------+
| Tag                               | Container listing the tag key and |
|                                   | value used to filter objects to   |
|                                   | which the rule applies.           |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Filter              |
+-----------------------------------+-----------------------------------+
| Transition                        | This action specifies a period in |
|                                   | the objects’ lifetime to          |
|                                   | transition to another storage     |
|                                   | class.                            |
|                                   |                                   |
|                                   | If versioning has never been      |
|                                   | enabled on the bucket, the object |
|                                   | will transition to the specified  |
|                                   | storage class.                    |
|                                   |                                   |
|                                   | Otherwise, when your bucket is    |
|                                   | versioning-enabled or             |
|                                   | versioning-suspended, only the    |
|                                   | current version of the object     |
|                                   | identified in the rule.           |
|                                   |                                   |
|                                   | **Type:** Container               |
|                                   |                                   |
|                                   | **Children:** Days or Date, and   |
|                                   | StorageClass                      |
|                                   |                                   |
|                                   | **Ancestor:** Rule                |
+-----------------------------------+-----------------------------------+
| Value                             | Tag key value.                    |
|                                   |                                   |
|                                   | **Type:** String                  |
|                                   |                                   |
|                                   | **Ancestor:** Tag                 |
+-----------------------------------+-----------------------------------+

**Special Errors**

+-----------------+-----------------+-----------------+-----------------+
| Error Code      | Description     | HTTP Status     | SOAP Fault Code |
|                 |                 | Code            | Prefix          |
+=================+=================+=================+=================+
| NoSuchLifecycle | The lifecycle   | 404 Not Found   | Client          |
| Configuration   | configuration   |                 |                 |
|                 | does not exist. |                 |                 |
+-----------------+-----------------+-----------------+-----------------+

**Examples**

The following example shows a GET request to retrieve the lifecycle
configurations from a specified bucket.

*Sample Request*

..code::

  GET /?lifecycle HTTP/1.1
  Host: examplebucket.s3.amazonaws.com
  x-amz-date: Thu, 15 Nov 2012 00:17:21 GMT
  Authorization: signatureValue

*Sample Response*

The following is a sample response that shows a prefix of “projectdocs/”
filter and multiple lifecycle configurations for these objects.

-  Transition to STANDARD_IA after 30 days

-  Transition to GLACIER after 365 days

-  Expire after 3,650 days

.. code::

  HTTP/1.1 200 OK
  x-amz-id-2:  ITnGT1y4RyTmXa3rPi4hklTXouTf0hccUjo0iCPjz6FnfIutBj3M7fPGlWO2SEWp
  x-amz-request-id: 51991C342C575321
  Date: Thu, 15 Nov 2012 00:17:23 GMT
  Server: AmazonS3
  Content-Length: 358

.. code::

  <?xml version="1.0" encoding="UTF-8"?>
  <LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <Rule>
      <ID>Archive and then delete rule</ID>
      <Filter>
        <Prefix>projectdocs/</Prefix>
      </Filter>
      <Status>Enabled</Status>
      <Transition>
        <Days>30</Days>
        <StorageClass>STANDARD_IA</StorageClass>
      </Transition>
      <Transition>
        <Days>365</Days>
        <StorageClass>GLACIER</StorageClass>
      </Transition>
      <Expiration>
        <Days>3650</Days>
      </Expiration>
    </Rule>
  </LifecycleConfiguration>
