healthcheck/deep
================

Deep healthchecks return the health of every available partition for the
replication topic.

Rather than getting an internal status variable or calling an internal
status function to check the health of the replication topic, a deep
healthcheck produces and consumes a message directly to the replication
topic for every available partition.

If there is no HTTP response error, the response is a JSON-structured
object of:

.. code::

   topicPartition: <ok || error>,
   ...
   timeElapsed: <value>

Example Output
--------------

.. code::

   {
       "0":"ok",
       "1":"ok",
       "2":"error",
       "3":"ok",
       "4":"ok",
       "timeElapsed":560
   }
