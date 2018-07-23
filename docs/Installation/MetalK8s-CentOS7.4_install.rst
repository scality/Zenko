Introduction
============

This guide will help you quickly install Zenko on a MetalK8s cluster.
This is an online installation. Configuration guidelines are provided for
handling proxies.

Sizing
======

A minimum of three servers is required to run this product, but at least five
servers are recommended.

Each server is configured in an inventory file that identifies servers
and their basic configuration, including masters, etcds, and nodes.

A best minimal setup is three masters/etcds and five nodes.

**Sizing for MetalK8s** (to perform functional tests using a Scality
cloud lab, you can divide these requirements by two):

-  Cores

   -  2 for etcd
   -  4 for master
   -  4 for node

-  RAM

   -  4 GB for etcd
   -  8 GB for master
   -  8 GB for node

-  Storage (for the system)

   -  16 GB for etcd
   -  128 GB for master
   -  64 GB for node

**Sizing for Zenko**

-  Cores

   -  1 per node

-  RAM

   -  16 GB per node

-  Storage (separate device—not the system device)

   -  200 GB per node

Prerequisites
=============

All servers must be in CentOS 7.4, and accessible with ssh.

If you are behind a proxy, you must add the following lines to
/etc/environment:

::

    http_proxy=http://user;pass@<my-ip>:<my-port>

    https_proxy=http://user;pass@<my-ip>:<my-port>

    no_proxy=localhost,127.0.0.1,10.*

Installing MetalK8s
===================

Select a server on which to install MetalK8s. This can be a master or a
jump host that can access all servers and is in CentOS 7.4.

Get Ready
---------

The installation requires you to issue commands from within a virtual shell.
These preparatory steps let you access the virtual environment

1. Install python-virtualenv:

   ::

    $ yum install -y git python-virtualenv

2. Clone the MetalK8s install environment:

   ::

   $ git clone https://github.com/scality/metal-k8s.git

3. Change to the metal-k8s directory and make a virtual environment:

   ::

    $ cd metal-k8s
    $ make shell

The command line enters a virtual environment containing all tools
required to perform the remaining steps.

Install Metal K8s
-----------------

1. Define the cluster. Give it a memorable name ("my-metalk8s" in the
   present example) and create its folder.

  ::

   $ mkdir -p inventory/my-metalk8s

2. Define each role of the cluster in the hosts file
   (inventory/my-metalk8s/hosts).

   For example:

   ::

     kube-master-01 ansible_ssh_host=10.10.1.1
     kube-master-02 ansible_ssh_host=10.10.1.2
     kube-master-03 ansible_ssh_host=10.10.1.3
     kube-node-01 ansible_ssh_host=10.10.2.1
     kube-node-02 ansible_ssh_host=10.10.2.2
     kube-node-03 ansible_ssh_host=10.10.2.3
     kube-node-04 ansible_ssh_host=10.10.2.4
     kube-node-05 ansible_ssh_host=10.10.2.5

     [etcd]
     kube-master-01
     kube-master-02
     kube-master-03

     [kube-master]
     kube-master-01
     kube-master-02
     kube-master-03

     [kube-node]
     kube-node-01
     kube-node-02
     kube-node-03
     kube-node-04
     kube-node-05

     [k8s-cluster:children]
     kube-node
     kube-master

   You can easily edit this to match your cluster, provided you choose etcd
   and master correctly. Changing and migrating these roles is not simple,
   and remains to be improved. Moreover, having only three etcds means that
   when one is down, there is no quorum, so the cluster cannot be operated
   until the etcd returns. Although this does not stop running
   applications, cluster activities such as adding or removing a pod become
   impossible.

3. To finalize the cluster’s architecture, create a kube-node.yml file
   in the group\_vars directory that uniquely and exclusively defines
   each node’s storage location and the type of logical volume that
   shall be exposed.

   ::

   $ mkdir inventory/my-metalk8s/group_vars

   Here is a sample that satisfies Zenko’s current requirements. You need
   only to change the device paths of the drives. In this example, there
   are two drives per node, but it will work with only one.

   BE SURE ALL NODE SERVERS HAVE ATTACHED DEVICES.

   ::

    # ################# #
    # LVM configuration #
    # ################# #

    # Specify which VG and which drive to use in host_vars for each node
    metal_k8s_lvm:
      vgs:
        kubevg:
          drives: ["/dev/sdb","/dev/sdc"]
    debug: False

    storage_addon_dir: '{{ kube_config_dir }}/addons/storage_lvm'

    # ################ #
    # LVM confguration #
    # ################ #

    # Set the storage class setup on kubernetes node
    metal_k8s_storage_class:
      storage_classes:
        local-lvm:
          is_default: true
      lvm_conf:
        default_fstype: 'ext4'
        default_fs_force: False
        default_fs_opts: '-m 0'
        default_mount_opts: 'defaults'
        vgs:
          kubevg:
            host_path: '/mnt/kubevg'
            storage_class: 'local-lvm'
            volumes:
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

