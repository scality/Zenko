.. _get_ready:

Install Helm
============

1. If you are using MetalK8s, use the MetalK8s virtual shell. Change to the
   directory from which you will deploy Zenko:

   ::

    (metal-k8s) $ cd /path/to/installation

   If you are not installing from MetalK8s, follow the instructions in
   Zenko/docs/gke.md to install Helm on your cluster.

2. If Helm is not already installed on the machine from which you will be 
   conducting the deployment, install it as described at: 
   https://github.com/helm/helm#Install

3. Initialize Helm:
   
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

4. Go to https://github.com/Scality/Zenko/releases and download the latest
   stable version of Zenko.

5. Unzip or gunzip the file you just downloaded and change to the top-level
   (Zenko) directory.

