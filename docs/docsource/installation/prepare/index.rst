Prepare
=======

Before installing Zenko, you must have a working, appropriately sized server or
cluster running with a live Kubernetes instance. The instructions here will
guide you to a baseline configuration that supports a Zenko installation in
either a high-availability cluster or a single-node Zenko instance.

Topology
--------

Deploying Zenko in a single-server context reduces hardware cost and complexity,
and offers Zenko features in a small footprint, but single-server deployment
sacrifices high availability: a single server is a single point of failure.

Deploying Zenko on a single server requires deploying Kubernetes on this server,
and ensuring that the endpoints and containers it administers are available to
it from that server.

Once Zenko is installed, Kubernetes manages system operations on all servers.
You will manage and reconfigure Zenko using Helm commands. 

.. toctree::
   :maxdepth: 2

   setting_up_a_cluster
   sizing
   configure_logical_volumes
   proxies
   preconfiguring_zenko