4. If you are behind a proxy, you must create an
   inventory/my-metalk8s/group\_vars/all.yml file. Here is a sample:

   ::

        ## Set these proxy values in order to update package manager and docker daemon to use proxies
        http_proxy: "http://user;pass@<proxy-ip>:<proxy-port>"
        https_proxy: "http://user;pass@<proxy-ip>:<proxy-port>"
        ## Refer to roles/kubespray-defaults/defaults/main.yml before modifying no_proxy
        no_proxy: "localhost,127.0.0.1,10.*"

5. Install metal-k8s with the following command:
   ::

    $ ansible-playbook -i inventory/my-metalk8s -b metal-k8s.yml

Post-Install
------------

When the installation is complete (this will take a few minutes), the playbook
displays:

::

    "kube_login": "kube",
    "kube_password": "iIQ1hYoqEisyzcZ",

The password is also written in the
inventory/my-metalk8s/credentials/kube\_user.creds file.

You can check the cluster with these commands:

::

    $ export KUBECONFIG=`pwd`/inventory/my-metalk8s/artifacts/admin.conf
    $ kubectl get nodes
    NAME             STATUS   ROLES     AGE       VERSION
    kube-master-01   Ready    master    1m        v1.10.2
    kube-master-02   Ready    master    1m        v1.10.2
    kube-master-03   Ready    master    1m        v1.10.2
    kube-node-01     Ready    node      1m        v1.10.2
    kube-node-02     Ready    node      1m        v1.10.2
    kube-node-03     Ready    node      1m        v1.10.2
    kube-node-04     Ready    node      1m        v1.10.2
    kube-node-05     Ready    node      1m        v1.10.2

To connect to the dashboard:

1. Create a proxy:

  ``$ kubectl proxy --port=8080``

2. Create a tunnel from your local machine to the server:

  ``$ ssh -L 8080:127.0.0.1:8080 root@``

3. Access the dashboard with this URL:

   http://localhost:8080/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy

The login is **kube**, with the password shown at the end of the
installation.

To access Grafana or Kibana, open an ssh tunnel like this:

http://localhost:8080/api/v1/namespaces/kube-ops/services/kube-prometheus-grafana:http/proxy

http://localhost:8080/api/v1/namespaces/kube-ops/services/kibana:/proxy

Updating MetalK8s
=================

Until a specific update process is developed, you must manually update
MetalK8s with a git pull in the install folder; then update it with:

::

     $ ansible-playbook -i inventory/my-metalk8s -b metal-k8s.yml

If your version was pulled before 7 June 2018, delete the es-data
deployment, because this part is now a statefulset pod. This cleans up
the cluster. You can delete the es-data deployment with the GUI
(**namespace: kube-ops**; **tab: deployment**) or by CLI:

::

    $ kubectl delete deployment -n kube-ops es-data

Installing Zenko
================

Get Ready
---------

1. Change directories (remaining in the MetalK8s virtual shell):

   ::

   $ cd ..

2. init Helm, which installs applications on a K8s cluster:

  ::

  $ helm init

3. Declare the ZooKeeper repository:

   ::

      $ helm repo add zenko-zookeeper https://scality.github.io/zenko-zookeeper/charts
      $ helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator

4. Clone the latest Zenko version:

   ::

   $ git clone https://github.com/scality/Zenko.git

5. Build all dependencies and make the package:

   ::

   $ cd Zenko/charts $ helm dependency build zenko/

Install Zenko
-------------
Follow these steps to install Zenko with Orbit and Ingress.

1. It’s a good idea to create an options.yml file to store all parameters.
   You can reuse this file to simplify future updates.

   ::

    ingress:
      annotations:
       nginx.ingress.kubernetes.io/proxy-body-size: 0
     enabled: "true"
     hosts:
       -  zenko.local

     cloudserver-front:
       endpoint: "zenko.local"
       orbit:
         enabled: "true"

