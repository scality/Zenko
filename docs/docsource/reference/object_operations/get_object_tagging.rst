.. _GET Object Tagging:

GET Object Tagging
==================

The GET Object Tagging operation returns the tags associated with an
object. You send the GET request against the ``tagging`` subresource
associated with the object.

To use this operation, you must have permission to perform the
s3:GetObjectTagging action. By default, the GET operation returns
information about current version of an object. For a versioned bucket,
you can have multiple versions of an object in your bucket. To retrieve
tags of any other version, use the ``versionId`` query parameter. You
also need permission for thes3:GetObjectVersionTagging action. By
default, the bucket owner has this permission and can grant this
permission to others.

Requests
--------

Request
~~~~~~~

.. code::

   GET /ObjectName?tagging HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

Parameters
~~~~~~~~~~

The GET Object Tagging operation does not use Request Parameters.

Headers
~~~~~~~

The GET Object Tagging operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).


Elements
~~~~~~~~

The GET Object Tagging operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The GET Object Tagging operation uses only response headers common to all
responses (see :ref:`Common Response Headers`).

Elements
~~~~~~~~

The GET Object Tagging operation can return the following XML elements in its
response (includes XML containers):

.. tabularcolumns:: X{0.15\textwidth}X{0.15\textwidth}X{0.65\textwidth}
.. table::

   +-------------+-----------+----------------------------------+
   | Element     | Type      | Description                      |
   +=============+===========+==================================+
   | ``Tagging`` | container | Container for the TagSet element |
   +-------------+-----------+----------------------------------+
   | ``TagSet``  | container | Contains the tag set             |
   |             |           |                                  |
   |             |           | **Ancestors:** Tagging           |
   +-------------+-----------+----------------------------------+
   | ``Tag``     | container | Contains the tag information     |
   |             |           |                                  |
   |             |           | **Ancestors:** TagSet            |
   +-------------+-----------+----------------------------------+
   | ``Key``     | string    | Name of the tag                  |
   |             |           |                                  |
   |             |           | **Ancestors:** Tag               |
   +-------------+-----------+----------------------------------+
   | ``Value``   | string    | Value of the tag                 |
   |             |           |                                  |
   |             |           | **Ancestors:** Tag               |
   +-------------+-----------+----------------------------------+

Examples
--------

Request
~~~~~~~

The following request returns the tag set of the specified object.

.. code::

   GET /example-object?tagging HTTP/1.1
   Host: {{BucketName}}.s3.scality.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: {{authorizationString}}

Response
~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Date: Thu, 22 Sep 2016 21:33:08 GMT
   Connection: close
   Server: ScalityS3
   <?xml version="1.0" encoding="UTF-8"?>
   <Tagging xmlns="http://s3.scality.com/doc/2006-03-01/">
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
