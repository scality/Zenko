Deploying Zenko
===============
Zenko can be deployed using `Docker Swarm`_ or on a `Kubernetes`_ cluster.

.. _Docker Swarm: https://docs.docker.com/engine/swarm/
.. _Kubernetes: https://kubernetes.io/

Deploying Zenko on Docker Swarm
-------------------------------
To give Zenko a test-drive on Docker Swarm, see :doc:`swarm-testing`. For a
production-grade deployment, refer to :doc:`swarm-production`.

Deploying Zenko on Kubernetes
-----------------------------
To test Zenko running on Kubernetes on a development machine, here are the steps
to set up :doc:`Minikube <minikube>`. For production-grade deployments, use a
hosted service like the Google Cloud and the :doc:`GKE <gke>` documentation, or
deploy Zenko using :doc:`these instructions <kubernetes-generic>` on an existing
cluster. For on-premise Kubernetes deployments, we provide the MetalK8s_
distribution which is tailored to run Zenko.

.. _MetalK8s: https://github.com/Scality/metal-k8s

.. toctree::
   :hidden:

   swarm-testing
   swarm-production
   minikube
   gke
   kubernetes-generic
