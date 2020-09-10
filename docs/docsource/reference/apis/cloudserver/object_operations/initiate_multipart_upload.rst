.. _Initiate Multipart Upload:

Initiate Multipart Upload
=========================

The Initiate Multipart Upload operation returns an ``upload ID`` that is
used to associate all the parts in the specific Multipart Upload. The
upload ID is specified in each subsequent upload part request (refer to
:ref:`Upload Part`), and it is also included in the final request
to either complete or abort the Multipart Upload request.

For request signing, Multipart Upload is just a series of regular
requests. First, multipart upload is initiated, then one or more
requests to upload parts is sent, and finally multipart upload
completes. Each request is individually signed (there is nothing special
about signing Multipart Upload requests).

.. tip::

  Any metadata that is to be stored along with the final multipart object
  should be included in the headers of the Initiate Multipart Upload
  request.

Requests
--------

Syntax

.. code::

   POST /{{ObjectName}}?uploads HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

Parameters
~~~~~~~~~~

The Initiate Multipart Upload operation does not use request parameters.

Headers
~~~~~~~

The Initiate Multipart Upload operation can use a number of optional
request headers in addition to those that are common to all operations
(refer to :ref:`Common Request Headers`).

.. tabularcolumns:: X{0.40\textwidth}X{0.10\textwidth}X{0.45\textwidth}
.. table::
   :class: longtable

   +-------------------------------------+--------+------------------------------------------+
   | Header                              | Type   | Description                              |
   +=====================================+========+==========================================+
   | ``Cache-Control``                   | string | Can be used to specify caching behavior  |
   |                                     |        | along the request/reply chain            |
   |                                     |        |                                          |
   |                                     |        | **Default:** None                        |
   |                                     |        |                                          |
   |                                     |        | **Constraints:** None                    |
   +-------------------------------------+--------+------------------------------------------+
   | ``Content-Disposition``             | string | Specifies presentational information for |
   |                                     |        | the object.                              |
   |                                     |        |                                          |
   |                                     |        | **Default:** None                        |
   |                                     |        |                                          |
   |                                     |        | **Constraints:** None                    |
   +-------------------------------------+--------+------------------------------------------+
   | ``Content-Encoding``                | string | Specifies which content encodings have   |
   |                                     |        | been applied to the object and the       |
   |                                     |        | decoding mechanisms that must be applied |
   |                                     |        | to obtain the media-type referenced by   |
   |                                     |        | the Content-Type header field.           |
   |                                     |        |                                          |
   |                                     |        | **Default:** None                        |
   |                                     |        |                                          |
   |                                     |        | **Constraints:** None                    |
   +-------------------------------------+--------+------------------------------------------+
   | ``Content-Type``                    | string | A standard MIME type describing the      |
   |                                     |        | format of the contents                   |
   |                                     |        |                                          |
   |                                     |        | **Default:** binary/octet-stream         |
   |                                     |        |                                          |
   |                                     |        | **Valid Values:** MIME types             |
   |                                     |        |                                          |
   |                                     |        | **Constraints:** None                    |
   +-------------------------------------+--------+------------------------------------------+
   | ``Expires``                         | string | The date and time at which the object is |
   |                                     |        | no longer cacheable                      |
   |                                     |        |                                          |
   |                                     |        | **Default:** None                        |
   |                                     |        |                                          |
   |                                     |        | **Constraints:** None                    |
   +-------------------------------------+--------+------------------------------------------+
   | ``x-amz-meta-*``                    | string | Headers starting with this prefix are    |
   |                                     |        | user-defined metadata, each of which is  |
   |                                     |        | stored and returned as a set of          |
   |                                     |        | key-value pairs. Zenko does not validate |
   |                                     |        | or interpret user-defined metadata.      |
   |                                     |        | Within the PUT request header, the       |
   |                                     |        | user-defined metadata's size is limited  |
   |                                     |        | to 2 KB.                                 |
   |                                     |        |                                          |
   |                                     |        | **Default:** None                        |
   |                                     |        |                                          |
   |                                     |        | **Constraints:** None                    |
   +-------------------------------------+--------+------------------------------------------+
   | ``x-amz-website-redirect-location`` | string | When a bucket is configured as a website,|
   |                                     |        | this metadata can be set on the object   |
   |                                     |        | so the website endpoint will evaluate    |
   |                                     |        | the request for the object as a 301      |
   |                                     |        | redirect to another object in the same   |
   |                                     |        | bucket or an external URL.               |
   |                                     |        |                                          |
   |                                     |        | **Default:** None                        |
   |                                     |        |                                          |
   |                                     |        | **Constraints:** The value must be       |
   |                                     |        | prefixed by, "``/``", "``http://``" or   |
   |                                     |        | "``https://``". The value's length is    |
   |                                     |        | limited to 2 KB.                         |
   +-------------------------------------+--------+------------------------------------------+

Access control-related headers can be used with this operation. By
default, all objects are private. Only the owner has full control. When
adding a new object, it is possible to grant permissions to individual
accounts or predefined groups. These permissions are then used to create
the Access Control List (ACL) on the object.

