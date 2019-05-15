.. _PUT Bucket Lifecycle:

PUT Bucket Lifecycle
====================

The PUT Bucket Lifecycle operation creates a new lifecycle configuration or
replaces an existing one.

Requests
--------

**Request Syntax**

.. code::

  PUT /?lifecycle HTTP/1.1
  Host: {{BucketName}}.{{StorageService}}.com
  Content-Length: {{length}}
  Date: {{date}}
  Authorization: {{authorizationString}}
  Content-MD5: MD5

**Request Parameters**

The PUT Bucket Lifecycle operation does not use request parameters.

**Request Headers**

.. tabularcolumns:: X{0.20\textwidth}X{0.65\textwidth}X{0.10\textwidth}
.. table::   

   +--------------+-------------------------------------------------+----------+
   | Name         | Type                                            | Required |
   +==============+=================================================+==========+
   | Content MD-5 | The base64-encoded 128-bit MD5 digest of the    | Yes      |
   |              | data; must be used as a message integrity check |          |
   |              | to verify that the request body was not         | 	       |
   |              | corrupted in transit. For more information, see | 	       |
   |              | RFC 1864.                                       | 	       |
   |              |                                                 | 	       |
   |              | **Type:** String                                | 	       |
   |              |                                                 | 	       |
   |              | **Default:** None                               | 	       |
   +--------------+-------------------------------------------------+----------+

**Request Body**

The lifecycle configuration can be specified in the request body. The
configuration is specified as XML consisting of one or more rules.

.. code::

  <LifecycleConfiguration>
    <Rule>
      ...
    </Rule>
    <Rule>
      ...
    </Rule>
  </LifecycleConfiguration>

Each rule consists of the following:

-  A filter identifying a subset of objects to which the rule applies.
      The filter can be based on a key name prefix, object tags, or a
      combination of both.

-  A status, indicating whether the rule is in effect.

-  One or more lifecycle transition and expiration actions to perform on
      the objects identified by the filter. If the state of your bucket
      is versioning-enabled or versioning-suspended, you can have many
      versions of the same object (one current version, and zero or more
      non-current versions). Amazon S3 provides predefined actions that
      you can specify for current and non-current object versions.

For example:

.. code::

  <LifecycleConfiguration>
    <Rule>
      <Filter>
        <Prefix>key-prefix</Prefix>
      </Filter>
      <Status>rule-status</Status>
      [One or more Transition/Expiration lifecycle actions.]
    </Rule>
  </LifecycleConfiguration>

The following table describes the XML elements in the lifecycle
configuration:

