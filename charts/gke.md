# Install Zenko on Google Cloud Kubernetes Engine

Zenko can be installed on a Kubernetes cluster managed on Google Cloud
(GKE). Start a new cluster on Kubernetes following the instructions on
[Google Cloud documentation](https://cloud.google.com/kubernetes-engine/docs/quickstart).

To run Zenko you'll need a cluster with three nodes, each with 2 vCPUs
and 7.5 GB RAM. Once the cluster is running, connect to it and install Helm.

## Create Role for Tiller

Google Kubernetes Engine requires role-based access control. To set it up:

Create a `serviceaccount` for `tiller`:

```shell
$ kubectl create serviceaccount tiller --namespace kube-system
```

Check that the correct context is set:

```shell
$ kubectl get nodes
NAME                                       STATUS   ROLES    AGE VERSION
gke-cluster-1-default-pool-9ad69bcf-4g2n   Ready    <none>   1m  v1.8.10-gke.0
gke-cluster-1-default-pool-9ad69bcf-frj5   Ready    <none>   1m  v1.8.10-gke.0
gke-cluster-1-default-pool-9ad69bcf-rsbt   Ready    <none>   1m  v1.8.10-gke.0
```

## Install Helm on GKE Cluster

Helm is not available by default on GKE and must be installed.

```shell
$ curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
$ bash ./get_helm.sh
```

Once Helm is installed, start it:

```shell
$ helm init --service-account tiller --wait
```
## Install Zenko

1. Clone Zenko's repo and navigate to the Zenko/charts directory:

```shell
$ git clone https://github.com/scality/Zenko.git
$ cd ./Zenko/charts
```

2. Retrieve all dependencies:

```shell
$ helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator
"incubator" has been added to your repositories

$ helm dependency build zenko/
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "incubator" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete. ⎈Happy Helming!⎈
Saving 8 charts
Downloading prometheus from repo https://kubernetes-charts.storage.googleapis.com/
Downloading mongodb-replicaset from repo https://kubernetes-charts.storage.googleapis.com/
Downloading redis from repo https://kubernetes-charts.storage.googleapis.com/
Downloading kafka from repo http://storage.googleapis.com/kubernetes-charts-incubator
Downloading zookeeper from repo http://storage.googleapis.com/kubernetes-charts-incubator
Deleting outdated charts
```

3. Run the following shell command to deploy a three-node Zenko stack with
Orbit enabled.


```shell
$ helm install --name zenko --set ingress.enabled=true zenko
```
## Connect GKE Zenko to Orbit

Find the `Instance ID` to use for [registering your
instance](../docs/orbit_registration.md):

```shell
$ kubectl logs $(kubectl get pods --no-headers=true -o \
custom-columns=:metadata.name | grep cloudserver) | grep \
Instance | tail -n 1
```

The output will resemble:

```
{"name":"S3","time":1529101607249,"req_id":"9089628bad40b9a255fd","level":"info","message":"this deployment's Instance ID is 6075357a-b08d-419e-9af8-cc9f391ca8e2","hostname":"zenko-cloudserver-f74d8c48c-dt6fc","pid":23}
```
