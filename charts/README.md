Zenko Helm Chart
================
This is a [Helm] Chart for [Scality] [Zenko]. To get started, you'll need a
[Kubernetes] cluster, initialized with Helm. Checkout the [minikube](./minikube.md) for 
a local or single machine deployment.

First, retrieve all dependencies:

```shell
$ helm repo add zenko-zookeeper https://scality.github.io/zenko-zookeeper/charts
"zenko-zookeeper" has been added to your repositories

$ helm dependency build zenko/
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "zenko-zookeeper" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete. ⎈Happy Helming!⎈
Saving 1 charts
Downloading zenko-zookeeper from repo https://scality.github.io/zenko-zookeeper/charts
Deleting outdated charts
```

Note: in released versions of Zenko and the Chart, these upstream Charts will
be embedded in the package created by `helm package`.

Then, assuming you have an Ingress Controller running, run something like

```shell
$ helm install --name zenko --set ingress.enabled=true --set ingress.hosts[0]=zenko.local --set cloudserver-front.endpoint=zenko.local zenko
```

See `values.yml` for more options.

One option to highlight is the ability to enable integration with the
[Orbit] management UI (which is disabled by default) and set a custom
Orbit API endpoint (for development purposes). 

To enable Orbit use:

```shell
--set cloudserver-front.orbit.enabled=true
```

If a custom Orbit endpoint is required use:

```shell
--set cloudserver-front.orbit.endpoint=https://dev.zenko.io
```

accordingly.

Autoscaling
-----------
This Chart can be configured to deploy a `HorizontalPodAutoscaler` for
`cloudserver-front`. This is disabled by default.

As an example, to set up autoscaling based on CPU consumption, you need to
configure the amount of CPU a single `cloudserver-front` Pod requests, e.g.

```shell
--set cloudserver-front.resources.requests.cpu=1
```

to request 1 CPU to be allocated.

Next, enable autoscaling using

```shell
--set cloudserver-front.autoscaling.enabled=true
```

This will scale up (and down) between 1 and 16 replicas, with 80% CPU
consumption as the per-Pod target.

These default can be adapted using

```shell
--set cloudserver-front.autoscaling.config.minReplicas=...
--set cloudserver-front.autoscaling.config.maxReplicas==...
--set cloudserver-front.autoscaling.config.targetCPUUtilizationPercentage=...
```

Prometheus Monitoring
---------------------
[Prometheus] is deployed as part of this stack. If you want to access its
built-in web UI, you may want to create an `Ingress` object. To do so
automatically, use something like

```shell
--set prometheus.server.ingress.enabled=true --set prometheus.server.ingress.hosts[0]=prometheus.local
```

Validating your deployment
--------------------------
To run some validation tests on your deployment, a test-suite is shipped with
the Zenko Chart. This suite can be invoked by running

```shell
$ helm test $RELEASE_NAME --cleanup
```

where `$RELEASE_NAME` must be replaced by the name you picked for the Helm
release, e.g. `zenko` in the example above.

[Helm]: https://helm.sh
[Scality]: https://scality.com
[Zenko]: https://zenko.io
[Kubernetes]: https://kubernetes.io
[Orbit]: https://admin.zenko.io/user
[Prometheus]: https://prometheus.io
