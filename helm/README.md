Zenko Helm Chart
================
This is a [Helm] Chart for [Scality] [Zenko]. To get started, you'll need a
[Kubernetes] cluster, initialized with Helm. Then, assuming you have an Ingress
Controller running, run something like

```shell
$ helm install --name zenko --set ingress.enabled=true --set ingress.hosts[0]=zenko.local --set cloudserver-front.endpoint=zenko.local zenko
```

See `values.yml` for more options.

One option to highlight is the ability to enabled [Orbit] integration (which is
disabled by default) and set a custom Orbit API endpoint (for development
purposes). Use

```shell
--set cloudserver-front.orbit.enabled=true
```

and

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
