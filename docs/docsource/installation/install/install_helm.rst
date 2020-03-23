.. _get_ready:

Install Helm
============

1. Change to the directory from which you will deploy Zenko:

   ::

     $ cd /path/to/installation

2. If Helm is not already installed on the machine from which you will be 
   conducting the deployment, install Helm on your cluster.
   as described at:  https://github.com/helm/helm#Install

    a. Download Helm:

       ::
        
         $ curl -LO "https://get.helm.sh/helm-v{{version-number}}-linux-amd64.tar.gz"

    #. Unpack the tarball:

       ::
	  
	 $ tar -xvzf helm-v{{version-number}}-linux-amd64.tar.gz

    #. Add Helm to your PATH:

       ::
	  
	 $ export PATH="$PATH:/path/to/helm"
	 $ source ~/.bashrc

3. Initialize Helm:
   
   ::

    $ helm init
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
    $

   Helm can now install applications on the Kubernetes cluster.

4. Go to https://github.com/Scality/Zenko/releases and download the latest
   stable version of Zenko.

5. Unzip or gunzip the file you just downloaded and change to the top-level
   (Zenko) directory.

