GET Metrics for a Location	
==========================	

This request retrieves metrics for a single location, defined as a	
bucket in the Orbit UI. 	

The response from the endpoint is formatted identically to the	
Get All Metrics request, (completions, throughput, and pending 	
operations) but constrained to the requested location only.	

**Endpoint**	

.. code::

   /_/backbeat/api/metrics/ingestion/<location>/all

**Sample Response**			

.. code::				

   {					
      "completions": {			
         "description": "Number of completed ingestion operations (count) in the last 86400 seconds",	
         "results": {   
            "count":678979	
         } 
      },	 
      "throughput": {	
         "description": "Current throughput for ingestion operations in ops/sec (count) in the last 900 seconds",	
         "results": {   
            "count":"34.25"	
         } 
      },	 
      "pending": {	
         "description": "Number of pending ingestion operations (count)",	
         "results": {   
            "count":253417	
         } 
      }
   }