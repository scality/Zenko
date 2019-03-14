Redis-Sentinel
==============

Zenko uses Redis-Sentinel to provide a highly available in-memory
database for processes in:

-  CRR (pause and retry feature)
-  CloudServer
-  Backbeat API

In general, Redis-Sentinel is useful for short-term database needs, such
as for a quick or temporary job, or for sharing as a shared database
between two or more services. Information stored in Redis can be
written, accessed, rewritten, and destroyed faster and more easily than
with a full-featured database.


