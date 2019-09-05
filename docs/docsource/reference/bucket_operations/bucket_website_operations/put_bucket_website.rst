.. _PUT Bucket Website:

PUT Bucket Website
==================

The PUT Bucket Website operation configures a bucket to serve as a
bucket website.

Requests
--------

**Request Syntax**

.. code::

   PUT /?website HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Content-Length: {{length}}
   Authorization: {{authenticationInformation}}

   <WebsiteConfiguration xmlns="http://s3.scality.com/doc/2006-03-01/">
   <!-- website configuration information. -->
   </WebsiteConfiguration>

.. note::

  The Request Syntax illustrates only a portion of the request headers.

**Request Parameters**

The PUT Bucket Website operation does not use Request Parameters.

**Request Headers**

The PUT Bucket operation uses only request headers that are common to
all operations (refer to :ref:`Common Request Headers`).

**Request Elements**

You can use a website configuration to redirect all requests to the
website endpoint of a bucket, or you can add routing rules that redirect
only specific requests.

-  To redirect all website requests sent to the bucket’s website
   endpoint, add a website configuration with the following elements. 
   Because all requests are sent to another website, you don’t
   need to provide index document name for the bucket.

   .. tabularcolumns:: X{0.30\textwidth}X{0.10\textwidth}X{0.40\textwidth}
   .. table::

      +-----------------------+-----------------------+-----------------------+
      | Element               | Type                  | Description           |
      +=======================+=======================+=======================+
      | WebsiteConfiguration  | container             | The root element for  |
      |                       |                       | the website           |
      |                       |                       | configuration         |
      |                       |                       |                       |
      |                       |                       | Ancestors: None       |
      +-----------------------+-----------------------+-----------------------+
      | RedirectAllRequestsTo | container             | Describes the         |
      |                       |                       | redirect behavior for |
      |                       |                       | every request to this |
      |                       |                       | bucket’s website      |
      |                       |                       | endpoint. If this     |
      |                       |                       | element is present,   |
      |                       |                       | no other siblings are |
      |                       |                       | allowed.              |
      |                       |                       |                       |
      |                       |                       | Ancestors:            |
      |                       |                       | WebsiteConfiguration  |
      +-----------------------+-----------------------+-----------------------+
      | HostName              | string                | Name of the host      |
      |                       |                       | where requests will   |
      |                       |                       | be redirected.        |
      |                       |                       |                       |
      |                       |                       | Ancestors:            |
      |                       |                       | RedirectAllRequestsTo |
      +-----------------------+-----------------------+-----------------------+
      | Protocol              | string                | Protocol to use       |
      |                       |                       | (http, https) when    |
      |                       |                       | redirecting requests. |
      |                       |                       | The default is the    |
      |                       |                       | protocol that is used |
      |                       |                       | in the original       |
      |                       |                       | request.              |
      |                       |                       |                       |
      |                       |                       | Ancestors:            |
      |                       |                       | RedirectAllRequestsTo |
      +-----------------------+-----------------------+-----------------------+

-  For granular control over redirects, use the following elements to add routing
   rules that describe conditions for redirecting requests and information about
   the redirect destination. In this case, the website configuration must provide
   an index document for the bucket, because some requests might not be redirected.

