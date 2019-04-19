Cerebro
=======

Cerebro enables users to monitor and manage Elasticsearch clusters from
a convenient, intuitive dashboard.

|image0|

The Cerebro dashboard offers a visualization of log information showing
how file systems are sharded, indexed, and distributed in in MetalK8s,
Scality’s free Kubernetes server.

If you have deployed Zenko using a MetalK8s cluster, use the following
URL to access the MetalK8s dashboard:

`http://localhost:8001/api/v1/namespaces/kube-ops/services/cerebro:http/proxy/#/overview?host=Metal
K8s <http://localhost:8001/api/v1/namespaces/kube-ops/services/cerebro:http/proxy/#/overview?host=MetalK8s>`__

With a kubectl proxy running, use the following URL to access the
Cerebro dashboard:

http://localhost:8001/api/v1/namespaces/kube-ops/services/cerebro:http/proxy/#/connect

Cerebro ships with MetalK8s. If you elect to run other Kubernetes
implementations, you will probably have access to other tools that do
the same or similar work, but you may want to install Cerebro. It’s
hosted at: \ https://github.com/lmenezes/cerebro.


.. |image0| image:: ../Resources/Images/Orbit_Screencaps/Cerebro_dashboard.png
   :class: OneHundredPercent
