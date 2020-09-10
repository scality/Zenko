Supported Condition Keys and Operators in IAM Policies
======================================================

This topic lists the different keys and operators supported with IAM policies.

S3-Related Condition Keys
-------------------------

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +---------------------------------+----------------------------------------------------------+---------+
   | Condition Keys                  | Description                                              | Type    |
   +=================================+==========================================================+=========+
   | s3:x-amz-acl                    | Enables setting specific access permissions              | String  |
   |                                 | when uploading an object.                                |         |
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-grant-read             | Grants read access for both the object and the object's  | String  |
   |                                 | metadata. The x-amz-grant-read header must be            |         |
   |                                 | present in a request.                                    |         |                 
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-grant-write            | The x-amz-grant-write (write access) header must be      | String  |
   |                                 | present in a request.                                    |         |        
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-grant-read-acp         | The x-amz-grant-read-acp (read permissions for the ACL)  | String  |
   |                                 | header must be present in a request.                     |         |                    
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-grant-write-acp        | The x-amz-grant-write-acp (write permissions for the     | String  |
   |                                 | ACL) header must be present in a request.                |         |
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-grant-full-control     | The x-amz-grant-full-control (full control) header       | String  |
   |                                 | must be present in a request.                            |         |                    
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-copy-source            | Restricts the copy source to a specific bucket,          | String  |
   |                                 | a specific folder in the bucket, or a specific object    |         |
   |                                 | in a bucket.                                             |         |
   +---------------------------------+----------------------------------------------------------+---------+                                                    
   | s3:x-amz-metadata-directive     | Enforces certain behavior (COPY vs. REPLACE) when        | String  |
   |                                 | when objects are uploaded.                               |         |                               
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-server-side-encryption | Sets a user to specify this header in the request        | String  |
   |                                 | to ensure that the objects the user uploads are          |         |
   |                                 | encrypted when they are saved.                           |         |
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-storage-class          | Filters access by storage class.                         | String  |                              
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:VersionId                    | Filters access by a specific object version.             | String  |                                          
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:LocationConstraint           | Restricts a user to create a bucket in only a            | String  |
   |                                 | specific region.                                         |         |
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:delimiter                    | Sets a user to specify the delimiter paramater           | String  |
   |                                 | in the GET Bucket Object versions request.               |         |
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:max-keys                     | Limits the number of keys Amazon S3 returns in response  | Numeric |
   |                                 | to ListBucket requests by requiring the user to specify  |         |
   |                                 | the max-keys parameter.                                  |         |
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:prefix                       | Limits the response of the ListBucket API to key names   | String  |
   |                                 | with specific prefix.                                    |         |
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:signatureversion             | Identifies the AWS Signature version supported for the   | String  |
   |                                 | authenticated requests.                                  |         |        
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:authType                     | Restricts incoming requests to a specific authentication | String  |
   |                                 | method.                                                  |         |  
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:signatureAge                 | Identifies the length of time (in msec), in which a      | Numeric |
   |                                 | signature is valid in an authenticated request.          |         |                                    
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:x-amz-content-sha256         | Rejects unsigned content in buckets.                     | String  |                                    
   +---------------------------------+----------------------------------------------------------+---------+
   | s3:ObjLocationConstraint        | Sets a location constraint for an object on a            | String  |
   |                                 | PUT request using the                                    |         |
   |                                 | x-amz-meta-scal-location-constraint header.              |         |                             
   +---------------------------------+----------------------------------------------------------+---------+

STS- and IAM-Related Condition Keys
-----------------------------------

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +----------------+----------------------------------------------------+--------+
   | Condition Keys | Description                                        | Type   |
   +================+====================================================+========+
   | sts:ExternalId | A unique identifier that can be required when      | String |
   |                | assuming a role in another account.                |        |
   |                | If the account administrator to which the          |        |
   |                | role belongs provided an external ID, then         |        |
   |                | provide that value in the ExternalId parameter.    |        |
   |                |                                                    |        |
   |                | This value can be any string, such as a passphrase |        |
   |                | or account number.                                 |        |
   |                | The primary function of the external ID is to      |        |
   |                | address and prevent the "confused deputy" problem. |        |
   +----------------+----------------------------------------------------+--------+
   | iam:PolicyArn  | Checks the Amazon Resource Name (ARN) of           | ARN    |
   |                | a managed policy in requests that involve          |        |
   |                | a managed policy.                                  |        |
   +----------------+----------------------------------------------------+--------+

