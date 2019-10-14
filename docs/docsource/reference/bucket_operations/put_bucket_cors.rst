.. _PUT Bucket CORS:

PUT Bucket CORS
===============

The PUT Bucket CORS operation configures a bucket to accept cross-origin
requests.

Requests
--------

Syntax
~~~~~~

.. code::

   PUT /?cors HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Content-Length: {{length}}
   Date: {{date}}
   Authorization: {{authenticationInformation}}

.. code::

   <CORSConfiguration>
     <CORSRule>
       <AllowedOrigin>Origin you want to allow cross-domain requests from</AllowedOrigin>
       <AllowedOrigin>...</AllowedOrigin>
       ...
       <AllowedMethod>HTTP method</AllowedMethod>
       <AllowedMethod>...</AllowedMethod>
       ...
       <MaxAgeSeconds>Time in seconds your browser to cache the pre-flight OPTIONS response for a resource</MaxAgeSeconds>
       <AllowedHeader>Headers that you want the browser to be allowed to send</AllowedHeader>
       <AllowedHeader>...</AllowedHeader>
        ...
       <ExposeHeader>Headers in the response that you want accessible from client application</ExposeHeader>
       <ExposeHeader>...</ExposeHeader>
        ...
     </CORSRule>
     <CORSRule>
       ...
     </CORSRule>
       ...
   </CORSConfiguration>

.. note::

   This request syntax example illustrates only a portion of the request headers.

Parameters
~~~~~~~~~~

The PUT Bucket CORS operation does not use request parameters.

Elements
~~~~~~~~

.. tabularcolumns:: X{0.20\textwidth}X{0.15\textwidth}X{0.60\textwidth}
.. table::
   :class: longtable

   +-----------------------+-----------+-------------------------------------------+
   | Element               | Type      | Description                               |
   +=======================+===========+===========================================+
   | ``CORSConfiguration`` | Container | Container for up to 100 CORSRules         |
   |                       |           | elements.                                 |
   |                       |           |                                           |
   |                       |           | **Ancestors:** None                       |
   +-----------------------+-----------+-------------------------------------------+
   | ``CORSRule``          | Container | A set of origins and methods (cross-      |
   |                       |           | origin access that you want to allow).    |
   |                       |           | You can add up to 100 rules to the        |
   |                       |           | configuration.                            |
   |                       |           |                                           |
   |                       |           | **Ancestors:** CORSConfiguration          |
   +-----------------------+-----------+-------------------------------------------+
   | ``ID``                | String    | A unique identifier for the rule. The ID  |
   |                       |           | value can be up to 255 characters long.   |
   |                       |           | The IDs help you find a rule in the       |
   |                       |           | configuration.                            |
   |                       |           |                                           |
   |                       |           | **Ancestors:** CORSRule                   |
   +-----------------------+-----------+-------------------------------------------+
   | ``AllowedMethod``     | Enum      | An HTTP method that you want to allow the |
   |                       |           | origin to execute. Each CORSRule must     |
   |                       |           | identify at least one origin and one      |
   |                       |           | method.                                   |
   |                       |           |                                           |
   |                       |           | **Ancestors:** CORSRule                   |
   +-----------------------+-----------+-------------------------------------------+
   | ``AllowedOrigin``     | String    | An origin from which you want to allow    |
   |                       |           | cross-domain requests. This can contain   |
   |                       |           | at most one \* wildcard character.        |
   |                       |           | Each CORSRule must identify at least one  |
   |                       |           | origin and one method.                    |
   |                       |           |                                           |
   |                       |           | **Ancestors:** CORSRule                   |
   +-----------------------+-----------+-------------------------------------------+
   | ``AllowedHeader``     | String    | Specifies which headers are allowed in a  |
   |                       |           | pre-flight OPTIONS request via the        |
   |                       |           | Access-Control-Request-Headers header.    |
   |                       |           | Each header name specified in the         |
   |                       |           | Access-Control-Request-Headers header     |
   |                       |           | must have a corresponding entry in the    |
   |                       |           | rule to get a ``200 OK`` response from    |
   |                       |           | the preflight request. In a response,     |
   |                       |           | CloudServer sends only the allowed        | 
   |                       |           | headers that were requested. This can     |
   |                       |           | contain at most one \* wildcard           |
   |                       |           | character.                                |
   |                       |           |                                           |
   |                       |           | **Ancestors:** CORSRule                   |
   +-----------------------+-----------+-------------------------------------------+
   | ``MaxAgeSeconds``     | Integer   | The time in seconds that your browser is  |
   |                       |           | to cache the preflight response for the   |
   |                       |           | specified resource. A CORSRule can have   |
   |                       |           | at most one MaxAgeSeconds element.        |
   |                       |           |                                           |
   |                       |           | **Ancestors:** CORSRule                   |
   +-----------------------+-----------+-------------------------------------------+
   | ``ExposeHeader``      | String    | One or more headers in the response that  |
   |                       |           | you want customers to be able to access   |
   |                       |           | from their applications (for example,     |
   |                       |           | from a JavaScript XMLHttpRequest object). |
   |                       |           | Add one ExposeHeader element in the rule  |
   |                       |           | for each header.                          |
   |                       |           |                                           |
   |                       |           | **Ancestors:** CORSRule                   |
   +-----------------------+-----------+-------------------------------------------+

Responses
---------

Headers
~~~~~~~

The PUT Bucket CORS operation uses only response headers that are common to all
operations (see :ref:`Common Response Headers`).

Elements
~~~~~~~~

The PUT Bucket CORS operation does not return response elements.

Examples
--------

Configure CORS
~~~~~~~~~~~~~~

The following PUT request adds the ``cors`` subresource to a bucket.

Request Sample
^^^^^^^^^^^^^^

.. code::

   PUT /?cors HTTP/1.1
   Host: example.com
   x-amz-date: Tue, 21 Aug 2012 17:54:50 GMT
   Content-MD5: 8dYiLewFWZyGgV2Q5FNI4W==
   Authorization: {{authenticationInformation}}
   Content-Length: 216

.. code::

   <CORSConfiguration>
    <CORSRule>
      <AllowedOrigin>http://www.example.com</AllowedOrigin>
      <AllowedMethod>PUT</AllowedMethod>
      <AllowedMethod>POST</AllowedMethod>
      <AllowedMethod>DELETE</AllowedMethod>
      <AllowedHeader>*</AllowedHeader>
      <MaxAgeSeconds>3000</MaxAgeSec>
      <ExposeHeader>x-amz-server-side-encryption</ExposeHeader>
    </CORSRule>
    <CORSRule>
      <AllowedOrigin>*</AllowedOrigin>
      <AllowedMethod>GET</AllowedMethod>
      <AllowedHeader>*</AllowedHeader>
      <MaxAgeSeconds>3000</MaxAgeSeconds>
    </CORSRule>
   </CORSConfiguration>

Response Sample
^^^^^^^^^^^^^^^

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: CCshOvbOPfxzhwOADyC4qHj/Ck3F9Q0viXKw3rivZ+GcBoZSOOahvEJfPisZB7B
   x-amz-request-id: BDC4B83DF5096BBE
   Date: Tue, 21 Aug 2012 17:54:50 GMT
   Server: ScalityS3
