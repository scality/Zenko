.. _PUT Bucket Notification Configuration:

PUT Bucket Notification Configuration
=====================================

Enables notification on specified events for a bucket. For more information
about event notifications, see `Configuring Event Notifications
<https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html>`__.

Using this API, you can replace an existing notification configuration.  The
configuration is an XML file that defines the event types that you want Amazon
S3 to publish and the destination where you want Amazon S3 to publish an event
notification when it detects an event of the specified type.

By default, your bucket has no event notifications configured.
``NotificationConfiguration`` is empty.

.. code::

  <NotificationConfiguration>

  </NotificationConfiguration>

This operation replaces the existing notification configuration with the
configuration you include in the request body.

When S3 Connector receives this request, it verifies that the aws sqs Kafka
destination exists, and that the bucket owner has permission to publish to it by
sending a test notification.

You can disable notifications by adding an empty NotificationConfiguration
element.

.. note::
   
   S3 Connector supports QueueConfiguration notification types only. There is no
   support for CloudFunctionConfiguration and TopicConfiguration notification
   types.

By default, only the bucket owner can configure notifications on a
bucket. However, bucket owners can use a bucket policy to grant permission to
other users to set this configuration with s3:PutBucketNotification permission.

.. note::

   The PUT notification is an atomic operation. When you send a PUT request with
   this configuration, S3 Connector sends test messages to your Kafka queue. If
   the message fails, the entire PUT operation fails, and S3 Connector does not
   add the configuration to your bucket.

Responses
---------

The following operation is related to PutBucketNotificationConfiguration:

- :ref:`GET Bucket Notification Configuration`

Request Syntax
--------------

.. code::
   
   PUT /?notification HTTP/1.1
   Host: bucket.s3.example.com
   <?xml version="1.0" encoding="UTF-8"?>
   <NotificationConfiguration <xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <QueueConfiguration>
      <Event>string</Event>
      ...
      <Filter>
        <S3Key>
          <FilterRule>
            <Name>string</Name>
            <Value>string</Value>
          </FilterRule>
          ...
        </S3Key>
      </Filter>
      <Id>string</Id>
      <Queue>string</Queue>
    </QueueConfiguration>
    ...
  </NotificationConfiguration>

URI Request Parameters
----------------------

The request uses the following URI parameters.

**Bucket**

  The name of the bucket.

  Required

Request Body
------------

The request accepts the following data in XML format.

**NotificationConfiguration**

  Root-level tag for NotificationConfiguration parameters.

  Required

**QueueConfiguration**

  The Kafka queues to which, and the events about which messages are published.

  Type: Array of QueueConfiguration data types

  Not required

Response Syntax
---------------

  ``HTTP/1.1 200``

Response Elements
-----------------

  If the action is successful, the service returns a ``HTTP 200`` response with
  an empty HTTP body.

Examples
--------

Example: Configure a notification with queue destinations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following notification configuration includes a queue configuration
identifying an SQS queue for S3 Connector to publish events of the
s3:ObjectCreated:\* type.

.. code::
   
   <NotificationConfiguration>
     <QueueConfiguration>
       <Queue>arn:aws:sqs:us-east-1:356671443308:s3notificationqueue</Queue>
       <Event>s3:ObjectCreated:*</Event>
     </QueueConfiguration>
   </NotificationConfiguration>

The following PUT request against the notification subresource of the
"examplebucket" bucket sends the preceding notification configuration in the
request body. The operation replaces the existing notification configuration on
the bucket.

.. code::
   
   PUT http://s3.<Region>.example.com/examplebucket?notification= HTTP/1.1
   User-Agent: s3curl 2.0
   Host: s3.example.com
   Pragma: no-cache Accept: \*/\*
   Proxy-Connection: Keep-Alive
   Authorization: authorization string
   Date: Mon, 13 Oct 2014 22:58:43 +0000 Content-Length: 391
   Expect: 100-continue

Example 3: Configure a notification with object key name filtering
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following notification configuration contains a queue configuration
identifying an s3:ObjectCreated:Put type Kafka queue for S3 Connector to publish
to. The events are published whenever an object with an ``images`` prefix and
a ``.jpg`` suffix is PUT to a bucket. For more examples of notification
configurations that use filtering, see `Configuring Event Notifications
<https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html>`__.

.. code::

   <NotificationConfiguration>
     <QueueConfiguration>
       <Id>1</Id>
       <Filter>
         <S3Key>
	   <FilterRule>
	     <Name>prefix</Name>
	     <Value>images/</Value>
	   </FilterRule>
	   <FilterRule>
	     <Name>suffix</Name>
	     <Value>.jpg</Value>
	   </FilterRule>
	 </S3Key>
       </Filter>
       <Queue>arn:aws:sqs:us-west-2:444455556666:s3notificationqueue</Queue>
       <Event>s3:ObjectCreated:Put</Event>
     </QueueConfiguration>
   </NotificationConfiguration>

The following PUT request against the notification subresource of the
examplebucket bucket sends the preceding notification configuration in
the request body. The operation replaces the existing notification
configuration on the bucket.

.. code::

   PUT http://s3.<Region>.amazonaws.com/examplebucket?notification= HTTP/1.1
   User-Agent: s3curl 2.0
   Host: s3.example.com
   Pragma: no-cache
   Accept: \*/\*
   Proxy-Connection: Keep-Alive
   Authorization: authorization string
   Date: Mon, 13 Oct 2014 22:58:43 +0000
   Content-Length: length
   Expect: 100-continue

Sample Response
~~~~~~~~~~~~~~~

.. code::
   
   HTTP/1.1 200 OK
   x-amz-id-2: SlvJLkfunoAGILZK3KqHSSUq4kwbudkrROmESoHOpDacULy+cxRoR1Svrfoyvg2A
   x-amz-request-id: BB1BA8E12D6A80B7
   Date: Mon, 13 Oct 2014 22:58:44 GMT
   Content-Length: 0
   Server: example.com

