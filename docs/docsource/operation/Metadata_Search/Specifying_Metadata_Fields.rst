==========================
Specifying Metadata Fields
==========================

To search common metadata headers, use the syntax:

 ::

   {metadata-key}{supported SQL operation}{search value}

For example:

 ::

   key = blueObject
   size > 0
   key LIKE "blue.*"

Custom user metadata must be prefixed with “\ ``x-amz-meta-``\ ”:

 ::

   x-amz-meta-{usermetadata-key}{supported SQL operation}{search value}

For example:

 ::

   x-amz-meta-color = blue
   x-amz-meta-color != red
   x-amz-meta-color LIKE "b.*"

Tag searches must be prefixed with “\ ``tags.``\ ”:

 ::

   tags.{tag-key}{supported SQL operation}{search value}

For example:

 ::

   tags.type = color




.. _`Differences from SQL`: Differences_from_SQL.html
