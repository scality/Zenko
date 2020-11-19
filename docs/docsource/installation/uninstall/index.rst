Uninstall
=========

To uninstall/delete the “my-zenko” deployment, run:

::

  $ kubectl delete cosmos --all --purge

This deletes all Cosmos objects from Kubernetes. 
   
Then, run:

::
  
  $ helm delete my-zenko --purge

The Helm command removes all Kubernetes components associated with the chart and
deletes the deployed XDM instance.