aws (global) Condition Keys
---------------------------

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto
   :class: longtable

   +----------------------------+--------------------------------------------+------------+
   | Condition Keys             | Description                                | Type       |
   +============================+============================================+============+
   | aws:CurrentTime            | Use this key to compare the date and time  | Date       |
   |                            | of the request with the date and time      |            |
   |                            | specified in the policy.                   |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:EpochTime              | Use this key to compare the date and time  | Date       |
   |                            | of the request in epoch or Unix time with  | Numeric    |
   |                            | the value specified in the policy.         |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:TokenIssueTime         | Use this key to compare the date and time  | Date       |
   |                            | that temporary security credentials        |            |
   |                            | were issued with the date and time         |            |
   |                            | specified in the policy.                   |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:MultiFactorAuthAge     | Use this key to compare the                | Numeric    |
   |                            | number of seconds since the                |            |
   |                            | requesting principal was authorized        |            |
   |                            | using MFA with the number                  |            |
   |                            | specified in the policy.                   |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:MultiFactorAuthPresent | Use this key to check whether multi-factor | Boolean    |
   |                            | authentication (MFA) was used to validate  |            |
   |                            | the temporary security credentials that    |            |
   |                            | made the request.                          |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:principaltype          | Use this key to compare the                | String     |
   |                            | type of principal making the request       |            |
   |                            | with the principal type specified          |            |
   |                            | in the policy.                             |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:referer                | Use this key to compare who referred       | String     |
   |                            | the request in the client browser with     |            |
   |                            | the referer specified in the policy.       |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:SecureTransport        | Use this key to check whether the          | Boolean    |
   |                            | request was sent using SSL.                |            |
   |                            | The request context returns                |            |
   |                            | ``true`` or ``false``. In a policy,        |            |
   |                            | specific actions are allowed only          |            |
   |                            | if the request is sent using SSL.          |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:SourceIp               | Use this key to compare the                | IP address |
   |                            | requester's IP address with the            |            |
   |                            | IP address specified in the policy.        |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:UserAgent              | Use this key to compare the                | String     |
   |                            | requester's client application with        |            |
   |                            | the application specified in the policy.   |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:userid                 | Use this key to compare the                | String     |
   |                            | requester's principal identifier with      |            |
   |                            | the ID specified in the policy.            |            |
   +----------------------------+--------------------------------------------+------------+
   | aws:username               | Use this key to compare the                | String     |
   |                            | requester's user name with                 |            |
   |                            | the user name specified in the policy.     |            |
   +----------------------------+--------------------------------------------+------------+

Supported Condition Operators
-----------------------------

String Condition Operators 
~~~~~~~~~~~~~~~~~~~~~~~~~~

Use string condition operators to set condition elements that restrict
access by comparing a key to a string value.

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +---------------------------+------------------------------------------+
   | Condition Operators       | Description                              |
   +===========================+==========================================+
   | StringEquals              | Exact matching, case sensitive           |
   +---------------------------+------------------------------------------+
   | StringNotEquals           | Negated matching                         |
   +---------------------------+------------------------------------------+
   | StringEqualsIgnoreCase    | Exact matching, ignoring case            |
   +---------------------------+------------------------------------------+
   | StringNotEqualsIgnoreCase | Negated matching, ignoring case          |
   +---------------------------+------------------------------------------+
   | StringLike                | Case-sensitive matching                  |
   |                           |                                          |
   |                           | Values can include a                     |
   |                           | multi-character match wildcard (\*)      |
   |                           | or a single-character match wildcard (?) |
   |                           | anywhere in the string.                  |
   +---------------------------+------------------------------------------+
   | StringNotLike             | Negated case-sensitive matching          |
   |                           |                                          |
   |                           | Values can include a                     |
   |                           | multi-character match wildcard (\*)      |
   |                           | or a single-character match wildcard (?) |
   |                           | anywhere in the string.                  |
   +---------------------------+------------------------------------------+

Numeric Condition Operators
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Use numeric condition operators to set condition elements that restrict
access by comparing a key to an integer or decimal value.

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +--------------------------+-----------------------------------+
   | Condition Operators      | Description                       |
   +==========================+===================================+
   | NumericEquals            | Matching                          |
   +--------------------------+-----------------------------------+
   | NumericNotEquals         | Negated matching                  |
   +--------------------------+-----------------------------------+
   | NumericLessThan          | "Less than" matching              |
   +--------------------------+-----------------------------------+
   | NumericLessThanEquals    | "Less than or equals" matching    |
   +--------------------------+-----------------------------------+
   | NumericGreaterThan       | "Greater than" matching           |
   +--------------------------+-----------------------------------+
   | NumericGreaterThanEquals | "Greater than or equals" matching |
   +--------------------------+-----------------------------------+

