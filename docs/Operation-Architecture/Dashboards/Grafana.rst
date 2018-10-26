Grafana
=======

Grafana provides a “dashboard of dashboards” that offers deep insight
into ongoing operations. Installing the Zenko stack gives you access to
an “application-level” Grafana, which provides information about
CloudServer operations. Installing Zenko with MetalK8s also provides
access to “platform-level” Grafana, which provides information about
cluster operations.

Both require some setup, detailed in the installation guide, which ships
with the Zenko repository.

Application-Level Grafana
-------------------------

Deployed with all Zenko instances, application-level Grafana provides
insight into CloudServer operation.

Once your system and server are properly configured, access
application-level Grafana at http://grafana.local/login.

The Grafana login page displays:

|image0|

.. tip::

  If this doesn’t work, make sure you can access the IP address
  (i.e., that you’re in the same network/VPN as your cluster), that
  kubectl proxy is running between your local machine and the server, and
  that the server’s Ingress controller is configured and running.

The default login is “admin.” To obtain the admin password, run the
following command from the command line, substituting the name of your
Zenko instance for ``<my-zenko>``: 

::

    $ echo $(kubectl get secret <my-zenko>-grafana -o "jsonpath={.data['admin-password']}" | base64 --decode)

    Gcym51zKQG8PSDD2B7ch9h8cXFIu8xalmIQfdXkd

The Grafana dashboard displays:

|image1|

From the Home Dashboard, you can **Add Users**, **Install apps and
plugins**, or click through to the Cloudserver dashboard.

|image2|

Troubleshooting
~~~~~~~~~~~~~~~

**You don’t see the Grafana login page**

Possible reasons:

-  Grafana server is not set in /etc/hosts/

   Check that your local machine has the correct server IP address set
   in /etc/hosts (c:\\windows\\System32\\drivers\\etc\\hosts for Windows
   machines).

-  Ingress is not set.

   Run:

   ::

       $ helm upgrade <my-zenko> /path/to/zenko\
       --set grafana.ingress.enabled=true\
       --set grafana.ingress.hosts[0]=grafana.local

-  Grafana is not running on the server: 

   ::

       $ kubectl get pods | grep grafana

**Your admin password is rejected**

#. If you’re sure you have entered the admin password correctly (as
   produced by the echo command above), run:

   ::

       $ kubectl get pods | grep grafana

       my-zenko-grafana-5dbf57f648-wbnkg               3/3       Running   0          7m

#. Copy the first part of the result and restart Grafana on the server
   with: 

   ::

       $ kubectl delete pod my-zenko-grafana-5dbf57f648-wbnkg

   Your particular running instance will, of course, have a different
   working name and hashes.

#. Give Kubernetes a minute or so to bring the Grafana pod back up.

#. When ``kubectl get pods`` shows the new Grafana instance running and
   stable, retry the login.

Platform-Level Grafana
----------------------

Deployed with MetalK8s, Grafana provides the following views of Zenko
and Kubernetes services: 

-  Deployment
-  ElasticSearch
-  etcd
-  Kubernetes Capacity Planning
-  Kubernetes Cluster Health
-  Kubernetes Cluster Status
-  Kubernetes Cluster Control Plane Status
-  Kubernetes Resource Requests
-  Node Exporter Full
-  Nodes
-  Pods
-  Prometheus 2.0 Stats
-  StatefulSet

Access platform-level Grafana using this URL:
http://localhost:8001/api/v1/namespaces/kube-ops/services/kube-prometheus-grafana:http/proxy/?orgId=1


.. |image0| image:: ../Resources/Images/Orbit_Screencaps/Grafana_login_app-level.png
   :class: OneHundredPercent
.. |image1| image:: ../Resources/Images/Orbit_Screencaps/Grafana_app_level_dashboard.png
   :class: OneHundredPercent
.. |image2| image:: ../Resources/Images/Orbit_Screencaps/Grafana_app_level_CloudServer_dashboard.png
   :class: OneHundredPercent
