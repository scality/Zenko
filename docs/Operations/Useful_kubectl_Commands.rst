
=======================
Useful kubectl Commands
=======================

Get cluster info:

  ::

  $ kubectl cluster-info
  $ kubectl -n kube-ops cluster-info

Dump all of the cluster’s config files and logs into a folder:

  ::

  $ kubectl cluster-info dump --output-directory=/tmp/my-cluster\
  --all-namespaces=true

Get namespaces:

  ::

  $ kubectl get namespaces

List nodes:

  ::

  $ kubectl get nodes -o wide

Full information for a node:

  ::

  $ kubectl describe node <node-name>

List a namespace’s pods:

  ::

  $ kubectl -n <namespaces> get pods:

Add ``-o wide`` for extended information and ``-w`` to keep watching it.

Return full information for a pod:

  ::

  $ kubectl -n <namespaces> describe pod <pod-name>

Return the resource consumption of all pods/containers:

  ::

  $ kubectl top pod --all-namespaces --containers

List the ten previous log lines for pod-name and watch for new ones:

  ::

  $ kubectl logs -f --tail=10 <pod-name> -n <pod-namespace>

List a cluster’s persistent volumes:

  ::

  $ kubectl get pv

List a cluster’s persistent volume claims (persistent volumes that are
in use or bound):

  ::

  $ kubectl get pvc

List deployed services

  ::

  $ kubectl get services

Create a CentOS pod.

  ::

  $ kubectl run -it my-centos-pod --image=centos --restart=Never -- /bin/bash

This enables you to interact with other pods using their internal IPs.

Grab the IP of an es-client from outside the pod:

  ::

  $ kubectl get pods -n kube-ops -o wide | grep es-client

Then move into the centos pod and enter:

  ::

  $ curl http://<es-client-ip>:9200

You can also install packages with yum.

**Do not forget to** ``kubectl delete pod my-centos-pod`` **when you exit the
centos pod.**
