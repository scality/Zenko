Zenko Helm Chart
================
This is a [Helm] Chart for [Scality] [Zenko]. To get started, you'll need a
[Kubernetes] cluster, initialized with Helm. Then, assuming you have an Ingress
Controller running, run something like

```shell
$ helm install --name zenko --set ingress.enabled=true --set ingress.hosts[0]=zenko.local .
```

See `values.yml` for more options.

[Helm]: https://helm.sh
[Scality]: https://scality.com
[Zenko]: https://zenko.io
[Kubernetes]: https://kubernetes.io