.. tabularcolumns:: X{0.35\textwidth}X{0.40\textwidth}X{0.20\textwidth}
.. table::
   :class: longtable

   +-----------------------+-----------------------+-----------------------+
   | Name                  | Type                  | Required              |
   +=======================+=======================+=======================+
   | AbortIncomplete\      | Container for         | Yes, if no other      |
   | MultipartUpload       | specifying when an    | action is specified   |
   |                       | incomplete multipart  | for the rule.         |
   |                       | upload becomes        |                       |
   |                       | eligible for an abort |                       |
   |                       | operation.            |                       |
   |                       |                       |                       |
   |                       | When you specify this |                       |
   |                       | lifecycle action, the |                       |
   |                       | rule cannot specify a |                       |
   |                       | tag-based filter.     |                       |
   |                       |                       |                       |
   |                       | **Type:** Container   |                       |
   |                       |                       |                       |
   |                       | **Child:**            |                       |
   |                       | DaysAfterInitiation   |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   +-----------------------+-----------------------+-----------------------+
   | And                   | Container for         | Yes, if more than one |
   |                       | specifying rule       | filter condition is   |
   |                       | filters. These        | specified (for        |
   |                       | filters determine the | example, one prefix   |
   |                       | subset of objects to  | and one or more       |
   |                       | which the rule        | tags).                |
   |                       | applies.              |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   +-----------------------+-----------------------+-----------------------+
   | Date                  | Date when action      | Yes, if Days and      |
   |                       | should occur. The     | ExpiredObjectDelete\  |
   |                       | date value must       | Marker are absent.    |
   |                       | conform to the ISO    |                       |
   |                       | 8601 format.          |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Ancestor:**         |                       |
   |                       | Expiration or         |                       |
   |                       | Transition            |                       |
   +-----------------------+-----------------------+-----------------------+
   | Days                  | Specifies the number  | Yes, if Date and      |
   |                       | of days after object  | ExpiredObjectDelete\  |
   |                       | creation when the     | Marker are absent.    |
   |                       | specific rule action  |                       |
   |                       | takes effect.         |                       |
   |                       |                       |                       |
   |                       | **Type:** Nonnegative |                       |
   |                       | Integer when used     |                       |
   |                       | with Transition.      |                       |
   |                       | Positive Integer when |                       |
   |                       | used with Expiration. |                       |
   |                       |                       |                       |
   |                       | **Ancestor:**         |                       |
   |                       | Expiration or         |                       |
   |                       | Transition            |                       |
   +-----------------------+-----------------------+-----------------------+
   | DaysAfterInitiation   | Specifies the number  | Yes, if ancestor is   |
   |                       | of days after         | specified.            |
   |                       | initiating a          |                       |
   |                       | multipart upload when |                       |
   |                       | the multipart upload  |                       |
   |                       | must be completed. If |                       |
   |                       | it does not complete  |                       |
   |                       | by the specified      |                       |
   |                       | number of days, it    |                       |
   |                       | becomes eligible for  |                       |
   |                       | an abort operation    |                       |
   |                       | and Amazon S3 aborts  |                       |
   |                       | the incomplete        |                       |
   |                       | multipart upload.     |                       |
   |                       |                       |                       |
   |                       | **Type:** Positive    |                       |
   |                       | Integer               |                       |
   |                       |                       |                       |
   |                       | **Ancestor:**         |                       |
   |                       | AbortIncompleteMultip |                       |
   |                       | artUpload             |                       |
   +-----------------------+-----------------------+-----------------------+
   | Expiration            | This action specifies | Yes, if no other      |
   |                       | a period in an        | action is present in  |
   |                       | object’s lifetime     | the Rule.             |
   |                       | when Amazon S3 should |                       |
   |                       | take the appropriate  |                       |
   |                       | expiration action.    |                       |
   |                       | Action taken depends  |                       |
   |                       | on whether the bucket |                       |
   |                       | is                    |                       |
   |                       | versioning-enabled.   |                       |
   |                       |                       |                       |
   |                       | If versioning has     |                       |
   |                       | never been enabled on |                       |
   |                       | the bucket, the only  |                       |
   |                       | copy of the object is |                       |
   |                       | deleted permanently.  |                       |
   |                       |                       |                       |
   |                       | Otherwise, if your    |                       |
   |                       | bucket is             |                       |
   |                       | versioning-enabled or |                       |
   |                       | versioning-suspended, |                       |
   |                       | the action applies    |                       |
   |                       | only to the current   |                       |
   |                       | version of the        |                       |
   |                       | object. A             |                       |
   |                       | versioning-enabled    |                       |
   |                       | bucket can have many  |                       |
   |                       | versions of the same  |                       |
   |                       | object, one current   |                       |
   |                       | version, and zero or  |                       |
   |                       | more noncurrent       |                       |
   |                       | versions.             |                       |
   |                       |                       |                       |
   |                       | Instead of deleting   |                       |
   |                       | the current version,  |                       |
   |                       | the current version   |                       |
   |                       | becomes a noncurrent  |                       |
   |                       | version and a delete  |                       |
   |                       | marker is added as    |                       |
   |                       | the new current       |                       |
   |                       | version.              |                       |
   |                       |                       |                       |
   |                       | **Type:** Container   |                       |
   |                       |                       |                       |
   |                       | **Children:** Days or |                       |
   |                       | Date                  |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   +-----------------------+-----------------------+-----------------------+
   | Filter                | Container for         | Yes                   |
   |                       | elements that         |                       |
   |                       | describe the filter   |                       |
   |                       | identifying a subset  |                       |
   |                       | of objects to which   |                       |
   |                       | the lifecycle rule    |                       |
   |                       | applies. If you       |                       |
   |                       | specify an empty      |                       |
   |                       | filter, the rule      |                       |
   |                       | applies to all        |                       |
   |                       | objects in the        |                       |
   |                       | bucket.               |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Children:** Prefix  |                       |
   |                       | or Tag                |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   +-----------------------+-----------------------+-----------------------+
   | ID                    | Unique identifier for | No                    |
   |                       | the rule. The value   |                       |
   |                       | cannot be longer than |                       |
   |                       | 255 characters.       |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   +-----------------------+-----------------------+-----------------------+
   | Key                   | Specifies the key of  | Yes, if Tag parent is |
   |                       | a tag. A tag key can  | specified.            |
   |                       | be up to 128 Unicode  |                       |
   |                       | characters in length. |                       |
   |                       |                       |                       |
   |                       | Tag keys that you     |                       |
   |                       | specify in a          |                       |
   |                       | lifecycle rule filter |                       |
   |                       | must be unique.       |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Tag     |                       |
   +-----------------------+-----------------------+-----------------------+
   | LifecycleConfigu\     | Container for         | Yes                   |
   | ration                | lifecycle rules. You  |                       |
   |                       | can add as many as    |                       |
   |                       | 1,000 rules.          |                       |
   |                       |                       |                       |
   |                       | **Type:** Container   |                       |
   |                       |                       |                       |
   |                       | **Children:** Rule    |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** None    |                       |
   +-----------------------+-----------------------+-----------------------+
   | ExpiredObjectDelete\  | On a versioning-ena\  | Yes, if Date and Days |
   | Marker                | bled or versioning-\  | are absent.           |
   |                       | suspended bucket, you |                       |
   |                       | can add this element  |                       |
   |                       | in the lifecycle      |                       |
   |                       | configuration to      |                       |
   |                       | delete expired object |                       |
   |                       | delete markers.       |                       |
   |                       |                       |                       |
   |                       | On a non-versioned    |                       |
   |                       | bucket, adding this   |                       |
   |                       | element would do      |                       |
   |                       | nothing because you   |                       |
   |                       | cannot have delete    |                       |
   |                       | markers.              |                       |
   |                       |                       |                       |
   |                       | When you specify this |                       |
   |                       | lifecycle action, the |                       |
   |                       | rule cannot specify a |                       |
   |                       | tag-based filter.     |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Valid Values:**     |                       |
   |                       | true or false         |                       |
   |                       |                       |                       |
   |                       | **Ancestor:**         |                       |
   |                       | Expiration            |                       |
   +-----------------------+-----------------------+-----------------------+
   | NoncurrentDays        | Specifies the number  | Yes                   |
   |                       | of days an object is  |                       |
   |                       | non-current before    |                       |
   |                       | performing the        |                       |
   |                       | associated action.    |                       |
   |                       |                       |                       |
   |                       | **Type:** Positive    |                       |
   |                       | Integer               |                       |
   |                       |                       |                       |
   |                       | **Ancestor:**         |                       |
   |                       | NoncurrentVersionEx\  |                       |
   |                       | piration              |                       |
   +-----------------------+-----------------------+-----------------------+
   | NoncurrentVersion\    | Specifies when        | Yes, if no other      |
   | Expiration            | noncurrent object     | action is present in  |
   |                       | versions expire. Upon | the rule.             |
   |                       | expiration, the       |                       |
   |                       | noncurrent object     |                       |
   |                       | versions are          |                       |
   |                       | permanently deleted.  |                       |
   |                       |                       |                       |
   |                       | You set this          |                       |
   |                       | lifecycle             |                       |
   |                       | configuration action  |                       |
   |                       | on a bucket that has  |                       |
   |                       | versioning enabled    |                       |
   |                       | (or suspended).       |                       |
   |                       |                       |                       |
   |                       | **Type:** Container   |                       |
   |                       |                       |                       |
   |                       | **Children:**         |                       |
   |                       | NoncurrentDays        |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   +-----------------------+-----------------------+-----------------------+
   | Prefix                | Object key prefix     | No                    |
   |                       | identifying one or    |                       |
   |                       | more objects to which |                       |
   |                       | the rule applies.     |                       |
   |                       | Empty prefix          |                       |
   |                       | indicates there is no |                       |
   |                       | filter based on key   |                       |
   |                       | prefix.               |                       |
   |                       |                       |                       |
   |                       | There can be at most  |                       |
   |                       | one Prefix in a       |                       |
   |                       | lifecycle rule        |                       |
   |                       | Filter.               |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Filter  |                       |
   |                       | or And (if you        |                       |
   |                       | specify multiple      |                       |
   |                       | filters such as a     |                       |
   |                       | prefix and one or     |                       |
   |                       | more tags)            |                       |
   +-----------------------+-----------------------+-----------------------+
   | Rule                  | Container for a       | Yes                   |
   |                       | lifecycle rule. A     |                       |
   |                       | lifecycle             |                       |
   |                       | configuration can     |                       |
   |                       | contain as many as    |                       |
   |                       | 1,000 rules.          |                       |
   |                       |                       |                       |
   |                       | **Type:** Container   |                       |
   |                       |                       |                       |
   |                       | **Ancestor:**         |                       |
   |                       | LifecycleConfigur\    |                       |
   |                       | ation                 |                       |
   +-----------------------+-----------------------+-----------------------+
   | Status                | If Enabled, the rule  | Yes                   |
   |                       | is executed when      |                       |
   |                       | condition occurs.     |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   |                       |                       |                       |
   |                       | **Valid Values:**     |                       |
   |                       | Enabled or Disabled.  |                       |
   +-----------------------+-----------------------+-----------------------+
   | StorageClass          | Specifies the storage | Yes                   |
   |                       | class (Zenko  	   | 			   |
   |			   | location) to which	   | This element is       |
   |			   | you want the object   | required only if you  |
   |                       | to transition.        | specify one or both   |
   |                       |                       | its ancestors.        |
   |                       | **Type:** String      | 	 		   |
   |                       |                       |                       |
   |                       | **Ancestor:**         |                       |
   |                       | Transition            |                       |
   |                       |                       |                       |
   |                       | **Valid Values:**     |                       |
   |                       | Any defined location  |			   |
   +-----------------------+-----------------------+-----------------------+
   | Tag                   | Container for         | No                    |
   |                       | specifying a tag key  |                       |
   |                       | and value. Each tag   |                       |
   |                       | has a key and a       |                       |
   |                       | value.                |                       |
   |                       |                       |                       |
   |                       | **Type:** Container   |                       |
   |                       |                       |                       |
   |                       | **Children:** Key and |                       |
   |                       | Value                 |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Filter  |                       |
   |                       | or And (if you        |                       |
   |                       | specify multiple      |                       |
   |                       | filters such as a     |                       |
   |                       | prefix and one or     |                       |
   |                       | more tags)            |                       |
   +-----------------------+-----------------------+-----------------------+
   | Transition            | This action specifies | Yes, if no other      |
   |                       | a period in the       | action is present in  |
   |                       | objects’ lifetime     | the Rule.             |
   |                       | when an object can    |                       |
   |                       | transition to another |                       |
   |                       | storage class.        |                       |
   |                       |                       |                       |
   |                       | If versioning has     |                       |
   |                       | never been enabled on |                       |
   |                       | the bucket, the       |                       |
   |                       | object will           |                       |
   |                       | transition to the     |                       |
   |                       | specified storage     |                       |
   |                       | class.                |                       |
   |                       |                       |                       |
   |                       | Otherwise, when your  |                       |
   |                       | bucket is             |                       |
   |                       | versioning-enabled or |                       |
   |                       | versioning-suspended, |                       |
   |                       | only the current      |                       |
   |                       | version transitions   |                       |
   |                       | to the specified      |                       |
   |                       | storage class.        |                       |
   |                       | Noncurrent versions   |                       |
   |                       | are unaffected.       |                       |
   |                       |                       |                       |
   |                       | **Type:** Container   |                       |
   |                       |                       |                       |
   |                       | **Children:** Days or |                       |
   |                       | Date, and             |                       |
   |                       | StorageClass          |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Rule    |                       |
   +-----------------------+-----------------------+-----------------------+
   | Value                 | Specifies the value   | Yes, if Tag parent is |
   |                       | for a tag key. Each   | specified             |
   |                       | object tag is a       |                       |
   |                       | key-value pair.       |                       |
   |                       |                       |                       |
   |                       | Tag value can be up   |                       |
   |                       | to 256 Unicode        |                       |
   |                       | characters in length. |                       |
   |                       |                       |                       |
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Ancestor:** Tag     |                       |
   +-----------------------+-----------------------+-----------------------+