Specifying a Canned ACL
```````````````````````

Zenko supports a set of canned ACLs, each of which has a predefined set of
grantees and permissions.

.. tabularcolumns:: X{0.15\textwidth}X{0.10\textwidth}X{0.70\textwidth}
.. table::

   +---------------+---------+-----------------------------------------------------+
   | Header        | Type    | Description                                         |
   +===============+=========+=====================================================+
   | ``x-amz-acl`` | string  | The canned ACL to apply to the bucket you are       |
   |               |         | creating                                            |
   |               |         |                                                     |
   |               |         | **Default:** ``private``                            |
   |               |         |                                                     |
   |               |         | **Valid Values:** ``private`` \| ``public-read`` \| |
   |               |         | ``public-read-write`` \| ``authenticated-read`` \|  |
   |               |         | ``bucket-owner-read`` \|                            |
   |               |         | ``bucket-owner-full-control``                       |
   |               |         |                                                     |
   |               |         | **Constraints:** None                               |
   +---------------+---------+-----------------------------------------------------+

Explicitly Specifying Access Permissions
````````````````````````````````````````

A set of headers is available for explicitly granting access permissions
to specific accounts or groups, each of which maps to specific Zenko
permissions Zenko supports in an ACL.

In the header value, specify a list of grantees who get the specific
permission.

.. tabularcolumns:: X{0.30\textwidth}X{0.10\textwidth}X{0.55\textwidth}
.. table::

   +------------------------------+--------+--------------------------------------+
   | Header                       | Type   | Description                          |
   +==============================+========+======================================+
   | ``x-amz-grant-read``         | string | Allows grantee to read the object    |
   |                              |        | data and its metadata.               |
   |                              |        |                                      |
   |                              |        | **Default:** None                    |
   |                              |        |                                      |
   |                              |        | **Constraints:** None                |
   +------------------------------+--------+--------------------------------------+
   | ``x-amz-grant-read-acp``     | string | Allows grantee to read the object    |
   |                              |        | ACL.                                 |
   |                              |        |                                      |
   |                              |        | **Default:** None                    |
   |                              |        |                                      |
   |                              |        | **Constraints:** None                |
   +------------------------------+--------+--------------------------------------+
   | ``x-amz-grant-write-acp``    | string | Allows grantee to write the ACL for  |
   |                              |        | the applicable object.               |
   |                              |        |                                      |
   |                              |        | **Default:** None                    |
   |                              |        |                                      |
   |                              |        | **Constraints:** None                |
   +------------------------------+--------+--------------------------------------+
   | ``x-amz-grant-full-control`` | string | Allows grantee the  READ, READ_ACP,  |
   |                              |        | and WRITE_ACP permissions on the     |
   |                              |        | object                               |
   |                              |        |                                      |
   |                              |        | **Default:** None                    |
   |                              |        |                                      |
   |                              |        | **Constraints:** None                |
   +------------------------------+--------+--------------------------------------+

Each grantee is specified as a ``type=value`` pair, where the type can
be any one of the following:

-  ``emailAddress`` (if value specified is the email address of an
   account)
-  ``id`` (if value specified is the canonical user ID of an account)
-  ``uri`` (if granting permission to a predefined group)

For example, the following x-amz-grant-read header grants list objects
permission to the accounts identified by their email addresses:

.. code::

   x-amz-grant-read: emailAddress="xyz@scality.com", emailAddress="abc@scality.com"

Elements
~~~~~~~~

The Initiate Multipart Upload operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The Initiate Multipart Upload operation may include any of the common response
headers supported by the Zenko (see :ref:`Common Response Headers`).

Elements
~~~~~~~~

The Initiate Multipart Upload operation can return the following XML elements in
its response (includes XML containers):

.. tabularcolumns:: X{0.35\textwidth}X{0.10\textwidth}X{0.50\textwidth}
.. table::

   +------------------------------------+-----------+-----------------------+
   | Element                            | Type      | Description           |
   +====================================+===========+=======================+
   | ``InitiateMultipartUploadResult``  | container | Container for bucket  |
   |                                    |           | configuation settings |
   +------------------------------------+-----------+-----------------------+
   | ``Bucket``                         | string    | Name of the bucket to |
   |                                    |           | which the multipart   |
   |                                    |           | upload was initiated  |
   +------------------------------------+-----------+-----------------------+
   | ``Key``                            | string    | Object key for which  |
   |                                    |           | the multipart upload  |
   |                                    |           | was initiated         |
   +------------------------------------+-----------+-----------------------+
   | ``UploadID``                       | string    | ID for the initiated  |
   |                                    |           | multipart upload      |
   +------------------------------------+-----------+-----------------------+

Examples
--------

Initiating a Multipart Upload for the example-object Object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   POST /example-object?uploads HTTP/1.1
   Host: example-bucket.s3.scality.com
   Date: Mon, 1 Nov 2010 20:34:56 GMT
   Authorization: {{authorizationString}}

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Uuag1LuByRx9e6j5Onimru9pO4ZVKnJ2Qz7/C1NPcfTWAtRPfTaOFg==
   x-amz-request-id: 656c76696e6727732072657175657374
   Date:  Mon, 1 Nov 2010 20:34:56 GMT
   Content-Length: 197
   Connection: keep-alive
   Server: ScalityS3

.. code::

   <?xml version="1.0" encoding="UTF-8"?>
   <InitiateMultipartUploadResult xmlns="http://s3.scality.com/doc/2006-03-01/">
   <Bucket>example-bucket</Bucket>
   <Key>example-object</Key>
   <UploadId>VXBsb2FkIElEIGZvciA2aWWpbmcncyBteS1tb3ZpZS5tMnRzIHVwbG9hZA</UploadId>
   </InitiateMultipartUploadResult>
