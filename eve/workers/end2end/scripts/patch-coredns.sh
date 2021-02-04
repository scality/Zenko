#!/bin/sh

set -exu

corefile='
.:53 {
    errors
    health {
        lameduck 5s
    }
    ready
    rewrite name exact keycloak.zenko.local keycloak-http.default.svc.cluster.local
    rewrite name regex (ui|sts|iam|management)\.zenko\.local ingress-nginx-controller.ingress-nginx.svc.cluster.local
    kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure
        fallthrough in-addr.arpa ip6.arpa
        ttl 30
    }
    prometheus :9153
    forward . /etc/resolv.conf
    cache 30
    loop
    reload
    loadbalance
}
'

kubectl create configmap coredns -n kube-system --from-literal=Corefile="$corefile" -o yaml --dry-run=client | kubectl apply -f - 
kubectl rollout restart -n kube-system deployment/coredns
kubectl rollout status -n kube-system deployment/coredns
