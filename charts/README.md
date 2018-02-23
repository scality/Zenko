Zenko Helm Chart
================
This is a [Helm] Chart for [Scality] [Zenko]. To get started, you'll need a
[Kubernetes] cluster, initialized with Helm.

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

One option to highlight is the ability to enabled [Orbit] integration (which is
disabled by default) and set a custom Orbit API endpoint (for development
purposes). 

To enable Orbit use:

```shell
--set cloudserver-front.orbit.enabled=true
```

If a custom Orbit endpoint is required use:

```shell
--set cloudserver-front.orbit.endpoint=https://dev.zenko.io
```

accordingly.

Prometheus Monitoring
---------------------
[Prometheus] is deployed as part of this stack. If you want to access its
built-in web UI, you may want to create an `Ingress` object. To do so
automatically, use something like

```shell
--set prometheus.server.ingress.enabled=true --set prometheus.server.ingress.hosts[0]=prometheus.local
```

[Helm]: https://helm.sh
[Scality]: https://scality.com
[Zenko]: https://zenko.io
[Kubernetes]: https://kubernetes.io
[Orbit]: https://admin.zenko.io/user
[Prometheus]: https://prometheus.io
