.. _GET Service:

GET Service
===========

The GET operation on a service returns a list of all buckets owned by the
authenticated sender of the request.

If the requester is an IAM user, the request shows all buckets owned by the
parent account. Individual users can list buckets they did not create; however,
they cannot see buckets created by different accounts.

.. note::

  A POST Service operation is available to return metrics at the global service
  level, provided the :ref:`Service Utilization API` is installed.

.. important::

  Authentication with a valid Access Key ID is required. Anonymous requests
  cannot list buckets, though users with correct permissions can see buckets in
  an account that they did not create.

Requests
--------

Request Syntax
~~~~~~~~~~~~~~

.. code::

   GET / HTTP/1.1
   Host: {{ConnectorName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

Request Parameters
~~~~~~~~~~~~~~~~~~

The GET Service operation does not use request parameters.

Request Headers
~~~~~~~~~~~~~~~

Implementation of the GET Service operation uses only request headers that are
common to all operations (refer to :ref:`Common Request Headers`).

Request Elements
~~~~~~~~~~~~~~~~

The GET Service operation does not use request elements.

Responses
---------

Response Headers
~~~~~~~~~~~~~~~~

Implementation of the GET Service operation uses only response headers that are
common to all operations (refer to :ref:`Common Response Headers`).

Response Elements
~~~~~~~~~~~~~~~~~

The GET Service operation can return the following XML elements in the response
(includes XML containers):

.. tabularcolumns:: lX{0.30\textwidth}X{0.35\textwidth}
.. table::
   :widths: 20 35 45

   +----------------------------+------------------------------+-----------------------+
   | Element                    | Type                         | Description           |
   +============================+==============================+=======================+
   | ``Bucket``                 | Container                    | Container for bucket  |
   |                            |                              | information           |
   +----------------------------+------------------------------+-----------------------+
   | ``Buckets``                | Container                    | Container for one or  |
   |                            |                              | more buckets          |
   +----------------------------+------------------------------+-----------------------+
   | ``CreationDate``           | date (yyyy-mm-ddThh:mm:ss.   | Date the bucket was   |
   |                            | timezone. e.g.:              | created               |
   |                            | ``2009-02-03T16:45:09.000Z``)|                       |
   +----------------------------+------------------------------+-----------------------+
   | ``DisplayName``            | String                       | Bucket owner’s        |
   |                            |                              | display name          |
   +----------------------------+------------------------------+-----------------------+
   | ``ID``                     | String                       | Bucket owner’s        |
   |                            |                              | canonical user ID     |
   +----------------------------+------------------------------+-----------------------+
   | ``ListAllMyBucketsResult`` | Container                    | Container for         |
   |                            |                              | response              |
   +----------------------------+------------------------------+-----------------------+
   | ``Owner``                  | Container                    | Container for bucket  |
   |                            |                              | owner information     |
   +----------------------------+------------------------------+-----------------------+

Examples
--------

Return a List of all Buckets Owned by the Authenticated Request Sender
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request Sample
^^^^^^^^^^^^^^

.. code::

   GET / HTTP/1.1
   Host: demo.s3.example.com
   Date: Thu, 31 Mar 2016 15:06:25 GMT
   Authorization: AWS pat:rhcjIVUs1lgxPgErOA5BTR0I8Qc=

Response Sample
^^^^^^^^^^^^^^^

The response lists the buckets owned by the authenticated sender.

.. code::

   HTTP/1.1 200 OK
   Date: Thu, 31 Mar 2016 15:55:19 GMT
   Server: RestServer/1.0
   Content-length: 317
   Content-Type: application/octet-stream
   Cache-Control: no-cache
   Connection: close
   <?xml version="1.0" encoding="UTF-8"?>.
   <ListAllMyBucketsResult xmlns="http://s3.example.com/doc/2006-03-01/">
     <Owner>
       <ID>14B5C45B8E359BC1601B7C682D83EB50648AE420</ID>
       <DisplayName>Test </DisplayName>
     </Owner>
     <Buckets>
       <Bucket>
         <Name>polo</Name>
         <CreationDate>2016-03-31T17:52:20.000Z</CreationDate>
       </Bucket>
       <Bucket>
         <Name>izod</Name>
         <CreationDate>2011-06-31T17:53:29.000Z</CreationDate>
       </Bucket>
     </Buckets>
   </ListAllMyBucketsResult

In the sample syntax, the Owner field lists information about the bucket owner,
and the Buckets field lists buckets and their metadata.