Requests
--------

**Request Syntax**

.. code::

  PUT /?lifecycle HTTP/1.1
  Host: {{BucketName}}.{{StorageService}}.com
  Content-Length: {{length}}
  Date: {{date}}
  Authorization: {{authorizationString}}
  Content-MD5: MD5

**Request Parameters**

The PUT Bucket Lifecycle operation does not use request parameters.

**Request Headers**

.. tabularcolumns:: X{0.20\textwidth}X{0.65\textwidth}X{0.10\textwidth}
.. table::

   +-----------------------+-----------------------+-----------------------+
   | Name                  | Type                  | Required              |
   +=======================+=======================+=======================+
   | Content MD-5          | The base64-encoded    | Yes                   |
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
   |                       | **Type:** String      |                       |
   |                       |                       |                       |
   |                       | **Default:** None     |                       |
   +-----------------------+-----------------------+-----------------------+

**Request Elements**

The lifecycle configuration can be specified in the request body. The
configuration is specified as XML consisting of one or more rules.

.. code::

  <LifecycleConfiguration>
    <Rule>
    ...
    </Rule>
    <Rule>
    ...
    </Rule>
  </LifecycleConfiguration>

Responses
---------

**Response Headers**

Implementation of the PUT Bucket Lifecycle operation uses only response
headers that are common to most responses (see :ref:`Common Response Headers`).

