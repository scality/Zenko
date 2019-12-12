Zenko Helm Chart
================

This is a [Helm] Chart for [Scality]'s [Zenko] multi-cloud controller. To get
started, you'll need a [Kubernetes] cluster, initialized with Helm. Check out
[minikube](../docs/minikube.md) for a local or single-machine deployment. The below
assumes you have cloned the Zenko repository and already `cd` into this directory.

Assuming you have an ingress controller running, run something like:

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

Grafana Dashboards
---------------------

[Grafana] is deployed as a part of the Zenko chart. To access its
built-in web UI, you can expose its service through any method that your
platform supports. For example, if your Kubernetes cluster has an ingress
controller running, you can expose the service by creating an `Ingress` object.
To do so automatically during installation, use something like:

```shell
--set grafana.ingress.enabled=true --set grafana.ingress.hosts[0]=grafana.local
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
$ cd Zenko/kubernetes
$ git pull
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


Nightly Releases
----------------

Nightly releases are currently available under our [private chart registry](https://registry.scality.com). They're designed for dev purposes only, so that
you can get an early preview of what's about to be released.

### Install

They can be installed like the following:

```shell
# Add the zenko-dev repo to your helm setup
$ helm repo add zenko-dev https://registry.scality.com/chartrepo/zenko-dev
# Then you can install Zenko
$ helm install zenko-dev/zenko --version 1.2-nightly
```

### Upgrade

To update your nightly release setup you follow this commands:

```shell
# To ensure your repo is up to date
$ helm repo update
# Then upgrade your release
$ helm upgrade my-release zenko-dev/zenko --version 1.2-nightly
```

### Version Scheme

For the nightly version scheme we use the Major and Minor version of Zenko
(we use semver) suffixed by `-nightly`. So that it looks like the following
`${MAJOR_VERSION}.${MINOR_VERSION}-nightly`.

We also upload the same chart with a date suffix so that we can keep an history of every nightly.

[Helm]: https://helm.sh
[Scality]: https://scality.com
[Zenko]: https://zenko.io
[Kubernetes]: https://kubernetes.io
[Orbit]: https://admin.zenko.io/user
[Prometheus]: https://prometheus.io
[Grafana]: https://grafana.com
