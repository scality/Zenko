Kibana
======

Kibana is an open-source log management tool that operates with
Elasticsearch and Logstash. Elasticsearch generates and stores log
information. Logstash gathers and processes these logs, and Kibana
provides a web visualization service that lets you search and visualize
them.

|image0|

When ``kubectl proxy`` is active, you can access Kibana at:

`http://localhost:8001/api/v1/namespaces/kube-ops/services/http:kibana:/proxy/app/kibana#/home?_g=()`_

 

.. |image0| image:: ../Resources/Images/Orbit_Screencaps/kibana_opening_screen.png
   :class: OneHundredPercent




.. _`Cerebro`: Cerebro.html
.. _`http://localhost:8001/api/v1/namespaces/kube-ops/services/http:kibana:/proxy/app/kibana#/home?_g=()`: http://localhost:8001/api/v1/namespaces/kube-ops/services/http:kibana:/proxy/app/kibana#/home?_g=()