**Response Elements**

The PUT Bucket Lifecycle operation does not return response elements.

**Special Errors**

The PUT Bucket Lifecycle operation does not return special errors.

**Examples**

*Add lifecycle configuration—bucket versioning disabled*

The following lifecycle configuration specifies two rules, each with one
action.

-  The Transition action specifies objects with the “documents/” prefix
      to transition to the wasabi_cloud storage class 30 days after creation.

-  The Expiration action specifies objects with the “logs/” prefix to be
      deleted 365 days after creation.

.. code::

  <LifecycleConfiguration>
    <Rule>
      <ID>id1</ID>
      <Filter>
      <Prefix>documents/</Prefix>
      </Filter>
      <Status>Enabled</Status>
      <Transition>
        <Days>30</Days>
        <StorageClass>wasabi_cloud</StorageClass>
      </Transition>
    </Rule>
    <Rule>
      <ID>id2</ID>
      <Filter>
        <Prefix>logs/</Prefix>
      </Filter>
      <Status>Enabled</Status>
      <Expiration>
        <Days>365</Days>
      </Expiration>
    </Rule>
  </LifecycleConfiguration>

The following is a sample PUT /?lifecycle request that adds the
preceding lifecycle configuration to the “examplebucket” bucket.

.. code::

  PUT /?lifecycle HTTP/1.1
  Host: examplebucket.s3.amazonaws.com
  x-amz-date: Wed, 14 May 2014 02:11:21 GMT
  Content-MD5: q6yJDlIkcBaGGfb3QLY69A==
  Authorization: *authorization string* Content-Length: 415

