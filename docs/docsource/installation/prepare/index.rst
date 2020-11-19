Prepare
=======

Before installing XDM, you must have a working, appropriately sized server or
cluster running with a live Kubernetes instance. The instructions here will
guide you to a baseline configuration that supports a XDM installation in
a high-availability cluster. 

XDM is designed for cluster operation. You can deploy XDM on a single server
to reduce hardware cost and complexity, offering XDM features in a small
footprint, but single-server deployment sacrifices high availability: a single
server is a single point of failure. Deploying XDM on a single server requires
deploying Kubernetes on this server, and ensuring that the endpoints and
containers it administers are available to it from that server.

Once XDM is installed, Kubernetes manages system operation on all nodes.
You will manage and reconfigure XDM using Helm commands. 

.. toctree::
   :maxdepth: 2

   setting_up_a_cluster
   sizing
   node_setup
   configure_logical_volumes
   proxies
   preconfiguring_zenko

