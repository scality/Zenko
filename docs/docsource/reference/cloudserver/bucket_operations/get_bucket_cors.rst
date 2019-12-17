.. _GET Bucket CORS:

GET Bucket CORS
===============

The GET Bucket CORS operation returns a bucket’s cors configuration
information. This operation requires S3:GetBucketCORS permission.

Requests
--------

Syntax
~~~~~~

.. code::

   GET /?cors HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

.. note::

   The request syntax illustrates only a portion of the request headers.

Parameters
~~~~~~~~~~

The GET Bucket CORS operation does not use request parameters.

Headers
~~~~~~~

The GET Bucket CORS operation uses only request headers that are common
to all operations (see :ref:`Common Request Headers`).

Elements
~~~~~~~~

The GET Bucket CORS operation does not use request
elements.

Responses
---------

Headers
~~~~~~~

The GET Bucket CORS operation uses only response
headers that are common to all operations (see :ref:`Common Response Headers`).

Elements
~~~~~~~~

.. tabularcolumns:: X{0.15\textwidth}X{0.15\textwidth}X{0.65\textwidth}
.. table::
   :class: longtable

   +-----------------------+-----------------------+-----------------------+
   | Element               | Type                  | Description           |
   +=======================+=======================+=======================+
   | ``CORSConfiguration`` | Container             | Container for up to   |
   |                       |                       | 100 CORSRules         |
   |                       |                       | elements.             |
   |                       |                       |                       |
   |                       |                       | **Ancestors:** None   |
   +-----------------------+-----------------------+-----------------------+
   | ``CORSRule``          | Container             | A set of origins and  |
   |                       |                       | methods (cross-origin |
   |                       |                       | the access to allow). |
   |                       |                       | Up to 100 rules can   |
   |                       |                       | be added to the       |
   |                       |                       | configuration.        |
   |                       |                       |                       |
   |                       |                       | **Ancestors:**        |
   |                       |                       | CORSConfiguration     |
   |                       |                       |                       |
   |                       |                       | **Children:**         |
   |                       |                       | AllowedOrigin,        |
   |                       |                       | AllowedMethod,        |
   |                       |                       | MaxAgeSeconds,        |
   |                       |                       | ExposeHeader, ID.     |
   +-----------------------+-----------------------+-----------------------+
   | ``AllowedHeader``     | Integer               | Specifies which       |
   |                       |                       | headers are allowed   |
   |                       |                       | in a pre-flight       |
   |                       |                       | OPTIONS request       |
   |                       |                       | through the           |
   |                       |                       | Access-Control-\      |
   |                       |                       | Request-Headers       |
   |                       |                       | header. Each header   |
   |                       |                       | name specified in the |
   |                       |                       | Access-Control-\      |
   |                       |                       | Request-Headers       |
   |                       |                       | must have a           |
   |                       |                       | corresponding entry   |
   |                       |                       | in the rule. Only the |
   |                       |                       | headers that were     |
   |                       |                       | requested will be     |
   |                       |                       | sent back. This       |
   |                       |                       | element can contain   |
   |                       |                       | at most one \*        |
   |                       |                       | wildcard character.   |
   |                       |                       |                       |
   |                       |                       | A CORSRule can have   |
   |                       |                       | at most one           |
   |                       |                       | MaxAgeSeconds         |
   |                       |                       | element.              |
   |                       |                       |                       |
   |                       |                       | **Ancestor:** CORSRule|
   +-----------------------+-----------------------+-----------------------+
   | ``AllowedMethod``     | Enum                  | Identifies an HTTP    |
   |                       |                       | method that the       |
   |                       |                       | domain/origin         |
   |                       |                       | specified in the rule |
   |                       |                       | is allowed to         |
   |                       |                       | execute. Each         |
   |                       |                       | CORSRule must contain |
   |                       |                       | at least one          |
   |                       |                       | AllowedMethod and one |
   |                       |                       | AllowedOrigin         |
   |                       |                       | element.              |
   |                       |                       |                       |
   |                       |                       | **Ancestor:** CORSRule|
   +-----------------------+-----------------------+-----------------------+
   | ``AllowedOrigin``     | String                | One or more response  |
   |                       |                       | headers that users    |
   |                       |                       | are allowed to access |
   |                       |                       | from their            |
   |                       |                       | applications (for     |
   |                       |                       | example, from a       |
   |                       |                       | JavaScript            |
   |                       |                       | XMLHttpRequest        |
   |                       |                       | object). Each         |
   |                       |                       | CORSRule must have at |
   |                       |                       | least one             |
   |                       |                       | AllowedOrigin         |
   |                       |                       | element. The string   |
   |                       |                       | value can include at  |
   |                       |                       | most one “\*” wildcard|
   |                       |                       | character, for        |
   |                       |                       | example,              |
   |                       |                       | “\http://\*.example.\ |
   |                       |                       | com”.                 |
   |                       |                       | Also, it is possible  |
   |                       |                       | to specify only “*”   |
   |                       |                       | to allow cross-origin |
   |                       |                       | access for all        |
   |                       |                       | domains/origins.      |
   |                       |                       |                       |
   |                       |                       | **Ancestor:** CORSRule|
   +-----------------------+-----------------------+-----------------------+
   | ``ExposeHeader``      | String                | One or more headers   |
   |                       |                       | in the response that  |
   |                       |                       | users can access from |
   |                       |                       | their applications    |
   |                       |                       | (for example, from a  |
   |                       |                       | JavaScript            |
   |                       |                       | XMLHttpRequest        |
   |                       |                       | object). Add one      |
   |                       |                       | ExposeHeader in the   |
   |                       |                       | rule for each header. |
   |                       |                       |                       |
   |                       |                       | **Ancestor:** CORSRule|
   +-----------------------+-----------------------+-----------------------+
   | ``ID``                | String                | An optional unique    |
   |                       |                       | identifier for the    |
   |                       |                       | rule. The ID value    |
   |                       |                       | can be up to 255      |
   |                       |                       | characters long. The  |
   |                       |                       | IDs can assist in     |
   |                       |                       | finding a rule in the |
   |                       |                       | configuration.        |
   |                       |                       |                       |
   |                       |                       | **Ancestor:** CORSRule|
   +-----------------------+-----------------------+-----------------------+
   | ``MaxAgeSeconds``     | Integer               | The time in seconds   |
   |                       |                       | that thse browser is  |
   |                       |                       | to cache the          |
   |                       |                       | preflight response    |
   |                       |                       | for the specified     |
   |                       |                       | resource. A CORSRule  |
   |                       |                       | can have at most one  |
   |                       |                       | MaxAgeSeconds         |
   |                       |                       | element.              |
   |                       |                       |                       |
   |                       |                       | **Ancestor:** CORSRule|
   +-----------------------+-----------------------+-----------------------+

Examples
--------

Retrieve CORS Subresource
~~~~~~~~~~~~~~~~~~~~~~~~~

This request retrieves the cors subresource of a bucket.

Request Sample
^^^^^^^^^^^^^^

.. code::

   GET /?cors HTTP/1.1
   Host: example.com
   Date: Tue, 13 Dec 2011 19:14:42 GMT
   Authorization: {{authenticationInformation}}

Response Sample
^^^^^^^^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: 0FmFIWsh/PpBuzZ0JFRC55ZGVmQW4SHJ7xVDqKwhEdJmf3q63RtrvH8ZuxW1Bol5
   x-amz-request-id: 0CF038E9BCF63097
   Date: Tue, 13 Dec 2011 19:14:42 GMT
   Server: ScalityS3
   Content-Length: 280

   .. code::

   <CORSConfiguration>
        <CORSRule>
          <AllowedOrigin>http://www.example.com</AllowedOrigin>
          <AllowedMethod>GET</AllowedMethod>
          <MaxAgeSeconds>3000</MaxAgeSec>
          <ExposeHeader>x-amz-server-side-encryption</ExposeHeader>
        </CORSRule>
   </CORSConfiguration>
