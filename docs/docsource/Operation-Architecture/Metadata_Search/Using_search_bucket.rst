Using search\_bucket
====================

To run searches using the search_bucket tool requires an installed and working
instance of CloudServer. Clone it from the GitHub repository at
`Scality/Cloudserver <https://github.com/scality/cloudserver>`_ and follow its
documentation to install it.

Verify that the search tool is installed by running the following command from
the project’s root directory:

::

    $ node bin/search_bucket

This produces the following output:

::

    Usage: search_bucket [options]

    Options:

      -V, --version                 output the version number
      -a, --access-key <accessKey>  Access key id
      -k, --secret-key <secretKey>  Secret access key
      -b, --bucket <bucket>         Name of the bucket
      -q, --query <query>           Search query
      -h, --host <host>             Host of the server
      -p, --port <port>             Port of the server
      -s                            --ssl
      -v, --verbose
      -h, --help                    output usage information

In the following examples, Zenko is accessible on endpoint
`http://zenko.local:80` and contains the bucket ``zenkobucket``.

-  To search for objects with metadata “\ ``blue``\ ”:

   ::

       $ node bin/search_bucket -a <AccessKey1> -k <verySecretKey1> -b zenkobucket -q "x-amz-meta-color=blue" -h zenko.local -p 80

-  The search for objects tagged with “\ ``type=color``\ ”:

   ::

       $ node bin/search_bucket -a <AccessKey1> -k <verySecretKey1> -b zenkobucket -q "tags.type=color" -h zenko.local -p 80




.. _`HTTP Search Requests`: HTTP_Search_Requests.html
