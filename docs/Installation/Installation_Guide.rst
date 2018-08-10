.. spelling::

   Quickstart
   subdirectory
   Todo

Installation Guide
++++++++++++++++++

While it is possible to run Zenko on a single machine, it's designed for
cluster operation. If you can set up a Kubernetes cluster on your own, review
the **General Cluster Requirements** and skip to **Installing Zenko**, below.

Otherwise, you can set up a cluster quickly using MetalK8s_, Scality's
open-source Kubernetes cluster project, as described in "Setting Up a MetalK8s
Cluster," below.

The following section describes general cluster requirements, which are tested
on MetalK8s. Because MetalK8s is designed to operate without support from
public cloud resources, the following sizing requirements are assumed good for
other cloud Kubernetes deployments, where such resources are preinstalled and
available on demand.

####################
Setting Up a Cluster
####################

****************************
General Cluster Requirements
****************************

Setting up a testing cluster requires at least three machines (these can be
VMs) running CentOS_ 7.4 (The recommended mimimum for Zenko production service
is five server nodes with three masters/etcds, but for testing and
familiarization, three masters and three nodes is fine). You must have SSH
access to these machines and the deployment machine must have SSH access to the
others (each machine must be added to the deployment machine's known hosts).
Each machine acting as a Kubernetes_ node must also have at least one disk
available to provision storage volumes.

.. _MetalK8s: https://github.com/scality/metalk8s/
.. _CentOS: https://www.centos.org
.. _Kubernetes: https://kubernetes.io


Sizing
======

Sizing for MetalK8s
--------------------

-  Cores

   -  2 for etcd
   -  4 for master
   -  4 for node

-  RAM

   -  4 GB for etcd
   -  8 GB for master
   -  8 GB for node

-  Storage (for the system)

   -  20 GB for the root filesystem
   -  16 GB for etcd
   -  128 GB for master
   -  64 GB for node

Sizing for Zenko
----------------

-  Cores

   -  1 per node

-  RAM

   -  16 GB per node

-  Storage

   -  400 GB per node

   This requirement is not for the system device. You may have to attach a
   separate storage volume to your cloud server instance.

All servers must be in CentOS 7.4, and accessible with ssh.

Proxies
=======

If your cluster is behind a proxy, add the following lines to each machine’s
/etc/environment file:

::

    http_proxy=http://user;pass@<my-ip>:<my-port>
    https_proxy=http://user;pass@<my-ip>:<my-port>
    no_proxy=localhost,127.0.0.1,10.*

******************************
Setting Up a MetalK8s Cluster
******************************

You can deploy Zenko using any Kubernetes engine, but Scality’s MetalK8s
provides a stable, easy-to-deploy base for you to test Zenko in a live
Kubernetes cluster environment.


Clone or Copy the MetalK8s Git Repo
===================================

Download the latest stable MetalK8s repo from:

https://github.com/scality/metalk8s/releases

Put this repo onto your installation master:

.. code-block:: shell

   $ sftp centos@10.0.0.1
   Connected to 10.0.0.1
   sftp> put -r metalk8s

Define an Inventory
===================

Each server must be configured in an inventory that identifies servers and
their basic configuration, including masters, etcds, and nodes. You must create
an inventory to specify the machines on which the Ansible_-based deployment
system shall install MetalK8s. The inventory contains a *hosts* file, which
lists all hosts in the cluster, and, in a group_vars/ subdirectory, the
*kube-node.yml* configuration file.

.. _Ansible: https://www.ansible.com

To create an inventory:

1. Log in to the master machine and navigate to the MetalK8s repo.

2. Create a directory inside the metalk8s directory (for example,
   :file:`inventory/quickstart-cluster`) in which the inventory will
   be stored. Change to that directory.

   .. code-block:: shell

     $ cd metalk8s
     $ mkdir -p inventory/quickstart-cluster
     $ cd inventory/quickstart-cluster/

3. Create the :file:`hosts` file, which lists all hosts.

   .. code-block:: ini

     node-01 ansible_host=10.0.0.1 ansible_user=centos
     node-02 ansible_host=10.0.0.2 ansible_user=centos
     node-03 ansible_host=10.0.0.3 ansible_user=centos
     node-04 ansible_host=10.0.0.4 ansible_user=centos
     node-05 ansible_host=10.0.0.5 ansible_user=centos

     [kube-master]
     node-01
     node-02
     node-03
     node-04
     node-05

     [etcd]
     node-01
     node-02
     node-03
     node-04
     node-05

     [kube-node]
     node-01
     node-02
     node-03
     node-04
     node-05

     [k8s-cluster:children]
     kube-node
     kube-master

   Change the host names, IP addresses, and user names to conform to your
   infrastructure. For example, if your servers are named "server1", "server2",
   "server3", etc. copy the code block above and replace ALL instances of
   "node-0" with "server".

4. Create a :file:`group_vars` subdirectory in the directory you created in
   step 2 (the same directory as the :file:`hosts` file).

   .. code-block:: shell

    $ mkdir group_vars ; cd group_vars

5. Create a file, :file:`kube-node.yml`, in the :file:`group_vars`
   subdirectory of the inventory. This file declares how to set up storage
   (in the default configuration) on hosts in the *kube-node* group; that is,
   hosts on which pods shall be scheduled:

   .. code-block:: yaml

     metalk8s_lvm_drives_vg_metalk8s: ['/dev/vdb']
     metalk8s_lvm_lvs_vg_metalk8s:
      lv01:
        size: 52G
      lv02:
        size: 52G
      lv03:
        size: 52G
      lv04:
        size: 11G
      lv05:
        size: 11G
      lv06:
        size: 11G
      lv07:
        size: 5G
      lv08:
        size: 5G

   In this example, every kube-node host is assumed to have a disk
   available as :file:`/dev/vdb` that can be used to set up Kubernetes
   *PersistentVolumes*. For more information about storage, see
   :doc:`../architecture/storage`.


Enter the MetalK8s Virtual Environment Shell
============================================

To install MetalK8s, you must issue Ansible commands from within a virtual
shell.

To install a supported version of Ansible and its dependencies, along with
some Kubernetes tools (:program:`kubectl` and :program:`helm`), MetalK8s
provides a :program:`make` target that installs these in a local environment.
To enter this environment, run ``make shell`` (this takes a few seconds
when first run).

 ::

  $ make shell
  Creating virtualenv...
  Installing Python dependencies...
  Downloading kubectl...
  Downloading Helm...
  Launching MetalK8s shell environment. Run 'exit' to quit.
  (metalk8s) $


Deploy the Cluster
==================

Run the following command to deploy the cluster::

  (metalk8s) $ ansible-playbook -i inventory/quickstart-cluster -b playbooks/deploy.yml

Deployment takes about a half hour.

Inspect the Cluster
===================

Deployment creates a file,
:file:`inventory/quickstart-cluster/artifacts/admin.conf`, which contains
credentials to access the cluster. Export this location in the shell to give
the :program:`kubectl` and :program:`helm` tools the correct paths and
credentials to contact the cluster *kube-master* nodes::

  (metalk8s) $ export KUBECONFIG=`pwd`/inventory/quickstart-cluster/artifacts/admin.conf

If your system can reach port *6443* on the first *kube-master* node, you can

* List the nodes

  ::

   (metalk8s) $ kubectl get nodes
   NAME        STATUS    ROLES            AGE       VERSION
   node-01     Ready     master,node      1m        v1.10.4
   node-02     Ready     master,node      1m        v1.10.4
   node-03     Ready     master,node      1m        v1.10.4
   node-04     Ready     master,node      1m        v1.10.4
   node-05     Ready     master,node      1m        v1.10.4

* List all pods

  ::

    (metalk8s) $ kubectl get pods --all-namespaces
    NAMESPACE      NAME                                                   READY     STATUS      RESTARTS   AGE
    kube-ingress   nginx-ingress-controller-9d8jh                         1/1       Running     0          1m
    kube-ingress   nginx-ingress-controller-d7vvg                         1/1       Running     0          1m
    kube-ingress   nginx-ingress-controller-m8jpq                         1/1       Running     0          1m
    kube-ingress   nginx-ingress-default-backend-6664bc64c9-xsws5         1/1       Running     0          1m
    kube-ops       alertmanager-kube-prometheus-0                         2/2       Running     0          2m
    kube-ops       alertmanager-kube-prometheus-1                         2/2       Running     0          2m
    kube-ops       es-client-7cf569f5d8-2z974                             1/1       Running     0          2m
    kube-ops       es-client-7cf569f5d8-qq4h2                             1/1       Running     0          2m
    kube-ops       es-data-cd5446fff-pkmhn                                1/1       Running     0          2m
    kube-ops       es-data-cd5446fff-zzd2h                                1/1       Running     0          2m
    kube-ops       es-exporter-elasticsearch-exporter-7df5bcf58b-k9fdd    1/1       Running     3          1m

    [...]

    kube-system    kubernetes-dashboard-b795f77cd-qncpl                   1/1       Running     0          2m
    kube-system    metrics-server-5b59ccccfd-4brrz                        1/1       Running     0          2m
    kube-system    tiller-deploy-5c688d5f9b-ffzsg                         1/1       Running     0          2m

* Or list all deployed Helm_ applications::

    (metalk8s) $ helm list
    NAME                  REVISION  UPDATED                   STATUS    CHART                         NAMESPACE
    cerebro               1         Tue Jul 24 22:52:18 2018  DEPLOYED  cerebro-0.3.0                 kube-ops
    elasticsearch         1         Tue Jul 24 22:51:23 2018  DEPLOYED  elasticsearch-1.3.0           kube-ops
    elasticsearch-curator 1         Tue Jul 24 22:51:32 2018  DEPLOYED  elasticsearch-curator-0.3.0   kube-ops
    es-exporter           1         Tue Jul 24 22:52:07 2018  DEPLOYED  elasticsearch-exporter-0.2.0  kube-ops
    fluent-bit            1         Tue Jul 24 22:51:50 2018  DEPLOYED  fluent-bit-0.6.0              kube-ops
    fluentd               1         Tue Jul 24 22:51:41 2018  DEPLOYED  fluentd-0.1.4                 kube-ops
    heapster              1         Tue Jul 24 22:50:58 2018  DEPLOYED  heapster-0.3.0                kube-system
    kibana                1         Tue Jul 24 22:51:59 2018  DEPLOYED  kibana-0.8.0                  kube-ops
    kube-prometheus       1         Tue Jul 24 22:50:45 2018  DEPLOYED  kube-prometheus-0.0.96        kube-ops
    nginx-ingress         1         Tue Jul 24 22:49:30 2018  DEPLOYED  nginx-ingress-0.23.0          kube-ingress
    prometheus-operator   1         Tue Jul 24 22:50:03 2018  DEPLOYED  prometheus-operator-0.0.27    kube-ops

.. _Helm: https://www.helm.sh

Cluster Services
----------------

Services to operate and monitor your MetalK8s cluster are provided. To access
these remote services from your local machine:

1. Copy the credentials in
   :file:`inventory/quickstart-cluster/artifacts/admin.conf` to your local
   machine at ~/.kube . Export this path locally with

   ::

    $ export KUBECONFIG="~/.kube/admin.conf"

2. On your cluster, open port 6443 for remote access to cluster services.

3. Run ``kubectl proxy`` from your local machine. This opens a tunnel to
   the Kubernetes cluster. While this tunnel is up and running, the following
   tools are available:

   +-------------------------+---------------------------------------------------------+-------------------------------------------------------------------------------------------------+---------------------------------------+
   | Service                 | Role                                                    | Link                                                                                            | Notes                                 |
   +=========================+=========================================================+=================================================================================================+=======================================+
   | `Kubernetes dashboard`_ |A general purpose, web-based UI for Kubernetes clusters  | http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/ | Username: kube                        |
   |                         |                                                         |                                                                                                 |                                       |
   |                         |                                                         |                                                                                                 | Password: See inventory/quickstart-   |
   |                         |                                                         |                                                                                                 | cluster/credentials/kube_user.creds   |
   |                         |                                                         |                                                                                                 | in the Kubernetes host.               |
   +-------------------------+---------------------------------------------------------+-------------------------------------------------------------------------------------------------+---------------------------------------+
   | `Grafana`_              | Monitoring dashboards for cluster services              | http://localhost:8001/api/v1/namespaces/kube-ops/services/kube-prometheus-grafana:http/proxy/   |                                       |
   +-------------------------+---------------------------------------------------------+-------------------------------------------------------------------------------------------------+---------------------------------------+
   | `Cerebro`_              | An administration and monitoring console for            | http://localhost:8001/api/v1/namespaces/kube-ops/services/cerebro:http/proxy/                   |                                       |
   |                         | Elasticsearch clusters                                  |                                                                                                 |                                       |
   +-------------------------+---------------------------------------------------------+-------------------------------------------------------------------------------------------------+---------------------------------------+
   | `Kibana`_               | A search console for logs indexed in Elasticsearch      | http://localhost:8001/api/v1/namespaces/kube-ops/services/http:kibana:/proxy/                   |                                       |
   +-------------------------+---------------------------------------------------------+-------------------------------------------------------------------------------------------------+---------------------------------------+

.. _Kubernetes dashboard: https://github.com/kubernetes/dashboard
.. _Grafana: https://grafana.com
.. _Cerebro: https://github.com/lmenezes/cerebro
.. _Kibana: https://www.elastic.co/products/kibana/

################
Installing Zenko
################

*********
Get Ready
*********

1. If you are in the MetalK8s virtual shell, stay in it. Change to the
   directory from which you will deploy Zenko:

   ::

    $ cd

   If you are not installing from MetalK8s, follow the instructions
   in ../../charts/gke.md to install Helm on your cluster.


2. Initialize Helm:

   ::

    (metalk8s) [centos@node01 ~]$ helm init
    Creating /home/centos/.helm
    Creating /home/centos/.helm/repository
    Creating /home/centos/.helm/repository/cache
    Creating /home/centos/.helm/repository/local
    Creating /home/centos/.helm/plugins
    Creating /home/centos/.helm/starters
    Creating /home/centos/.helm/cache/archive
    Creating /home/centos/.helm/repository/repositories.yaml
    Adding stable repo with URL: https://kubernetes-charts.storage.googleapis.com
    Adding local repo with URL: http://127.0.0.1:8879/charts
    $HELM_HOME has been configured at /home/centos/.helm.
    Warning: Tiller is already installed in the cluster.
    (Use --client-only to suppress this message, or --upgrade to upgrade Tiller to the current version.)
    Happy Helming!
    (metalk8s) [centos@node01 ~]$

   Helm can now install applications on the Kubernetes cluster.

3. Retrieve all dependencies.

   ::

    $ helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator


4. Add the Scality repo to the Helm charts:

   ::

    $ helm repo add scality https://scality.github.io/charts/

5. Clone the latest Zenko version:

   ::

    $ git clone https://github.com/scality/Zenko.git
    Cloning into 'Zenko'...
    remote: Counting objects: 4335, done.
    remote: Compressing objects: 100% (10/10), done.
    remote: Total 4335 (delta 1), reused 4 (delta 0), pack-reused 4325
    Receiving objects: 100% (4335/4335), 1.25 MiB | 0 bytes/s, done.
    Resolving deltas: 100% (2841/2841), done.

6. Build all dependencies and make the package:

   ::

    $ cd Zenko/charts
    $ helm dependency build zenko/
    Hang tight while we grab the latest from your chart repositories...
    [...]
    Downloading grafana from repo https://kubernetes-charts.storage.googleapis.com/
    Deleting outdated charts

*************
Install Zenko
*************

Helm installs Zenko components using the charts assembled in the last step.
Helm follows charts for Backbeat, CloudServer, S3 Data, Zenko, and Zenko NFS.
Each of these components is represented in the zenko/charts directory, and for
each component there is a Chart.yaml file and a values.yaml file. Helm reads
the Chart.yaml file to establish basic installation attributes such as name
and version number, and reads the values file for instructions on how to deploy
and configure the component. Though manually editing the default settings in
values.yaml is possible, it is much better to write configuration changes and
options to :file:`Zenko/charts/options.yml`, which Helm can use to overwrite
the default settings presented in the charts.

Follow these steps to install Zenko with Ingress.

(**Note:** The following example is for a configuration usingthe NGINX ingress
controller. If you are using a different ingress controller, substitute
parameters as appropriate.)

1. Create an options.yml file in Zenko/charts/ to store deployment parameters.
   Enter the following parameters:

   ::

    ingress:
     enabled: "true"
     annotations:
       nginx.ingress.kubernetes.io/proxy-body-size: 0

    hosts:
      -  zenko.local

    cloudserver:
      endpoint: "zenko.local"

    grafana:
      ingress:
        enabled: true
  	    hosts:
  	      -  grafana.local


   You can edit these parameters, using each component’s values.yaml file
   as your guide. Save this file.

2. If your Zenko instance is behind a proxy, append the following
   lines to the options.yml file, substituting your proxy’s IP addresses
   and port assignments:

   ::

      proxy:
      http: ""
      https: ""
        caCert: false

   If the HTTP proxy endpoint is set and the HTTPS one is not, the
   HTTP proxy will be used for HTTPS traffic as well.

   **Note:** To avoid unexpected behavior, only specify one of the
   "http" or "https" proxy options.

3. Perform the following Helm installation from the charts directory

   ::

    $ helm install --name my-zenko -f options.yml zenko

   If the command is successful, the output from Helm is extensive.

4. To see K8s’s progress creating pods for Zenko, the command:

   ::

    $ kubectl get pods -n default -o wide

   This returns a snapshot of pod creation. For a few minutes after the
   Helm install, some pods will show CrashLoopBackOff issues. This is
   expected behavior, because there is no launch order between pods.
   After a few minutes, all pods will enter Running mode.

5. To register your Zenko instance for Orbit access, get your
   CloudServer’s name

   ::

    $ kubectl get -n default pods | grep cloudserver
    my-zenko-cloudserver-76f657695-j25wq              1/1   Running   0       3m
    my-zenko-cloudserver-manager-c76d6f96f-qrb9d      1/1   Running   0       3m

   Then grab your CloudServer’s logs with the command:

   ::

     $ kubectl logs my-zenko-cloudserver-<id> | grep 'Instance ID'


   Using the present sample values, this command returns:

   ::

     $ kubectl logs my-zenko-cloudserver-76f657695-j25wq | grep 'Instance ID'

     {"name":"S3","time":1532632170292,"req_id":"effb63b7e94aa902711d",\
     "level":"info","message":"this deployment's Instance ID is \
     7586e994-01f3-4b41-b223-beb4bcf6fff6","hostname":"my-zenko-cloudserver-\
     76f657695-j25wq","pid":19}

   Copy the instance ID.

6. Open https://admin.zenko.io/user in a web browser. You may be prompted to
   authenticate through Google.

7. Click the **Register My Instance** button.

8. Paste the instance ID into the Instance ID dialog. Name the instance what
   you will.

Your instance is registered.