2. Perform the following Helm installation:

 ::

  $ helm install --name my-zenko -f options.yml zenko


3. To follow how K8s is creating pods required for Zenko, use the command:

 ::

   $ kubectl get pods -n default -o wide -w


 You will see some pods CrashLoopBackOff. This is expected behavior, because
 there is no launch order between pods. After a few minutes all pods will be
 in the Running mode.

4. During this phase, you can edit zenko-cloudserver-front’s deployment
   template with the command:

 ::

 $ kubectl edit deploymeent my-zenko-cloudserver-front

 Add these lines to the env block:

 ::

  name: https_proxy
  value: http://user;pass@<proxy-ip>:<proxy-port>

  name: http_proxy
  value: http://user;pass@<proxy-ip>:<proxy-port>

  name: HTTPS_PROXY
  value: http://user;pass@<proxy-ip>:<proxy-port>

  name: HTTP_PROXY
  value: http://user;pass@<proxy-ip>:<proxy-port>

  name: no_proxy
  value: localhost,127.0.0.1,10.*

  name: NO_PROXY
  value: localhost,127.0.0.1,10.*

 MetalK8s will detect the change to the deployment template and will automatically
 restart the pods after writing the new settings.

5. To register your Zenko instance to Orbit, grab the name of your
   cloudserver-front

  ::

   $ kubectl get -n default pods | grep cloudserver

  Then grab the logs:

  ::

      $ kubectl logs my-zenko-cloudserver-front-<id> | grep 'Instance ID' \
      {"name":"S3","time":1526463653301,"req_id":"761468e4d04c8166a15c",\
      "level":"info","message":"this deployment's Instance ID is \
      **9839271a-c666-4507-b272-e0086ac5b6ee**","hostname":"my-zenko-\
      cloudserver-front-<id>","pid":25}


  Congratulations: you are ready to play!

Removing Zenko
==============

To remove Zenko from the MetalK8s cluster, you must delete it and
release all its storage.

::

    $ helm delete --purge my-zenko
    $ kubectl get pvc -o wide | awk -F\  '{print $1}' | grep -v \
    NAME | while read pvc; do kubectl delete pvc $pvc; done

In the MetalK8s install folder:

::

      $ ansible-playbook -i inventory/my-metalk8s -b reclaim-storage.yml

Useful Commands
===============

Get cluster info:

::

    $ kubectl cluster-info
    $ kubectl -n kube-ops cluster-info

Dump all of the cluster’s config files and logs into a folder:

::

    $ kubectl cluster-info dump --output-directory=/tmp/my-cluster \
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

Current Issues
==============

This is a list of known issues. Because this is a living product (not yet
in GA), you may encounter some issues.

-  cloudserver-front does not use proxy setup.

   If you are behind a proxy, edit the cloudserver-front/values.yaml file
   in the Zenko/charts folder and replace tag: 0.1.9 with tag:
   1.0-b216ced1-pensieve-5. Reinstall Zenko.

-  Replication is not working.

   Grab the name of the ``my-zenko-backbeat-producer-<id>`` pod and delete
   it with ``kubectl delete pods my-zenko-backbeat-producer-<id>``. This
   respawns a new pod, which will work. You must also recreate the
   replication setup in Orbit.

-  redis-ha-sentinel CrashLoop

   This issue is still open. Until it is fixed, you have to wait. Zenko
   works without it: only UTAPI is broken.

-  Max object size is 1M (because of the ingress)

   -  Create a file named options.yml

      ::

       ingress:
          annotations:
            nginx.ingress.kubernetes.io/proxy-body-size: 0

   - Apply it with:

    ::

       $ helm upgrade my-zenko --set cloudserver-front.orbit.enabled=true \
       --set ingress.enabled=true --set ingress.hosts[0]=zenko.local \
       --set cloudserver-front.endpoint=zenko.local -f options.yml zenko

-  Reclaim local storage space playbook is not compatible with new
   Kubernetes version.

   Open roles/reclaim\_local\_storage/tasks/main.yml for editing

   Replace the ``for`` block in line 13 with:

   ::

           {%- for pv in cluster_pv.json['items'] if pv.status.phase == "Released" -%}
               {%- set node = ((pv.spec.nodeAffinity.required.nodeSelectorTerms|first).matchExpressions
                    |first)['values']|first -%}
               {%- set _ = released_pv.setdefault(node, []).append(pv) -%}
           {%- endfor -%}
