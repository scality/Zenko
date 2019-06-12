Bucket Ingestion Metrics
========================

Zenko can make queries against S3 Connector instances named as bucket
locations under its management. Querying the managed namespace, Zenko
can retrieve information about the number of transfers completed and
pending, and the rate at which they are completing.

Zenko provides a REST API that makes these metrics available to users. To
access these, make a request to the endpoints as specified in the following
sections. Enter the listed endpoints verbatim, substituting a location
that matches the bucket/location queried if the query requires it.

For example,

.. code::

    $ curl http://zenko-instance.net/_/backbeat/api/metrics/ingestion/us-west-video-dailies/all

where zenko-instance.net is the Zenko server's URL and us-west-video-dailies		
is the bucket name (location).

.. toctree::
   :maxdepth: 2

   get_all_metrics
   get_metrics_per_location
   get_throughput_rate_per_location
   get_completions_per_location
   get_pending_object_count