.. _PUT Object Tagging:

PUT Object Tagging
==================

The Put Object Tagging operation uses the ``tagging`` subresource to add
a set of tags to an existing object.

A tag is a key/value pair. You can associate tags with an object by
sending a PUT request against the ``tagging`` subresource associated
with the object. To retrieve tags, send a GET request. For more
information, refer to :ref:`GET Object Tagging`.

For tagging related restrictions related to characters and encodings,
refer to `Tag
Restrictions <http://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/allocation-tag-restrictions.html>`__
in the *AWS Billing and Cost Management User Guide*. Note that S3 limits
the maximum number of tags to 10 tags per object.

To use this operation, you must have permission to perform the
s3:PutObjectTagging action. By default, the bucket owner has this
permission and can grant this permission to others.

To put tags of any other version, use the versionId query parameter. You
also need permission for the s3:PutObjectVersionTagging action.

Requests
--------

**Request Syntax**

The following request shows the syntax for sending tagging information
in the request body.

.. code::

   GET /ObjectName?tagging HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

.. code::

   <Tagging>
     <TagSet>
        <Tag>
          <Key>Tag Name</Key>
          <Value>Tag Value</Value>
        </Tag>
     </TagSet>
   </Tagging>

**Request Parameters**

The PUT Object Tagging operation does not use Request Parameters.

**Request Headers**

Content-MD5 is a required header for this operation.

**Request Elements**

.. tabularcolumns:: X{0.10\textwidth}X{0.10\textwidth}X{0.35\textwidth}X{0.30\textwidth}
.. table::

   +---------+-----------+----------------------------------+------------------+
   | Element | Type      | Description                      | Required         |
   +=========+===========+==================================+==================+
   | Tagging | container | Container for the TagSet element | Yes              |
   +---------+-----------+----------------------------------+------------------+
   | TagSet  | container | Contains the tag set             | Yes              |
   |         |           |                                  |                  |
   |         |           | Ancestors: Tagging               |                  |
   +---------+-----------+----------------------------------+------------------+
   | Tag     | container | Contains the tag information     | No               |
   |         |           |                                  |                  |
   |         |           | Ancestors: TagSet                |                  |
   +---------+-----------+----------------------------------+------------------+
   | Key     | string    | Name of the tag                  | Yes, if Tag is   |
   |         |           |                                  | specified        |
   |         |           | Ancestors: Tag                   |                  |
   +---------+-----------+----------------------------------+------------------+
   | Value   | string    | Value of the tag                 | No               |
   |         |           |                                  |                  |
   |         |           | Ancestors: Tag                   |                  |
   +---------+-----------+----------------------------------+------------------+

Responses
---------

**Response Headers**

Implementation of the PUT Object Tagging operation uses only response
headers common to all responses (refer to :ref:`Common Response Headers`).

**Response Elements**

The PUT Object Tagging operation does not return response elements.

**Special Errors**

-  InvalidTagError — The tag provided was not a valid tag. This error
   can occur if the tag did not pass input validation. For more
   information, refer to `Object
   Tagging <http://docs.aws.amazon.com/AmazonS3/latest/dev/object-tagging.html>`__
   in the Amazon Simple Storage Service Developer Guide.
-  MalformedXMLError — The XML provided does not match the schema.
-  OperationAbortedError — A conflicting conditional operation is
   currently in progress against this resource. Please try again.
-  InternalError — The service was unable to apply the provided tag to
   the object.

Examples
--------

*Request Sample*

The following request adds a tag set to the existing object object-key
in the examplebucket bucket.

.. code::

   PUT object-key?tagging HTTP/1.1
   Host: {{BucketName}}.s3.scality.com
   Content-Length: length
   Content-MD5: pUNXr/BjKK5G2UKExample==
   x-amz-date: 20160923T001956Z
   Authorization: {{authorizationString}}

.. code::

   <Tagging>
      <TagSet>
         <Tag>
            <Key>tag1</Key>
            <Value>val1</Value>
         </Tag>
         <Tag>
            <Key>tag2</Key>
            <Value>val2</Value>
         </Tag>
      </TagSet>
   </Tagging>

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: YgIPIfBiKa2bj0KMgUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 236A8905248E5A01
   Date: Thu, 22 Sep 2016 21:33:08 GMT