.. tabularcolumns:: X{0.30\textwidth}X{0.10\textwidth}X{0.55\textwidth}
.. table::
   :class: longtable

   +-----------------------+-----------+---------------------------------------+
   | Element               | Type      | Description                           |
   +=======================+===========+=======================================+
   | WebsiteConfiguration  | Container | Container for the request             |
   |                       |           |                                       |
   |                       |           | Ancestors: None                       |
   +-----------------------+-----------+---------------------------------------+
   | IndexDocument         | Container | Container for the Suffix element      |
   |                       |           |                                       |
   |                       |           | Ancestors: WebsiteConfiguration       |
   +-----------------------+-----------+---------------------------------------+
   | Suffix                | String    | A suffix that is appended to a        | 
   |                       |           | request that is for a directory on    |
   |                       |           | the website endpoint (e.g., if the    |
   |                       |           | suffix is index.html and you make a   |
   |                       |           | request to samplebucket/images/, the  |
   |                       |           | data returned will be for the         |
   |                       |           | object with the key name              |
   |                       |           | images/index.html)                    |
   |                       |           |                                       |
   |                       |           | The suffix must not be empty and must |
   |                       |           | not include a slash character.        |
   |                       |           |                                       | 
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.IndexDocument    |
   +-----------------------+-----------+---------------------------------------+
   | ErrorDocument         | Container | Container for the Key element         |
   |                       |           |                                       |
   |                       |           | Ancestors: WebsiteConfiguration       |
   +-----------------------+-----------+---------------------------------------+
   | Key                   | String    | The object key name to use when a     |
   |                       |           | 4XX-class error occurs. This key      |
   |                       |           | identifies the page that is returned  |
   |                       |           | when such an error occurs.            |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |            
   |                       |           | WebsiteConfiguration.ErrorDocument    |
   |                       |           |                                       |
   |                       |           | Condition: Required when              |
   |                       |           | ErrorDocument is specified.           |
   +-----------------------+-----------+---------------------------------------+
   | RoutingRules          | Container | Container for a collection of         |
   |                       |           | RoutingRule elements.                 |
   |                       |           |                                       |
   |                       |           | Ancestors: WebsiteConfiguration       |
   +-----------------------+-----------+---------------------------------------+
   | RoutingRule           | String    | Container for one routing rule that   |
   |                       |           | identifies a condition and a redirect |
   |                       |           | that applies when the condition is    |
   |                       |           | met.                                  |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules     |
   |                       |           |                                       |
   |                       |           | Condition: In a RoutingRules          |
   |                       |           | container, there must be at least one |
   |                       |           | RoutingRule element.                  |
   +-----------------------+-----------+---------------------------------------+
   | Condition             | Container | A container for describing a          |
   |                       |           | condition that must be met for the    |
   |                       |           | specified redirect to apply.          |
   |                       |           |                                       |
   |                       |           | For example:                          |
   |                       |           |                                       |
   |                       |           | * If request is for pages in the      |
   |                       |           |   /docs folder, redirect to the       |
   |                       |           |   /documents folder.                  |
   |                       |           | * If request results in a 4xx HTTP    |
   |                       |           |   error, redirect the request to      |
   |                       |           |   another host to process the error.  |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule                           |
   +-----------------------+-----------+---------------------------------------+
   | KeyPrefixEquals       | String    | The object key name prefix when the   |
   |                       |           | redirect is applied.  For example, to |
   |                       |           | redirect requests for                 |
   |                       |           | ExamplePage.html, the key prefix is   | 
   |                       |           | ExamplePage.html. To redirect request |
   |                       |           | for all pages with the prefix docs/,  |
   |                       |           | the key prefix will be /docs, which   |
   |                       |           | identifies all objects in the docs/   |
   |                       |           | folder.                               |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule.Condition                 |
   |                       |           |                                       |
   |                       |           | Condition: Required when the parent   |
   |                       |           | element Condition is specified and    | 
   |                       |           | sibling HttpErrorCodeReturned Equals  |
   |                       |           | is not specified. If both conditions  |
   |                       |           | are specified, both must be true for  |
   |                       |           | the redirect to be applied.           |
   +-----------------------+-----------+---------------------------------------+
   | HttpErrorCodeReturn\  | String    | The HTTP error code when the redirect |
   | edEquals              |           | is applied. In the event of an error, |
   |                       |           | if the error code equals this value,  |
   |                       |           | then the specified redirect is        |
   |                       |           | applied.                              |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule.Condition                 |
   |                       |           |                                       |
   |                       |           | Condition: Required when parent       |
   |                       |           | Condition element is specified and    |
   |                       |           | sibling KeyPrefixEquals is not        |
   |                       |           | specified. If both are specified,     |
   |                       |           | then both must be true for the        |
   |                       |           | redirect to be applied.               |
   +-----------------------+-----------+---------------------------------------+
   | Redirect              | String    | Container for redirect information.   |
   |                       |           | You can redirect requests to another  |
   |                       |           | host, to another page, or with        |
   |                       |           | another protocol. In the event of an  |
   |                       |           | error, you can specify a different    |
   |                       |           | error code to return.                 |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule                           |
   +-----------------------+-----------+---------------------------------------+
   | Protocol              | String    | The protocol to use in the redirect   |
   |                       |           | request.                              |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule.RedirectValid             |
   |                       |           |                                       |
   |                       |           | Values: http, https                   |
   |                       |           |                                       |
   |                       |           | Condition: Not required if one of the |
   |                       |           | siblings is present                   |
   +-----------------------+-----------+---------------------------------------+
   | HostName              | String    | The host name to use in the redirect  |
   |                       |           | request.                              |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule.Redirect                  |
   |                       |           |                                       |
   |                       |           | Condition: Not required if one of the |
   |                       |           | siblings is present                   |
   +-----------------------+-----------+---------------------------------------+
   | ReplaceKeyPrefixWith  | String    | The object key prefix to use in the   |
   |                       |           | redirect request. For example, to     |
   |                       |           | redirect requests for all pages with  |
   |                       |           | the prefix "docs/" (objects in the    |
   |                       |           | docs/ folder) to documents/, set a    |
   |                       |           | condition block with KeyPrefixEquals  |
   |                       |           | set to docs/ and in the Redirect set  |
   |                       |           | ReplaceKeyPrefixWith to “documents”.  |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule.Redirect                  |
   |                       |           |                                       |
   |                       |           | Condition: Not required if one of the |
   |                       |           | the siblings is present. Can be       |
   |                       |           | present only ifReplaceKeyWith is not  |
   |                       |           | provided.                             |
   +-----------------------+-----------+---------------------------------------+
   | ReplaceKeyWith        | String    | The specific object key to use in the |
   |                       |           | redirect request. For example,        |
   |                       |           | redirect request to error.html.       |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule.Redirect                  |
   |                       |           |                                       |
   |                       |           | Condition: Not required if one of     |
   |                       |           | the siblings is present. Can be       |
   |                       |           | present only ifReplaceKeyPrefixWith   |
   |                       |           | is not provided.                      |
   +-----------------------+-----------+---------------------------------------+
   | HttpRedirectCode      | String    | The HTTP redirect code to use on the  |
   |                       |           | response.                             |
   |                       |           |                                       |
   |                       |           | Ancestors:                            |
   |                       |           | WebsiteConfiguration.RoutingRules.\   |
   |                       |           | RoutingRule.Redirect                  |
   |                       |           |                                       |
   |                       |           | Condition: Not required if one of the |
   |                       |           | siblings is present.                  |
   +-----------------------+-----------+---------------------------------------+

