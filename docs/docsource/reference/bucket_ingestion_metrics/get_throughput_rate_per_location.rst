GET Throughput per Location	
===========================

This request queries the managed S3 namespace for throughput, expressed as	
operations per second, over the preceding 15 minutes.	       

**Endpoint**  

.. code::

   /_/backbeat/api/metrics/ingestion/<location>/throughput	

**Sample Response**				

.. code::					

   {						
      "throughput": {				
         "description":"Current throughput for ingestion operations in ops/sec (count) in the last 900 seconds",	
         "results": {	      
            "count":"25.72"      
         } 
      } 
   } 