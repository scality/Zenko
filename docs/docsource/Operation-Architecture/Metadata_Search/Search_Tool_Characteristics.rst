Search Tool Characteristics
===========================

The S3 Search tool is a Scality-proprietary API extension to the AWS API.
S3 Search complies with AWS S3 search syntax, with certain noteworthy
differences. S3 Search is MongoDB-native, and addresses the S3 search through
queries encapsulated in a SQL WHERE predicate. It uses Perl-Compatible Regular
Expression (PCRE) search syntax.

Syntax
------

From the command line, a query must be structured as follows

::

    $ /bin/search_bucket.js -a {{access key}} -k {{secret key}} -b {{bucket name}} -q {{query {{SQL WHERE clause}} predicate}} -h {{host}} -p {{port}}

The access and secret key are the keys for access to the bucket host.
The host is the host address (IPv4, IPv6 or DNS). All fields must be
declared.

Example Search
--------------

The query syntax is shown in the following example

::

    $ bin/search_bucket.js -a PYMHLS58B6OD6UD6RFJS -k fPamoC8+Jybyw2QIi4dJFj/SS71NcgVWyq=b0DNA -b testbucket -q "\`last-modified\` LIKE \"2018-03-23T18:54:25.*\"" -h 10.233.45.127 -p 8001

Example Results
---------------

The search example above returns the following results

::

    <?xml version="1.0" encoding="UTF-8"?>
    <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
       <Name>testbucket</Name>
       <Prefix/>
       <Marker/>
       <MaxKeys>1000</MaxKeys>
       <IsTruncated>false</IsTruncated>
       <Contents>
           <Key>obj10</Key>
           <LastModified>2018-03-23T18:54:25.000Z</LastModified>
           <ETag>"54b0c58c7ce9f2a8b551351102ee0938"</ETag>
           <Size>14</Size>
           <Owner>
               <ID>12349df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47qwer</ID>
               <DisplayName>CustomAccount</DisplayName>
           </Owner>
           <StorageClass>STANDARD</StorageClass>
        </Contents>
        <Contents>
            <Key>obj11</Key>
            <LastModified>2018-03-23T18:54:25.061Z</LastModified>
            <ETag>"54b0c58c7ce9f2a8b551351102ee0938"</ETag>
            <Size>14</Size>
            <Owner>
                <ID>12349df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47qwer</ID>
                <DisplayName>CustomAccount</DisplayName>
            </Owner>
            <StorageClass>STANDARD</StorageClass>
        </Contents>
            [ . . .  ]
        <Contents>
            <Key>obj64</Key>
            <LastModified>2018-03-23T18:54:25.965Z</LastModified>
            <ETag>"54b0c58c7ce9f2a8b551351102ee0938"</ETag>
            <Size>14</Size>
            <Owner>
                <ID>12349df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47qwer</ID>
                <DisplayName>CustomAccount</DisplayName>
            </Owner>
            <StorageClass>STANDARD</StorageClass>
        </Contents>
    </ListBucketResult>

Searchable Metadata and Tags
----------------------------

Because Zenko supports two classes of custom tags, it is not possible to
list all the ways to search data in Zenko. At a mimimum, however, files
will have the following fields inscribed, and these will be searchable:

-  cache-control
-  content-disposition
-  content-encoding
-  dataStoreName
-  expires
-  content-length
-  content-type
-  content-md5
-  isDeleteMarker
-  isNull
-  location
-  nullVersionId
-  owner-display-name
-  owner-id
-  replication-status
-  versionId

Default Amazon S3 metatags:

-  x-amz-version-id
-  x-amz-server-version-id
-  x-amz-server-side-encryption
-  x-amz-server-side-encryption-aws-kms-key-id
-  x-amz-server-side-encryption-customer-algorithm
-  x-amz-website-redirect-location

Custom Metadata and Tags
------------------------

You can also search the following tags as you have defined them

-  key
-  tags: { }
-  x-amz-meta

.. _`Specifying Metadata Fields`: Specifying_Metadata_Fields.html