.. code::

  <LifecycleConfiguration>
    <Rule>
      <ID>id1</ID>
      <Filter>
        <Prefix>documents/</Prefix>
      </Filter>
      <Status>Enabled</Status>
      <Transition>
        <Days>30</Days>
        <StorageClass>wasabi_cloud</StorageClass>
      </Transition>
    </Rule>
      <Rule>
        <ID>id2</ID>
        <Filter>
          <Prefix>logs/</Prefix>
        </Filter>
        <Status>Enabled</Status>
        <Expiration>
          <Days>365</Days>
        </Expiration>
    </Rule>
  </LifecycleConfiguration>

The following is a sample response.

.. code::

  HTTP/1.1 200 OK
  x-amz-id-2: r+qR7+nhXtJDDIJ0JJYcd+1j5nM/rUFiiiZ/fNbDOsd3JUE8NWMLNHXmvPfwMpdc
  x-amz-request-id: 9E26D08072A8EF9E
  Date: Wed, 14 May 2014 02:11:22 GMT
  Content-Length: 0
  Server: AmazonS3

*Add lifecycle configuration—bucket versioning is enabled.*

The following lifecycle configuration specifies one rule, with one
action to perform. Specify this action when your bucket is
versioning-enabled or versioning is suspended.

The NoncurrentVersionExpiration action specifies non-current versions
of objects with the “logs/” prefix to expire 100 days after the
objects become non-current.

.. code::

  <LifeCycleConfiguration>
    <Rule>
      <ID>DeleteAfterBecomingNonCurrent</ID>
      <Filter>
        <Prefix>logs/</Prefix>
      </Filter>
      <Status>Enabled</Status>
      <NoncurrentVersionExpiration>
        <NoncurrentDays>100</NoncurrentDays>
      </NoncurrentVersionExpiration>
    </Rule>
  </LifeCycleConfiguration>

The following is a sample PUT /?lifecycle request that adds the
preceding lifecycle configuration to the \`examplebucket\` bucket.

.. code::

  PUT /?lifecycle HTTP/1.1
  Host: examplebucket.s3.amazonaws.com
  x-amz-date: Wed, 14 May 2014 02:21:48 GMT
  Content-MD5: 96rxH9mDqVNKkaZDddgnw==
  Authorization: authorization string
  Content-Length: 598

  <LifeCycleConfiguration>
    <Rule>
      <ID>DeleteAfterBecomingNonCurrent</ID>
      <Filter>
        <Prefix>logs/</Prefix>
      </Filter>
      <Status>Enabled</Status>
      <NoncurrentVersionExpiration>
        <NoncurrentDays>1</NoncurrentDays>
      </NoncurrentVersionExpiration>
    </Rule>
  </LifeCycleConfiguration>

The following is a sample response:

.. code::

  HTTP/1.1 200 OK
  x-amz-id-2:  aXQ+KbIrmMmoO//3bMdDTw/CnjArwje+J49Hf+j44yRb/VmbIkgIO5A+PT98Cp/6k07hf+LD2mY=
  x-amz-request-id: 02D7EC4C10381EB1
  Date: Wed, 14 May 2014 02:21:50 GMT
  Content-Length: 0
  Server: AmazonS3