Responses
---------

**Response Headers**

Implementation of the PUT Bucket Website operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

**Response Elements**

The PUT Bucket Website operation does not return response elements.

Examples
--------

**Configure a Bucket as a Website (Add Website Configuration)**

This request configures a bucket, example.com, as a website. The
configuration in the request specifies index.html as the index document.
It also specifies the optional error document, SomeErrorDocument.html.

*Request Sample*

.. code::

   PUT ?website HTTP/1.1
   Host: example.com.s3.scality.com
   Content-Length: 256
   Date: Thu, 27 Jan 2011 12:00:00 GMT
   Authorization: {{authenticationInformation}}

.. code::

   <WebsiteConfiguration xmlns='http://s3.scality.com/doc/2006-03-01/'>
       <IndexDocument>
           <Suffix>index.html</Suffix>
       </IndexDocument>
       <ErrorDocument>
           <Key>SomeErrorDocument.html</Key>
       </ErrorDocument>
   </WebsiteConfiguration>

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: YgIPIfBiKa2bj0KMgUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 80CD4368BD211111
   Date: Thu, 27 Jan 2011 00:00:00 GMT
   Content-Length: 0
   Server: ScalityS3

Configure a Bucket as a Website but Redirect All Requests
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following request configures a bucket www.example.com as a website;
however, the configuration specifies that all GET requests for
thewww.example.com bucket’s website endpoint will be redirected to host
example.com.

*Request Sample*

.. code::

   PUT ?website HTTP/1.1
   Host: www.example.scality.com
   Content-Length: 256
   Date: Mon, 15 Feb 2016 15:30:07 GMT
   Authorization: {{authenticationInformation}}

.. code::

   <WebsiteConfiguration xmlns='http://s3.scality.com/doc/2006-03-01/'>
      <RedirectAllRequestsTo>
         <HostName>example.com</HostName>
       </RedirectAllRequestsTo>
   </WebsiteConfiguration>

**Configure a Bucket as a Website and Specify Optional Redirection Rules**

