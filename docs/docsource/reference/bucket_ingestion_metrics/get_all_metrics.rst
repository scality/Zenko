GET All Metrics	
===============	

This request retrieves all metrics for all S3 Connector metadata	
ingestion locations. Zenko returns three categories of information	
(metrics) about system operations: completions, throughput, and 	
pending operations. Completions are returned for the preceding 24	
hours, throughput for the preceding 15 minutes, and pending    
transactions are returned as a simple aggregate.    

**Endpoint**	 

.. code::

   /_/backbeat/api/metrics/ingestion/all	

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