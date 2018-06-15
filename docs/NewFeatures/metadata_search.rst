Metadata Search
---------------

Zenko offers users the ability to perform S3 database searches through a
graphical search tool or from the command line.

The S3 Search tool extends the existing GET Bucket S3 API, introducing a
custom Zenko query string parameter, “search.” S3 Search complies with
AWS S3 search syntax with certain noteworthy differences: S3 Search is
MongoDB-native, and addresses the S3 search through queries encapsulated
in a SQL WHERE predicate. S3 Search uses Perl-Compatible Regular
Expression (PCRE) search syntax. The search parameter is a pseudo-SQL
WHERE clause that supports basic SQL operators, allowing a range or
simple and complex SQL-like queries.