Date Condition Operators
~~~~~~~~~~~~~~~~~~~~~~~~

Use date condition operators to set condition elements that restrict access by
comparing a key to a date/time value.  Use these condition operators with the
``aws:CurrentTime`` or ``aws:EpochTime`` condition keys.

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +-----------------------+---------------------------------------+
   | Condition Operators   | Description                           |
   +=======================+=======================================+
   | DateEquals            | Matching a specific date              |
   +-----------------------+---------------------------------------+
   | DateNotEquals         | Negated matching                      |
   +-----------------------+---------------------------------------+
   | DateLessThan          | Matching before a specific date       |
   |                       | and time                              |
   +-----------------------+---------------------------------------+
   | DateLessThanEquals    | Matching at or before a specific date |
   |                       | and time                              |
   +-----------------------+---------------------------------------+
   | DateGreaterThan       | Matching after a specific a date      |
   |                       | and time                              |
   +-----------------------+---------------------------------------+
   | DateGreaterThanEquals | Matching at or after a specific date  |
   |                       | and time                              |
   +-----------------------+---------------------------------------+

Boolean Condition Operator
~~~~~~~~~~~~~~~~~~~~~~~~~~

Setting Boolean condition operators restricts access by comparing a key to a
``true`` or ``false`` conditions.  If the key specified in a policy condition is
not present in the request context, the values do not match.

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +---------------------+------------------+
   | Condition Operators | Description      |
   +=====================+==================+
   | Bool                | Boolean matching |
   +---------------------+------------------+

Binary Condition Operators
~~~~~~~~~~~~~~~~~~~~~~~~~~

Binary condition operators set condition elements to test binary-formatted key
values.  They compare the specified key's value, byte-for-byte, against a
base-64 encoded representation of the binary value in the policy.

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +---------------------+------------------+
   | Condition Operators | Description      |
   +=====================+==================+
   | BinaryEquals        | Matching         |
   +---------------------+------------------+
   | BinaryNotEquals     | Negated matching |
   +---------------------+------------------+

IP Address Condition Operators
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Use IP address condition operators to set condition elements that restrict
access by comparing a key to an IPv4 or IPv6 address or range of IP addresses.
Use these condition operators with the ``aws:SourceIp key``. 

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +---------------------+-----------------------------------+
   | Condition Operators | Description                       |
   +=====================+===================================+
   | IpAddress           | The specified IP address or range |
   +---------------------+-----------------------------------+
   | NotIpAddress        | All IP addresses except the       |
   |                     | specified IP address or range     |
   +---------------------+-----------------------------------+

Amazon Resource Name (ARN) Condition Operators
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Use Amazon Resource Name (ARN) condition operators to set condition elements
that restrict access by comparing a key to an ARN.
The ARN is considered a string.

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +---------------------+--------------------------------------------------+
   | Condition Operators | Description                                      |
   +=====================+==================================================+
   | ArnEquals/          | Case-sensitive ARN matching                      |
   | ArnLike             |                                                  |
   |                     | Each of the six colon-delimited components of    |
   |                     | the ARN is checked separately and each           |
   |                     | can include a multi-character match wildcard (\*)|
   |                     | or a single-character match wildcard (?).        |
   +---------------------+--------------------------------------------------+
   | ArnNotEquals/       | Negated matching for ARN.                        |
   | ArnNotLike          |                                                  |
   +---------------------+--------------------------------------------------+

Null Condition Operator
~~~~~~~~~~~~~~~~~~~~~~~

Use a null condition operator to check if a condition key is present at
the time of authorization. 

.. tabularcolumns::X{0.15\textwidth}X{0.70\textwidth}X{0.10\textwidth}
.. table::
   :widths: auto

   +---------------------+-------------------------------------------------+
   | Condition Operators | Description                                     |
   +=====================+=================================================+
   | Null                | When set to ``true``, the key does not exist.   | 
   |                     | It is null.                                     |
   |                     |                                                 |
   |                     | When set to ``false``, the key exists and its   |
   |                     | value is non-null.                              |
   +---------------------+-------------------------------------------------+
