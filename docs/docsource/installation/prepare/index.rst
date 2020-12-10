Prepare
=======

Before installing |product|, you must have a working, appropriately sized server or
cluster running with a live Kubernetes instance. The instructions here will
guide you to a baseline configuration that supports a |product| installation in
a high-availability cluster. 

|product| is designed for cluster operation. You can deploy |product| on a single server
to reduce hardware cost and complexity, offering |product| features in a small
footprint, but single-server deployment sacrifices high availability: a single
server is a single point of failure. Deploying |product| on a single server requires
deploying Kubernetes on this server, and ensuring that the endpoints and
containers it administers are available to it from that server.

Once |product| is installed, Kubernetes manages system operation on all nodes.
You will manage and reconfigure |product| using Helm commands. 

.. toctree::
   :maxdepth: 2

   setting_up_a_cluster
   sizing
   node_setup
   configure_logical_volumes
   proxies
   preconfiguring_zenko

