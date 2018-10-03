Differences from SQL
====================

Metadata search queries are similar to the ``WHERE`` clauses of SQL queries,
but they differ in that:

-  Metadata search queries follow the PCRE (Perl-Compatible Regular
   Expression) format.

-  Metadata search queries do not require values with hyphens to be enclosed
   in backticks, ``(`)``

   -  SQL query

      ::

          `x-amz-meta-search-item` = `ice-cream-cone`

   -  Metadata Search query

      ::

          x-amz-meta-search-item = ice-cream-cone

-  Metadata search queries do not support all SQL operators.

   -  Supported SQL operators: ``=``, ``<``, ``>``, ``<=``, ``>=``,
      ``!=``, ``AND``, ``OR``, ``LIKE``, and ``<>``
   -  Unsupported SQL operators: ``NOT``, ``BETWEEN``, ``IN``, ``IS``,
      ``+``, ``-``, ``%``, ``^``, ``/``, ``*``, and ``!``

Using Regular Expressions in Metadata Search
--------------------------------------------

-  Regular expressions used in metadata search differ from SQL in that wild
   cards are represented with ``.*`` instead of ``%``.
-  Regex patterns must be wrapped in quotes. Failure to do this can lead
   to pattern misinterpretation.
-  Regex patterns can be written in the ``/pattern/`` syntax or simply
   as the pattern if regex options are not required, similar to PCRE.

The following searches, for example, return strings containing the
substring “helloworld”

::

    ".*helloworld.*"

::

    "/.*helloworld.*/"

::

    "/.*helloworld.*/i"





.. _`HTTP Search Requests`: HTTP_Search_Requests.html
