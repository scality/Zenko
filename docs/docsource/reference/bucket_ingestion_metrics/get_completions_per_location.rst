GET Completions per Location	
============================	

This request retrieves the number of operations Zenko ingested	
(completed) from a specific location over the preceding 24 hours.	

**Endpoint**	

.. code::

   /_/backbeat/api/metrics/ingestion/<location>/completions	

**Sample Response**				

.. code::					

   {						
      "completions": {				
         "description":"Number of completed ingestion operations (count) in the last 86400 seconds",	
         "results": {
            "count":668900
         }
      }
   }