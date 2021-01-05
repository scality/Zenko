.. _Metadata Search Operation:

Metadata Search Operation
=========================

The metadata search feature expands on the GET Bucket S3 API. It allows users to
conduct metadata searches by adding the custom |product| querystring parameter,
``search``. The ``search`` parameter is structured as a pseudo-SQL WHERE clause
and supports basic SQL operators. For example, ``"A=1 AND B=2 OR C=3"``. More
complex queries can also be made using nesting operators, “\ ``(``\ ” and “\
``)``\ ”.

The search process is as follows:

#. |product| receives a ``GET`` request containing a search parameter:

   ::

       GET /bucketname?search=key%3Dsearch-item HTTP/1.1
       Host: zenko.local:80
       Date: Wed, 18 Oct 2018 17:50:00 GMT
       Authorization: <authorization string>

#. CloudServer parses and validates the search string:

   -  If the search string is invalid, CloudServer returns an
      InvalidArgument error.
   -  If the search string is valid, CloudServer parses it and generates
      an abstract syntax tree (AST).

#. CloudServer passes the AST to the MongoDB backend as the query filter
   for retrieving objects in a bucket that satisfies the requested
   search conditions.

#. CloudServer parses the filtered results and returns them as the
   response.

   Search results are structured the same as GET Bucket results:

   ::

       <?xml version="1.0" encoding="UTF-8"?>
       <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
           <Name>bucketname</Name>
           <Prefix/>
           <Marker/>
           <MaxKeys>1000</MaxKeys>
           <IsTruncated>false</IsTruncated>
           <Contents>
               <Key>objectKey</Key>
               <LastModified>2018-04-19T18:31:49.426Z</LastModified>
               <ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag>
               <Size>0</Size>
               <Owner>
                   <ID>79a59df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47ef2be</ID>
                   <DisplayName>Bart</DisplayName>
               </Owner>
               <StorageClass>STANDARD</StorageClass>
           </Contents>
           <Contents>
               ...
           </Contents>
       </ListBucketResult>
