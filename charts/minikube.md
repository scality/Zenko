### Requirements
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- [minikube](https://github.com/kubernetes/minikube/#installation) v0.25
  - [virtualbox](https://www.virtualbox.org/wiki/Downloads)
- [helm](https://github.com/kubernetes/helm#install) v2.8.2
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

The following assumes you have minikube (which requires virtualbox or other virtualization options),
kubectl, and helm installed (see links above). Once minikube, kubectl, and helm are installed,
start minikube with at least version 1.9 of kubernetes and perferably with 4GB of RAM (although the
default value of 2GB should work, we recommend 4GB or more) and enable the minikube ingress addon for communication.
#### NOTE the listed versions are known to be working properly as some edge release versions may have issues properly deploying
```shell
minikube start --kubernetes-version=v1.9.0 --memory 4096
minikube addons enable ingress
```
###### For installations requiring Role Based Access Control see [RBAC](#installation-using-rbac)

Once minikube has started, run the helm initialization.
```
helm init --wait
```
#### Older versions of helm may not work with the --wait flag

Clone the repo and go into the charts directory
```shell
git clone https://github.com/scality/Zenko.git
cd ./Zenko/charts
```

Once you have the repo cloned you can retrieve all dependencies:

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

With your dependencies built, you can run the following shell command to deploy a single node zenko stack with orbit enabled.
```shell
helm install --name zenko \
  --set prometheus.rbac.create=false \
  --set zenko-queue.rbac.enabled=false \
  --set redis-ha.rbac.create=false \
  -f single-node-values.yml zenko
```
#### NOTE that Orbit is enabled by default with these values

To view the Kubernetes dashboard type the following and will launch the dashboard in your default browser:
```shell
minikube dashboard
```
#### NOTE that once you helm install, it may take several minutes for all the pods to load and stabilize

The endpoint can now be accessed via the kubernetes cluster ip (run ```minikube ip``` to display the cluster ip)


## Installation Using RBAC
Some users might prefer testing with Role Based Access Control for development purposes and to
test features that are often enabled in production environments. To run a minikube environment
with RBAC enabled

```shell
minikube start --kubernetes-version=v1.9.0 --memory 4096 --extra config=apiserver.Authorization.Mode=RBAC

kubectl create clusterrolebinding add-on-cluster-admin --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

helm init --service-account tiller --wait
```

Clone the repo and go into the charts directory
```shell
git clone https://github.com/scality/Zenko.git
cd ./Zenko/charts
```

Once you have the repo cloned you can retrieve all dependencies:
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

With your dependencies built, you can run the following shell command to deploy a single node zenko stack with orbit enabled.
```shell
helm install --name zenko -f single-node-values.yml zenko
```
