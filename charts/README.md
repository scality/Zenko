Zenko Helm Chart
================

This is a [Helm] Chart for [Scality]'s [Zenko] multi-cloud controller. To get
started, you'll need a [Kubernetes] cluster, initialized with Helm. Check out
[minikube](./minikube.md) for a local or single-machine deployment.

First, retrieve all dependencies:

```console
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

**Note:** In released versions of Zenko and the Chart, these upstream charts
are embedded in the package created by `helm package`.

Then, assuming you have an ingress controller running, run something like:

```shell
$ helm install --name zenko --set ingress.enabled=true --set ingress.hosts[0]=zenko.local --set cloudserver-front.endpoint=zenko.local zenko
```

One noteworthy option is to enable integration with the [Orbit] management UI
(disabled by default) and set a custom Orbit API endpoint (for development
purposes).

See `values.yml` for more options.

To disable Orbit, use:

```shell
--set cloudserver-front.orbit.enabled=false
```

If a custom Orbit endpoint is required, use:

```shell
--set cloudserver-front.orbit.endpoint=https://dev.zenko.io
```

Autoscaling
-----------

This chart can be configured to deploy a `HorizontalPodAutoscaler` for
`cloudserver-front`. This is disabled by default.

To set up autoscaling based on CPU consumption, configure the amount of CPU a
single `cloudserver-front` Pod requests. For example, to request one CPU to be
allocated:

```shell
--set cloudserver-front.resources.requests.cpu=1
```

Next, enable autoscaling using:

```shell
--set cloudserver-front.autoscaling.enabled=true
```

This scales up (and down) between 1 and 16 replicas, with 80% CPU
consumption as the per-Pod target.

These defaults can be modified using:

```shell
--set cloudserver-front.autoscaling.config.minReplicas=...
--set cloudserver-front.autoscaling.config.maxReplicas==...
--set cloudserver-front.autoscaling.config.targetCPUUtilizationPercentage=...
```

Prometheus Monitoring
---------------------

[Prometheus] is deployed as part of this stack. To access its built-in web UI,
create an `Ingress` object. To do so automatically, use something like

```shell
--set prometheus.server.ingress.enabled=true --set prometheus.server.ingress.hosts[0]=prometheus.local
```

Validating Your Deployment
--------------------------

A test suite is shipped with the Zenko Chart to help you run validation tests on
your deployment. Invoke this suite by running:

```shell
$ helm test $RELEASE_NAME --cleanup
```

where `$RELEASE_NAME` is replaced by the name you picked for the Helm release;
`zenko` in the example above.

[Helm]: https://helm.sh
[Scality]: https://scality.com
[Zenko]: https://zenko.io
[Kubernetes]: https://kubernetes.io
[Orbit]: https://admin.zenko.io/user
[Prometheus]: https://prometheus.io
