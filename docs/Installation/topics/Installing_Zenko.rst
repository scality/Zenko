.. _Installing Zenko:

Installing Zenko
################

Set up a cluster of five nodes conforming to the specifications listed above.
If you are using MetalK8s, do this by downloading the latest stable MetalK8s
source code from the MetalK8s releases page:
https://github.com/scality/metalk8s/releases. Follow the Quickstart guide
(in docs/usage/quickstart.rst) to install MetalK8s on your cluster.

When building your cluster, take sizing into account. If you are deploying
non-default sizing, make sure your volume sizing is sufficient. For MetalK8s,
you *must* size the volumes in the inventory during setup in
metalk8s/inventory/group_vars/kube-node.yml.

For a default sizing, paste the following into kube-node.yml:

.. code-block:: yaml
		
  metalk8s_lvm_default_vg: False
  metalk8s_lvm_vgs: ['vg_metalk8s']
  metalk8s_lvm_drives_vg_metalk8s: ['/dev/vdb']
  metalk8s_lvm_lvs_vg_metalk8s:
    lv01:
      size: 125G
    lv02:
      size: 125G
    lv03:
      size: 125G
    lv04:
      size: 62G
    lv05:
      size: 62G

For custom sizing, increase these base numbers.

For non-MetalK8s deployments, follow your vendor or community’s instructions for
configuring persistent voloumes at 500 Gi/node.


.. note::

   It is a best practice to install Zenko on a fresh cluster.

Get Ready
*********

1. If you are using MetalK8s, use the MetalK8s virtual shell. Change to the
   directory from which you will deploy Zenko:
   ::

    (metal-k8s) $ cd /path/to/installation

   If you are not installing from MetalK8s, follow the instructions in
   Zenko/docs/gke.md to install Helm on your cluster.

2. Initialize Helm:
   ::

    (metal-k8s) $ helm init
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
    (metal-k8s) $

   Helm can now install applications on the Kubernetes cluster.

3. Go to https://github.com/Scality/Zenko/releases and download the latest
   stable version of Zenko.

4. Unzip or gunzip the file you just downloaded and change to the top-level
   (Zenko) directory.

.. _Install Zenko:

Install Zenko
*************

Helm installs Zenko using packages of Kubernetes resource definitions known as
charts. These charts, which Helm follows for each Zenko component, can be found
under zenko/kubernetes/zenko/charts. For each component there is a Chart.yaml
file and a values.yaml file. Helm reads the Chart.yaml file to establish such
basic installation attributes as name and version number, and reads the values
file for instructions on how to deploy and configure the component. Though
manually editing the default settings in values.yaml is possible, it is much
better to write configuration changes and options to
:file:`zenko/kubernetes/zenko/options.yml`, which Helm can use to
overwrite the default settings presented in the charts.

Follow these steps to install Zenko with Ingress.

.. note::

   The following example is for a configuration using the NGINX ingress
   controller. If you are using a different ingress controller, substitute
   parameters as appropriate.


1. Create an options.yml file in Zenko/kubernetes/ to store deployment
   parameters. Enter the following parameters:
   ::

    ingress:
      enabled: "true"
      annotations:
        nginx.ingress.kubernetes.io/proxy-body-size: 0
      hosts:
        - zenko.local

    cloudserver:
      endpoint: "zenko.local"

   You can edit these parameters, using each component’s values.yaml file
   as your guide. Save this file.

2. To configure the ingress controller for HTTPS, go to
   “:doc:`configure_ingress`” for additional terms to add to this chart.

3. If your Zenko instance is behind a proxy, add the following lines to the
   options.yml file, entering your proxy’s IP addresses and port assignments:
   ::

    cloudserver:
      proxy:
        http: ""
        https: ""
        caCert: false
        no_proxy: ""

   If the HTTP proxy endpoint is set and the HTTPS one is not, the HTTP proxy
   will be used for HTTPS traffic as well.

  .. note::

   To avoid unexpected behavior, only specify one of the
   "http" or "https" proxy options.


4. Perform the following Helm installation from the kubernetes directory
   ::

    $ helm install --name my-zenko -f options.yml zenko

   If the command is successful, the output from Helm is extensive.

5. To see K8s’s progress creating pods for Zenko, the command:
   ::

    $ kubectl get pods -n default -o wide

   This returns a snapshot of pod creation. For a few minutes after the
   Helm install, some pods will show CrashLoopBackOff issues. This is
   expected behavior, because there is no launch order between pods.
   After a few minutes, all pods will enter Running mode.


6.  After installing or upgrading Zenko, some pods, which have done their work
    successfully, may linger in an Error or Completed state. For example:

     ::

       zenko-zenko-queue-config-abea05e0-7qp7d            0/1     Error       0     4m
       zenko-zenko-queue-config-abea05e0-7wwsv            0/1     Error       0     4m
       zenko-zenko-queue-config-abea05e0-88wgb            0/1     Error       0     4m
       zenko-zenko-queue-config-abea05e0-cg5b5            0/1     Error       0     4m
       zenko-zenko-queue-config-abea05e0-dwzw8            0/1     Error       0     7m
       zenko-zenko-queue-config-abea05e0-q94cc            0/1     Error       0     4m
       zenko-zenko-queue-config-abea05e0-s2f8x            0/1     Completed   0     4m
       zenko-zenko-queue-config-abea05e0-vkv65            0/1     Error       0     4m

     Verify that:

     * All pods are running (as described in the previous step).

     * One of the pods shows a "Completed" state.

     Once these criteria are satisfied, delete these configuration pods by
     deleting the job that spawned them.

     ::

       $ kubectl get jobs
       NAME                                  DESIRED   SUCCESSFUL   AGE
       zenko-zenko-queue-config-a86a68e3     1         1            8m

       $ kubectl delete jobs zenko-zenko-queue-config-a86a68e3
       job.batch "zenko-zenko-queue-config-a86a68e3" deleted

7. To register your Zenko instance for Orbit access, get your
   CloudServer’s name
   ::

    $ kubectl get -n default pods | grep cloudserver-manager
    my-zenko-cloudserver-manager-c76d6f96f-qrb9d      1/1   Running   0       3m

   Then grab your CloudServer’s logs with the command:
   ::

     $ kubectl logs my-zenko-cloudserver-manager-<id> | grep 'Instance ID'


   Using the present sample values, this command returns:
   ::

     $ kubectl logs my-zenko-cloudserver-manager-76f657695-j25wq | grep 'Instance ID'

     {"name":"S3","time":1532632170292,"req_id":"effb63b7e94aa902711d",\
     "level":"info","message":"this deployment's Instance ID is \
     7586e994-01f3-4b41-b223-beb4bcf6fff6","hostname":"my-zenko-cloudserver-\
     76f657695-j25wq","pid":19}

   Copy the instance ID.

8. Open https://admin.zenko.io/user in a web browser. You may be prompted to
   authenticate through Google.

9. Click the **Register My Instance** button.

10. Paste the instance ID into the Instance ID dialog. Name the instance what
    you will.

    Your instance is registered.
