.. _configure_ingress:

Configuring HTTPS Ingress for Zenko
===================================

If your Kubernetes cluster uses NGINX for ingress control, use the following
guidelines to configure HTTPS support. From the Zenko/kubernetes/zenko
directory:

1. Generate the certificate.
   ::

    $ openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -subj "/CN=zenko.local"

2. Store the certificate in a Kubernetes secret.
   ::

    $ kubectl create secret tls zenko-tls --key /tmp/tls.key --cert /tmp/tls.crt

3. Set Zenko chart values in options.yml to resemble:
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

4. Install or upgrade Zenko from this directory (Zenko/kubernetes/zenko). Helm
   will pick up the settings in options.yaml.
   ::

     $ helm upgrade --install -f options.yaml zenko .

Ports
-----

Zenko operates in the context of a Kubernetes cluster. Ingress and egress 
from the cluster are configured in the base setup of the cluster, using the 
conventional web protocols for secure and insecure transactions: HTTPS and 
HTTP over ports 443 and 80, respectively. 

Zenko can use either or both protocols to allow ingress/egress. If ingress 
is enabled, port 80 is used, unless SSL is configured. If SSL is configured,
then port 443 is required.

For other Kubernetes platforms, discuss the configuration with your vendor.

.. table:: 

   +-------+-------------------+
   | Port  | Protocol          |
   +=======+===================+
   | 80    | HTTP              |
   +-------+-------------------+
   | 443   | HTTPS             |
   +-------+-------------------+