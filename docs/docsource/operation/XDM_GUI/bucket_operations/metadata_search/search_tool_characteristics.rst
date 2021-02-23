Search Tool Characteristics
===========================

The S3 Search tool is a Scality API extension to the AWS API. S3 Search
complies with AWS S3 search syntax, with certain noteworthy differences. S3
Search is MongoDB-native, and addresses the S3 search through queries
encapsulated in a SQL WHERE predicate. It uses Perl-Compatible Regular
Expression (PCRE) search syntax.

Searchable Metadata and Tags
----------------------------

Because |product| supports two classes of custom tags, it is not possible to
list all the ways to search data in |product|. At a mimimum, however, files will
have the following fields inscribed, and these will be searchable:

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

