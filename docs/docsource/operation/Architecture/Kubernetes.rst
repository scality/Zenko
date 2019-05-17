Kubernetes
==========

Kubernetes is the essential manager for Zenko cloud instances, spawning
and destroying containerized services, load balancing, and managing
failover for a robust, highly available service.

Zenko operates with Kubernetes engines provided by all major cloud
storage providers, including Amazon Elastic Container Service for
Kubernetes (EKS), Microsoft Azure Kubernetes Service (AKS), and Google
Kubernetes Engine (GKE). Additionally, Scality provides MetalK8s, an
open-source Kubernetes engine you can deploy on a cluster to provide
Kubernetes service to maintain independence from cloud storage
providers.

MetalK8s
--------

MetalK8s provides a Kubernetes engine that can be hosted on a local or
virtual machine. Zenko uses Kubernetes to automate the deployment of
Clouderver instances whenever server operations cross pre-configured
thresholds. Kubernetes reduces the complexity of container service and
management previously addressed with Docker Swarm. MetalK8s, an
open-source Scality project, reduces the complexity of deploying
Kubernetes outside of a public cloud. You can use any Kubernetes
deployment to run Zenko, but MetalK8s offers total platform
independence.

MetalK8s builds on the Kubespray project to install a base Kubernetes
cluster, including all dependencies (like etcd), using the Ansible
provisioning tool. This installation includes operational tools, such as
Prometheus, Grafana, ElasticSearch, and Kibana, and deploys by default
with the popular NGINX ingress controller
(`ingress-nginx <https://github.com/kubernetes/ingress-nginx>`__). All
these are managed as Helm packages.

Unlike hosted Kubernetes solutions, where network-attached storage is
available and managed by the provider, MetalK8s is designed with the
assumption that it will be deployed in environments where no such
systems are available. Consequently, MetalK8s focuses on managing
node-local storage and exposing these volumes to containers managed in
the cluster.

MetalK8s is hosted at https://github.com/scality/metalk8s. Instructions
for deploying MetalK8s on your choice of hardware (real or virtual) are
provided in the project’s Quickstart. Documentation is available
at: https://metal-k8s.readthedocs.io/. Installation instructions
specific to deploying MetalK8s for Zenko are included in the Zenko
*Installation Guide*.