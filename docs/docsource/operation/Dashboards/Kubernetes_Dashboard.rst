Kubernetes Dashboard
====================

The Kubernetes dashboard is the master dashboard for visualizing your
cluster’s performance. You can use a cloud-hosted version of Kubernetes,
or host it yourself using MetalK8s.

|image0|

Your Kubernetes user experience will vary depending on which Kubernetes
you use. At a minimum, you will see everything available to you by
kubectl commands.

Kubernetes is a Google-hosted open-source container management project,
which you can find at https://kubernetes.io/.

If kubectl is properly configured, you will find the Kubernetes dashboard
at http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/ .
If this doesn't work, see :ref:`Troubleshooting\ Cloud\ Dashboards`.

To access the Kubernetes dashboard, you must have a kubectl proxy
established, and you must export the path to KUBECONFIG as your local
environment variable. Scality offers detailed instructions for setting
up Kubernetes proxying in the MetalK8s Quickstart. These instructions
may prove useful to non-MetalK8s installations as well.

.. _`Grafana`: Grafana.html

.. |image0| image:: ../Resources/Images/Orbit_Screencaps/kubernetes_dashboard.png
   :class: OneHundredPercent
