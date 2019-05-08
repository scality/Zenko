.. _S3 API config:

Setting Up S3 API Access
========================

Zenko supports a limited set of S3 API commands. For a comprehensive
listing of supported S3 commands, see the *Zenko Reference Guide*.

To access Zenko’s AWS S3 API, you must perform the following setup
tasks. In the present example, server 1 is modified to be the
AWS gateway.

#. Using SSH, open any server in a running Zenko instance.

   ::

       $ ssh centos@10.0.0.1

#. Install the EPEL libraries.

   ::

       [$centos@node-01 ~]$ sudo yum -y install epel-release

#. Install python-devel and python-pip

   ::

       [centos@node-01 ~]$ sudo yum -y install python-devel python-pip

#. Install awscli.

   ::

       [centos@node-01 ~]$ sudo pip install awscli

#. Edit /etc/hosts.

   ::

       [centos@node-01 ~]$ sudo vi /etc/hosts

#. Nominate a server node as zenko.local.

   ::

       # Ansible inventory hosts BEGIN
       10.0.0.1 node-01 node-01.cluster.local zenko.local
       10.0.0.2 node-02 node-02.cluster.local
       10.0.0.3 node-03 node-03.cluster.local
       10.0.0.4 node-04 node-04.cluster.local
       10.0.0.5 node-05 node-05.cluster.local
       # Ansible inventory hosts END

#. Retrieve your Zenko access key ID and Zenko secret access key.

#. Configure AWS using these keys.

   ::

       [centos@node-01 ~]$ aws configure
       AWS Access Key ID [None]: P6F776ZY4QZS7BY9E5KF
       AWS Secret Access Key [None]: lndN5vIeqL9K6g6HVKCMAjZbTX9KsCGw5Fa4MbRl
       Default region name [None]:
       Default output format [None]:

   Leave the Default region name and output format fields blank.

#. Enter a test AWS command.

   ::

       [centos@node-01 ~]$ aws s3 ls --endpoint http://zenko.local
       2018-09-07 18:33:34 wasabi-bucket
       2018-09-05 22:17:18 zenko-bucket-01

Zenko can now respond to the set of S3 commands documented in the
Reference Guide.

Setting Up Backbeat API Access
==============================

Backbeat can be accessed from the command line using calls to CloudServer. 
These calls must be formatted with authentication as described in this
section.

A pseudocode example of a model query is shown here.

.. code::

   Authorization = "AWS" + " " + ZenkoAccessKeyId + ":" + Signature;

   Signature = Base64( HMAC-SHA1( YourSecretAccessKeyID, UTF-8-Encoding-Of( StringToSign ) ) );

   StringToSign = HTTP-Verb + "\n" +
           Content-MD5 + "\n" +
           Content-Type + "\n" +
           Date + "\n" +
           CanonicalizedResource;

   CanonicalizedResource = [ "/" + "_/backbeat/api/" ] +
           <HTTP-Request-URI, from the protocol name up to the query string>

Where:

  * `ZenkoAccessKeyId` is the public access key associated with a user account
    (see the **Access Key** column in https://admin.zenko.io/accounts) and 

  * `YourSecretAccessKeyId` is the secret key associated with the requesting
    user ID. It is generated in Orbit when the user account is created (see 
    :ref:`add new user`). 

  * CanonicalizedResource is as described in the
    `AWS documentation`_

  * HTTP-Verb is PUT or GET.

You must follow the instructions at 
https://docs.aws.amazon.com/AmazonS3/latest/dev/RESTAuthentication.html to
generate the CanonicalizedResource credentials. A rudimentary script is provided 
below to help you formulate test requests with valid CanonicalResource
certification.

**Example Request:**

.. code::
   
   { host: ‘10.233.3.194’,
    port: 80,
    method: ‘GET’,
    path: ‘/_/backbeat/api/metrics/crr/all’,
    service: ‘s3’,
    headers:
      { Host: ‘10.233.3.194:80’,
         ‘X-Amz-Content-Sha256’: ‘e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855’,
         ‘X-Amz-Date’: ‘20190509T214138Z’,
         Authorization: ‘AWS4-HMAC-SHA256 Credential=BUQO8V4V6568AZKGWZ2H/20190509/us-east-1/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=69f85b5398e1b639407cce4f502bf0cb64b90a02462670f3467bcdb7b50bde9a’
      }
   }

**Example Response:**

.. code::

   {“backlog”:{“description”:“Number of incomplete replication operations (count)
   and number of incomplete bytes transferred (size)“,”results”:{“count”:0,
   “size”:0}},“completions”:{“description”:“Number of completed replication
   operations (count) and number of bytes transferred (size) in the last 86400 
   seconds”,“results”:{“count”:0,“size”:0}},“failures”:{“description”:“Number of
   failed replication operations (count) and bytes (size) in the last 86400
   seconds”,“results”:{“count”:0,“size”:0}},“throughput”:{“description”:“Current
   throughput for replication operations in ops/sec (count) and bytes/sec (size)
   in the last 900 seconds”,“results”:{“count”:“0.00",“size”:“0.00"}},“pending”:
   {“description”:“Number of pending replication operations (count) and bytes 
   (size)“,”results”:{“count”:0,“size”:0}}}

Helper Script
-------------

.. note::

   Scality does not offer any support or warranty for the following script.
   It is included as a convenience. You must edit it to suit your installation.

1. Access your Zenko cluster.
   
   .. code::

      $ ssh centos@10.0.0.1

   Substitute your cluster's IP address.

2. Install node.js.

   .. code::

      $ sudo yum install nodejs

3. Install AWS4.

   .. code::

      $ npm i aws4

4. Open a text editor and copy the following to a .js file.

   .. code::

      const http = require('http');
      const aws4 = require('aws4');

      const credentials = {
          accessKeyId: 'BUQO8V4V6568AZKGWZ2H',
          secretAccessKey: 'q=1/VU49a82z6W1owyT+u60dTofxb3Z817S2Ok13',
      };

      const headers = {
          host: '10.233.3.194',
          port: 80,
          method: 'GET',
          path: '/_/backbeat/api/metrics/crr/all',
          service: 's3',
      };

      const options = aws4.sign(headers, credentials);

      console.log(options);

      const req = http.request(options, res => {
          const body = [];
          res.on('data', chunk => body.push(chunk));
          res.on('end', () => console.log(body.join('')));
      });

      req.on('error', console.log);
      req.end();

5. Instantiate values for accessKeyId, secretAccessKey, host, and the method and
   path (route) you want to test and save a copy to another .js file 
   (test-request.js for the present example).

6. Run the script.

   .. code::

      $ node test-request.js


.. _`CRR Metrics and Healthcheck`: CRR_Metrics_and_Health.html

.. _`AWS documentation`: https://docs.aws.amazon.com/AmazonS3/latest/dev/RESTAuthentication.html#RESTAuthenticationRequestCanonicalization

