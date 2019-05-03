# Deploying and Configuring Minikube

## Requirements
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- [minikube](https://github.com/kubernetes/minikube/#installation) v1.0.1
- [virtualbox](https://www.virtualbox.org/wiki/Downloads)
- [helm](https://github.com/kubernetes/helm#install) v2.9.1
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

The following assumes you have Minikube (which requires VirtualBox or
other virtualization options), kubectl, and Helm installed (see links
above). Once Minikube, kubectl, and Helm are installed, start Minikube
with at least version 1.11.6 of Kubernetes and perferably with 4 GB of
RAM (although the default value of 2 GB should work, we recommend 4 GB
or more) and enable the Minikube ingress addon for communication.

**NOTE:** The listed versions are known to work. Some edge release versions may have issues properly deploying.

## Start Minikube and Helm

To install Minikube with role-based access control (RBAC), go to
[Installation with RBAC](#Installation with RBAC)

Otherwise:

```shell
$ minikube start --kubernetes-version=v1.11.6 --memory 4096
$ minikube addons enable ingress
```

Once Minikube has started, initialize Helm.

```
$ helm init --wait
```

Clone the repo and go into the kubernetes directory:

```shell
$ git clone https://github.com/scality/Zenko.git
$ cd ./Zenko/kubernetes
```
## Deploy Zenko

Run the following shell command to deploy a single-node Zenko stack with Orbit enabled.
```shell
$ helm install --name zenko \
  --set prometheus.rbac.create=false \
  --set zenko-queue.rbac.enabled=false \
  --set redis-ha.rbac.create=false \
  -f single-node-values.yaml zenko
```
**NOTE:** Orbit is enabled with these values by default.

## Launch Kubernetes

Enter the following command to launch the Kubernetes dashboard in your default browser:
```shell
$ minikube dashboard
```
**NOTE:** Once you install Helm, it may take several minutes for all the pods to load and stabilize.

The endpoint can now be accessed via the Kubernetes cluster ip (run
`minikube ip` to display the cluster ip). With Orbit remote
management now enabled for your Minikube deployment, you can
[register your instance](../docs/orbit_registration.md).

## Edit /etc/hosts

Write Minikube's IP address to the hosts table on your local machine.

`$ sudo cat '192.168.99.100 minikube'> /etc/hosts`

**NOTE:** Aliasing a domain name to the Minikube IP can reduce the likelihood
of typographical errors in further configurations, such as Orbit endpoint
configuration.

## Test Your Deployment

To test your Minikube deployment, run the example below. By default, Minikube
only exposes SSL port 443, so set your client/app to use SSL. Because Minikube
uses a self-signed certificate, you may get a security error. If so, either
configure Minikube to use a trusted certificate or simply ignore the
certificate.


```shell
$ cat /etc/hosts
127.0.0.1      localhost
127.0.1.1      machine
192.168.99.100 minikube

$ cat ~/.s3cfg
[default]
access_key = OZN3QAFKIS7K90YTLYP4
secret_key = 1Tix1ZbvzDtckDZLlSAr4+4AOzxRGsOtQduV297p
host_base = minikube
host_bucket = %(bucket).minikube
signature_v2 = False
use_https = True

$ s3cmd ls  --no-check-certificate

$
```

If you receive the depicted empty response to your first `ls`, communication
with Zenko hosted in Minikube was successful. To perform more complex
operations, configure your Zenko cluster by
[registering your instance](../docs/orbit_registation.md) on Orbit.
If you get errors, reach out to the [Zenko forum](https://forum.zenko.io/).

## Installation with RBAC

To test with role-based access control for development or to test features
often enabled in production environments, run a Minikube environment with RBAC
enabled.

```shell
$ minikube start --kubernetes-version=v1.9.0 --memory 4096 --extra config=apiserver.Authorization.Mode=RBAC

$ kubectl create clusterrolebinding add-on-cluster-admin --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

$ helm init --service-account tiller --wait
```

Clone the repo and go into the kubernetes directory.

```shell
$ git clone https://github.com/scality/Zenko.git
$ cd ./Zenko/kubernetes
```

Run the following shell command to deploy a single-node Zenko stack with Orbit enabled.
```shell
$ helm install --name zenko -f single-node-values.yaml zenko
```
