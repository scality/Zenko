=============================
Configuring Ingress for Zenko
=============================

Zenko’s supported standard deployment uses MetalK8s with NGINX ingress
control. You can use other ingress controllers and other Kubernetes engines
to support Zenko, but all possible configurations of ingress controller and
Kubernetes engine are beyond scope.

If you are not using the default MetalK8s/NGINX deployment, use the following
guidelines for configuring your ingress controller.

1. Set security policies.
   ::

   $ openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -subj "/CN=zenko.local"

2. Generate and store certificates.
   ::

   $ kubectl create secret tls zenko-tls --key /tmp/tls.key --cert /tmp/tls.crt

3. Set Zenko chart values at Zenko/kubernetes/zenko/values.yaml to resemble:
   ::

    ingress:
       enabled: true
       hosts:
         - zenko.local
       max_body_size: 100m
       annotations:
       tls:
         - secretName: zenko-tls
           hosts:
             - zenko.local

4. Without changing directories, install Zenko.
   ::

    $ helm upgrade --install zenko .
