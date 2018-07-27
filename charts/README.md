Zenko Helm Chart
================

This is a [Helm] Chart for [Scality]'s [Zenko] multi-cloud controller. To get
started, you'll need a [Kubernetes] cluster, initialized with Helm. Check out
[minikube](./minikube.md) for a local or single-machine deployment.

First, retrieve all dependencies:

```console
$ helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator
"incubator" has been added to your repositories

$ helm repo add scality https://scality.github.io/charts/
"scality" has been added to your repositories

$ helm dependency build zenko/
Hang tight while we grab the latest from your chart repositories...
...Unable to get an update from the "local" chart repository (http://127.0.0.1:8879/charts):
	Get http://127.0.0.1:8879/charts/index.yaml: dial tcp 127.0.0.1:8879: connect: connection refused
...Successfully got an update from the "scality" chart repository
...Successfully got an update from the "incubator" chart repository
...Successfully got an update from the "coreos" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete. ⎈Happy Helming!⎈
Saving 11 charts
Downloading prometheus from repo https://kubernetes-charts.storage.googleapis.com/
Downloading mongodb-replicaset from repo https://kubernetes-charts.storage.googleapis.com/
Downloading kafka from repo http://storage.googleapis.com/kubernetes-charts-incubator
Downloading zookeeper from repo http://storage.googleapis.com/kubernetes-charts-incubator
Downloading redis-ha from repo https://scality.github.io/charts/
Downloading grafana from repo https://kubernetes-charts.storage.googleapis.com/
Deleting outdated charts
```

**Note:** In released versions of Zenko and the Chart, these upstream charts
are embedded in the package created by `helm package`.

Then, assuming you have an ingress controller running, run something like:

```shell
$ helm install --name zenko --set ingress.enabled=true \
--set ingress.hosts[0]=zenko.local \
--set cloudserver.endpoint=zenko.local zenko
```

You can disable integration with the [Orbit] management UI (enabled by default).

See `values.yml` for more options.

To disable Orbit, use:

```shell
--set cloudserver.orbit.enabled=false
```

If a custom Orbit endpoint is required, use:

```shell
--set cloudserver.orbit.endpoint=https://custom.orbit.endpoint
--set cloudserver.orbit.pushEndpoint=https://custom.push.orbit.endpoint
```

and if `poll` mode is needed, use:
```shell
--set cloudserver.orbit.mode=poll
```

**Note:** `poll` mode should only be used when long-lived websocket connections
are not available. In `poll` mode:

+ `orbit.pushEndpoint` setting will be ignored
+ Interactive features such as Multicloud Browser, Metadata Search, CRR object
  status and CRR object retry will not be available
+ Configuration updates may take up to a minute to propagate
+ Statistics reports are sent less frequently

Autoscaling
-----------

This chart can be configured to deploy a `HorizontalPodAutoscaler` for
`cloudserver`. This is disabled by default.

To set up autoscaling based on CPU consumption, configure the amount of CPU a
single `cloudserver` Pod requests. For example, to request one CPU to be
allocated:

```shell
--set cloudserver.resources.requests.cpu=1
```

Next, enable autoscaling using:

```shell
--set cloudserver.autoscaling.enabled=true
```

This scales up (and down) between 1 and 16 replicas, with 80% CPU
consumption as the per-Pod target.

These defaults can be modified using:

```shell
--set cloudserver.autoscaling.config.minReplicas=...
--set cloudserver.autoscaling.config.maxReplicas==...
--set cloudserver.autoscaling.config.targetCPUUtilizationPercentage=...
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

Upgrading Your Deployment
-------------------------

To upgrade an existing Zenko installation to the latest version or simply change deployment
configuration, you will need to run the following commands. This assumes that your release
name is `zenko` and that you have previously cloned the repository. 

```shell
$ cd Zenko/charts
$ git pull
$ helm dependency build ./zenko
$ helm upgrade zenko ./zenko
```

You may want to run an upgrade simulation, something highly recommended in production environments. 
For example: 

```shell
$ helm upgrade zenko ./zenko --dry-run --debug
```

**Note:** In a production environment you may want to take neccessary additional steps to validate
the upgrade before proceeding with the upgrade. Running the upgrade with the `--dry-run` flag will
simulate and try to validate a compatible upgrade. Running with the `--debug` will output all the
templated values and deployment configurations that will be installed. These are just basic validations
but upgrade implications should be fully taken into account by you and/or your Kubernetes administrator. 

[Helm]: https://helm.sh
[Scality]: https://scality.com
[Zenko]: https://zenko.io
[Kubernetes]: https://kubernetes.io
[Orbit]: https://admin.zenko.io/user
[Prometheus]: https://prometheus.io
