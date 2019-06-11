GET Pending Object Count	
========================

This request retrieves the number of objects queued for Zenko	
ingestion.    

**Endpoint** 

.. code::

   /_/backbeat/api/metrics/ingestion/<location>/pending	

**Sample Response**				

.. code::					

   {						
      "pending": {				
         "description":"Number of pending ingestion operations (count)",	
         "results": {	     
            "count":253409	     
         } 
      } 
   }