You can further customize the website configuration by adding routing
rules that redirect requests for one or more objects. For example,
suppose your bucket contained the following objects:

-  index.html
-  docs/article1.html
-  docs/article2.html

If you decided to rename the folder from docs/ to documents/, you would
need to redirect requests for prefix /docs to documents/. For example, a
request for docs/article1.html will need to be redirected to
documents/article1.html. In this case, you update the website
configuration and add a routing rule as shown in the following request:

*Request Sample*

.. code::

   PUT ?website HTTP/1.1
   Host: www.example.com.s3.scality.com
   Content-Length: length-value
   Date: Thu, 27 Jan 2011 12:00:00 GMT
   Authorization: {{authenticationInformation}}

.. code::

   <WebsiteConfiguration xmlns='http://s3.scality.com/doc/2006-03-01/'>
     <IndexDocument>
       <Suffix>index.html</Suffix>
     </IndexDocument>
     <ErrorDocument>
       <Key>Error.html</Key>
     </ErrorDocument>

     <RoutingRules>
       <RoutingRule>
       <Condition>
         <KeyPrefixEquals>docs/</KeyPrefixEquals>
       </Condition>
       <Redirect>
         <ReplaceKeyPrefixWith>documents/</ReplaceKeyPrefixWith>
       </Redirect>
       </RoutingRule>
     </RoutingRules>
   </WebsiteConfiguration>

**Configure a Bucket as a Website and Redirect Errors**

You can use a routing rule to specify a condition that checks for a
specific HTTP error code. When a page request results in this error, you
can optionally reroute requests. For example, you might route requests
to another host and optionally process the error. The routing rule in
the following requests redirects requests to an EC2 instance in the
event of an HTTP error 404. For illustration, the redirect also inserts
an object key prefix report-404/ in the redirect. For example, if you
request a page ExamplePage.html and it results in a HTTP 404 error, the
request is routed to a page report-404/testPage.html on the specified
EC2 instance. If there is no routing rule and the HTTP error 404
occurred, then Error.html is returned.

*Request Sample*

.. code::

   PUT ?website HTTP/1.1
   Host: www.example.com.s3.scality.com
   Content-Length: 580
   Date: Thu, 27 Jan 2011 12:00:00 GMT
   Authorization: {{authenticationInformation}}

.. code::

   <WebsiteConfiguration xmlns='http://s3.scality.com/doc/2006-03-01/'>
     <IndexDocument>
       <Suffix>index.html</Suffix>
     </IndexDocument>
     <ErrorDocument>
       <Key>Error.html</Key>
     </ErrorDocument>

     <RoutingRules>
       <RoutingRule>
       <Condition>
         <HttpErrorCodeReturnedEquals>404</HttpErrorCodeReturnedEquals >
       </Condition>
       <Redirect>
         <HostName>ec2-11-22-333-44.compute-1.scality.com</HostName>
         <ReplaceKeyPrefixWith>report-404/</ReplaceKeyPrefixWith>
       </Redirect>
       </RoutingRule>
     </RoutingRules>
   </WebsiteConfiguration>

**Configure a Bucket as a Website and Redirect Folder Requests to a Page**

Suppose you have the following pages in your bucket:

-  images/photo1.jpg
-  images/photo2.jpg
-  images/photo3.jpg

And you want to route requests for all pages with the images/ prefix to
go to a single page, errorpage.html. You can add a website configuration
to your bucket with the routing rule shown in the following request.

*Request Sample*

.. code::

   PUT ?website HTTP/1.1
   Host: www.example.com.s3.scality.com
   Content-Length: 481
   Date: Thu, 27 Jan 2011 12:00:00 GMT
   Authorization: {{authenticationInformation}}

.. code::

   <WebsiteConfiguration xmlns='http://s3.scality.com/doc/2006-03-01/'>
     <IndexDocument>
       <Suffix>index.html</Suffix>
     </IndexDocument>
     <ErrorDocument>
       <Key>Error.html</Key>
     </ErrorDocument>

     <RoutingRules>
       <RoutingRule>
       <Condition>
         <KeyPrefixEquals>images/</KeyPrefixEquals>
       </Condition>
       <Redirect>
         <ReplaceKeyWith>errorpage.html</ReplaceKeyWith>
       </Redirect>
       </RoutingRule>
     </RoutingRules>
   </WebsiteConfiguration>
